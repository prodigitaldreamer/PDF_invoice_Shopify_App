# -*- coding: utf-8 -*-
import base64
import hashlib
import hmac
import json
from abc import ABC
from os import abort
from urllib.parse import urlencode

from werkzeug.http import dump_cookie
from werkzeug.utils import redirect
import werkzeug
from odoo import http, fields
import traceback
import shopify
from odoo.http import request, Response
from odoo.service import security
from odoo.tools import date_utils
from ..oauth2.auth import ShopifyHelper as ShopifyHelper, ShopifyAuth
from ..oauth2.decorator import shop_login_required
from datetime import datetime

SHOPIFY_APP_REDIRECT_PATH = '/admin/apps/'

import logging

_logger = logging.getLogger(__name__)


class Request(http.Request):
    def _save_session(self):
        sess = self.session
        if not sess.can_save:
            return

        if sess.should_rotate:
            sess['_geoip'] = self.geoip
            root.session_store.rotate(sess, self.env)  # it saves
        elif sess.is_dirty:
            sess['_geoip'] = self.geoip
            root.session_store.save(sess)

        cookie_sid = self.httprequest.cookies.get('session_id')
        if not sess.is_explicit and (sess.is_dirty or cookie_sid != sess.sid):
            cookie = dump_cookie('session_id', request.session.sid, max_age=90 * 24 * 60 * 60, secure=True,
                                 httponly=True)
            cookie = "{}; {}".format(cookie, b'SameSite=None'.decode('latin1'))
            self.future_response.headers.add('Set-Cookie', cookie)

    def make_json_response(self, data, headers=None, cookies=None, status=200):
        """ Helper for JSON responses, it json-serializes ``data`` and
        sets the Content-Type header accordingly if none is provided.

        :param data: the data that will be json-serialized into the response body
        :param int status: http status code
        :param List[(str, str)] headers: HTTP headers to set on the response
        :param collections.abc.Mapping cookies: cookies to set on the client
        :rtype: :class:`~odoo.http.Response`
        """
        data = json.dumps(data, ensure_ascii=False, default=date_utils.json_default)

        headers = werkzeug.datastructures.Headers(headers)
        headers['Content-Length'] = len(data)
        if 'Content-Type' not in headers:
            headers['Content-Type'] = 'application/json; charset=utf-8'

        return self.make_response(data, headers.to_wsgi_list(), cookies, status)


http.Request.make_json_response = Request.make_json_response
http.Request._save_session = Request._save_session
root = http.Application()


class JsonRPCDispatcher(http.JsonRPCDispatcher):
    def _response(self, result=None, error=None):
        # request_id = self.jsonrequest.get('id')
        # response = {'jsonrpc': '2.0', 'id': request_id}
        status = 200
        response = {}
        if error is not None:
            response['error'] = error
        if result is not None:
            response['result'] = result
            if hasattr(result, 'status_code'):
                status = result.status_code

        return self.request.make_json_response(response, status=status)


http.JsonRPCDispatcher._response = JsonRPCDispatcher._response
root = http.Application()


