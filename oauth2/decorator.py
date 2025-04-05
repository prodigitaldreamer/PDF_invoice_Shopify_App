from ..oauth2.auth import ShopifyHelper as ShopifyHelper
from odoo.http import request
from werkzeug.utils import redirect
from urllib.parse import urlencode
from urllib.parse import urlparse, parse_qs
import re
import json

def check_shop_login_from_db(shop_url=None):
    Shopify = ShopifyHelper(shop_url=shop_url, env=request.env)
    shop_model = Shopify.shop_model
    is_login = False
    if shop_model and shop_model.token:
        is_login = True
    return is_login


def shop_login_required(fn):
    def wrapper(*args, **kwargs):
        if not is_shop_login(check_access=True):
            return redirect(
                request.env['ir.config_parameter'].sudo().get_param('web.base.url') + '/shopify/order-printer/login?' + urlencode(
                    request.params))
        return fn(*args, **kwargs)

    return wrapper


def is_shop_login(check_access=False, check_force=True):
    is_shop_login = 'shop_url_pdf' in request.session
    data = json.loads(request.httprequest.data).get('data') if request.httprequest.data else {}
    if is_shop_login and 'shop' in data:
        is_shop_login = is_shop_login and data['shop'] == request.session['shop_url_pdf']
    
    if is_shop_login:
        is_shop_login = check_shop_login_from_db(shop_url=request.session['shop_url_pdf'])
    
    force_update_scope = False
    if is_shop_login and check_access and data.get('shop') == request.session['shop_url_pdf']:
        shop_model = request.env['shopify.pdf.shop'].sudo().search([('name', '=', request.session['shop_url_pdf'])],
                                                                   limit=1)
        token = shop_model.token
        force_update_scope = shop_model.force_update_scope
        shopify_helper = ShopifyHelper(shop_url=request.session['shop_url_pdf'], token=token, env=request.env)
        is_shop_login = is_shop_login and shopify_helper.check_access()
    else:
        shop_url = None
        # Try to get shop from request parameters first
        if request.params.get('shop') is None:
            if request.httprequest.referrer is not None:
                parsed_url = urlparse(request.httprequest.referrer)
                if parsed_url.query == '':
                    parsed_url = urlparse(request.httprequest.referrer.rsplit('/', 1)[-1])
                    if parsed_url.path == '':
                        parsed_url = urlparse(request.httprequest.url)

                if parsed_url.query == '':
                    if parsed_url.path == 'edit':
                        # For edit endpoint, try to extract from JSON data
                        try:
                            url = request.httprequest.json.get('data', {}).get('info', {}).get('embed', '')
                            pattern = r'shop=([^&]+)'
                            match = re.search(pattern, url)
                            if match:
                                shop_url = match.group(1)
                        except (AttributeError, TypeError, ValueError):
                            # If any error occurs, continue with other methods
                            pass
                    else:
                        shop_url = parsed_url.path
                else:
                    # Safe extraction from query params
                    query_params = parse_qs(parsed_url.query)
                    if 'shop' in query_params and query_params['shop']:
                        shop_url = query_params['shop'][0]
            
            # If still can't find shop_url, try to extract from data
            if not shop_url and 'shop' in data:
                shop_url = data['shop']
        else:
            shop_url = request.params.get('shop')
        # Find shop in database
        shop_model = request.env['shopify.pdf.shop'].sudo().search([('name', '=', shop_url)], limit=1)
        token = shop_model.token
        force_update_scope = shop_model.force_update_scope
        shopify_helper = ShopifyHelper(shop_url=shop_url, token=token, env=request.env)
        is_shop_login = shopify_helper.check_access()
        request.session['shop_url_pdf'] = shop_url

    if is_shop_login and force_update_scope and check_force:
        is_shop_login = False
    return is_shop_login


def ensure_login():
    if not is_shop_login(check_access=True, check_force=False):
        raise Exception('Login Required')