class ShopifyConnector(http.Controller):

    @http.route('/shopify/order-printer', type='http', auth="public")
    def index(self):
        @shop_login_required
        def registry():
            redirect_url = '/order-printer/dashboard?shop=' + request.session['shop_url_pdf']
            if request.httprequest.referrer == 'https://partners.shopify.com/' and 'shop_url_pdf' in request.session:
                return self.redirect_app_page()
            else:
                return redirect(request.env['ir.config_parameter'].sudo().get_param('web.base.url') + redirect_url)

        return registry()

    @http.route('/shopify/order-printer/login', type='http', auth="public")
    def login(self):
        try:
            if 'shop' not in request.params:
                raise Exception('Missing shop url parameter')
            shop = request.params['shop']
            # Set shop URL in session before using it
            request.session['shop_url_pdf'] = shop
            
            session = ShopifyAuth(shop, env=request.env)
            scope = [
                "read_products",
                "read_orders",
                "read_themes",
                "write_themes",
                "read_draft_orders",
                "write_orders",
                "read_inventory"
            ]
            env = request.env['ir.config_parameter'].sudo().get_param('shopify_order_printer.shopify_environment')
            if env == 'prod':
                scope.append("read_all_orders")

            call_back = request.env['ir.config_parameter'].sudo().get_param('web.base.url') + '/shopify/order-printer/auth'
            if 'redirect_action' in request.params:
                shop_model = ShopifyHelper(shop, env=request.env).shop_model
                if shop_model:
                    shop_model.redirect_action = request.params['redirect_action']
                    shop_model.is_reload_session = True
            permission_url = session.create_permission_url(
                scope, call_back
            )
            
            headers = {'Content-Security-Policy': "frame-ancestors https://" + shop + " https://admin.shopify.com;"}
            return request.render('shopify_order_printer.redirect', {
                'url': permission_url
            }, headers=headers)
        except Exception as e:
            # _logger.error(str(e))
            # print(str(e))
            _logger.error(traceback.format_exc())
            return e.__class__.__name__ + ': ' + str(e)

    @http.route('/shopify/order-printer/auth', auth='public')
    def shopify(self, **kw):
        if 'shop' not in request.params:
            raise Exception('Missing shop url parameter')
        shop = request.params['shop']
        expire_session = False
        if 'shop_url_pdf' not in request.session:
            expire_session = True
        request.session['shop_url_pdf'] = shop
        session = ShopifyHelper(shop, env=request.env).auth()
        params = request.params
        try:
            token = session.request_token(params)
            shop_model = request.env['shopify.pdf.shop'].sudo().search([('name', '=', shop)], limit=1)
            if shop_model:
                shop_model.sudo().write({
                    'token': token,
                    'status': True,
                    'force_update_scope': False,
                    'allow_frontend': False,
                })
            else:
                new_shop = request.env['shopify.pdf.shop'].sudo().create(
                    {'name': shop, 'token': token, 'status': True, 'force_update_scope': False})
                if new_shop:
                    new_shop.init_default_template()

            Shopify = ShopifyHelper(shop_url=shop, token=token, env=request.env)
            Shopify.set_shop_info()
            Shopify.get_shop_model().add_webhook_to_shop(topic='app/uninstalled',
                                                         path="/shopify/webhook/" + shop + '/' + "s_shopify_order_printer" + '/app_uninstalled')
            Shopify.get_shop_model().add_webhook_to_shop(topic='orders/create',
                                                         path="/shopify/webhook/" + shop + '/' + "s_shopify_order_printer" + '/order_create')
            Shopify.get_shop_model().add_webhook_to_shop(topic='orders/paid',
                                                         path="/shopify/webhook/" + shop + '/' + "s_shopify_order_printer" + '/order_paid')
        except Exception as e:
            _logger.error(traceback.format_exc())
            shopify_helper = ShopifyHelper(shop_url=shop, env=request.env)
            # request.session.pop('shop_url', None)
            shopify_helper.reset()
            return e.__class__.__name__ + ': ' + str(e) + ' .Please try again!'
        return self.redirect_app_page()

    @http.route('/shopify/order-printer/reset', type='http', auth='public', methods=['POST'])
    def reset(self):
        shop_url = None
        if 'shop_url_pdf' in request.session:
            shop_url = request.session['shop_url_pdf']
        try:
            Shopify = ShopifyHelper(shop_url=shop_url, env=request.env)
            Shopify.reset()
            # request.session.pop('shop_url', None)
        except Exception as e:
            # _logger.error(str(e))
            _logger.error(traceback.format_exc())
        return redirect('/shopify/order-printer?' + urlencode({'shop': shop_url}))

    def redirect_app_page(self, shop=None):
        api_key = request.env['ir.config_parameter'].sudo().get_param('shopify_order_printer.shopify_api_key')
        shop_url = request.session['shop_url_pdf']
        redirect_url = '/order-printer/dashboard?shop=' + shop_url
        admin_url = f'https://admin.shopify.com/store/{shop_url.replace(".myshopify.com", "")}'
        return redirect(admin_url + f"/apps/{api_key}{redirect_url}")

    # Shopify app redact
    @http.route('/shopify/order-printer/customers_data_request', type='json', auth="public", csrf=False, save_session=False)
    def customers_data_request(self):
        try:
            request_data = json.loads(request.httprequest.data)
            secret_key = request.env['ir.config_parameter'].sudo().get_param('shopify_order_printer.shopify_api_secret')
            verify = self.verify_webhook(request.httprequest.data.decode("utf-8"),
                                         request.httprequest.headers.get('X-Shopify-Hmac-Sha256'), secret_key)
            if verify:
                return {
                    'status': 200,
                    'data': request_data
                }
            else:
                return request.make_response(data=None, status=401)
        except Exception:
            _logger.error(traceback.format_exc())

    @http.route('/shopify/order-printer/customers_redact', type='json', auth="public", csrf=False, save_session=False)
    def customers_redact(self):
        try:
            secret_key = request.env['ir.config_parameter'].sudo().get_param('shopify_order_printer.shopify_api_secret')
            verify = self.verify_webhook(request.httprequest.data.decode("utf-8"),
                                         request.httprequest.headers.get('X-Shopify-Hmac-Sha256'), secret_key)
            if verify:
                return {
                    'status': 200
                }
            else:
                return request.make_response(data=None, status=401)
        except Exception:
            _logger.error(traceback.format_exc())

    @http.route('/shopify/order-printer/shop_redact', type='json', auth="public", csrf=False, save_session=False)
    def shop_redact(self):
        try:
            data = json.loads(request.httprequest.data)
            secret_key = request.env['ir.config_parameter'].sudo().get_param('shopify_order_printer.shopify_api_secret')
            verify = self.verify_webhook(request.httprequest.data.decode("utf-8"),
                                         request.httprequest.headers.get('X-Shopify-Hmac-Sha256'), secret_key)
            if data.get('shop_domain') and verify:
                shop_model = request.env['shopify.pdf.shop'].sudo().search(
                    [('name', '=', data.get('shop_domain'))],
                    limit=1)
                if shop_model:
                    shop_model.token = False
                    shop_model.install = False
            else:
                return request.make_response(data=None, status=401)
        except Exception:
            _logger.error(traceback.format_exc())

    @staticmethod
    def verify_webhook(data, hmac_header, SECRET):
        digest = hmac.new(SECRET.encode('utf-8'), data.encode('utf-8'), hashlib.sha256).digest()
        computed_hmac = base64.b64encode(digest)
        if hmac_header is not None:
            return hmac.compare_digest(computed_hmac, hmac_header.encode('utf-8'))
        else:
            return False

    @http.route('/shopify/webhook/<string:shop>/s_shopify_order_printer/app_uninstalled', type='json', auth="public")
    def uninstall_webhook(self, shop=None):
        try:
            secret_key = request.env['ir.config_parameter'].sudo().get_param('shopify_order_printer.shopify_api_secret')
            verify = self.verify_webhook(request.httprequest.data.decode("utf-8"),
                                         request.httprequest.headers.get('X-Shopify-Hmac-Sha256'), secret_key)
            if shop is not None and verify:
                shop_model = request.env['shopify.pdf.shop'].sudo().search(
                    [('name', '=', shop)],
                    limit=1)
                if shop_model:
                    shop_model.install = False
                    shop_model.token = False
        except Exception as e:
            _logger.error(traceback.format_exc())
        return 'Done'

    def get_value_setting(self, shop):
        info = shop.get_shop_settings_info()
        templates = shop.get_shop_template()
        return info, templates

    @http.route('/shopify/webhook/<string:shop>/s_shopify_order_printer/order_create', type='json', auth="public")
    def order_create(self, shop=None):
        try:
            secret_key = request.env['ir.config_parameter'].sudo().get_param('shopify_order_printer.shopify_api_secret')
            verify = self.verify_webhook(request.httprequest.data.decode("utf-8"),
                                         request.httprequest.headers.get('X-Shopify-Hmac-Sha256'), secret_key)
            if shop is not None and verify:
                shop_model = request.env['shopify.pdf.shop'].sudo().search(
                    [('name', '=', shop)],
                    limit=1)
                if shop_model:
                    data = json.loads(request.httprequest.data)
                    request.env['shopify.pdf.order'].sudo().create_shopify_order(shop=shop_model, data=data)
        except Exception as e:
            _logger.error(traceback.format_exc())

    @http.route('/shopify/webhook/<string:shop>/s_shopify_order_printer/order_paid', type='json', auth="public")
    def order_paid(self, shop=None):
        try:
            secret_key = request.env['ir.config_parameter'].sudo().get_param('shopify_order_printer.shopify_api_secret')
            verify = self.verify_webhook(request.httprequest.data.decode("utf-8"),
                                         request.httprequest.headers.get('X-Shopify-Hmac-Sha256'), secret_key)
            if shop is not None and verify:
                shop_model = request.env['shopify.pdf.shop'].sudo().search(
                    [('name', '=', shop)],
                    limit=1)
                if shop_model:
                    data = json.loads(request.httprequest.data)
                    if data:
                        request.env['shopify.pdf.order'].sudo().paid_shopify_order(shop=shop_model, data=data)
                        print(json.loads(request.httprequest.data))
        except Exception as e:
            _logger.error(traceback.format_exc())