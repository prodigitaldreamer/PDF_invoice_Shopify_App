import traceback
from odoo import http, fields
import logging
from werkzeug.utils import redirect
from odoo.http import request
from ..oauth2.auth import ShopifyHelper
from ..oauth2.decorator import ensure_login

_logger = logging.getLogger(__name__)
import json
from ..app import CUSTOM_FONTS
import re

class Main(http.Controller):

    @http.route('/pdf/main', type='http', auth='public', save_session=False)
    def main(self):
        try:
            ensure_login()
            value = {
                'page': 'main',
                'mode': 'set',
                'template_info': {},
                'all_templates': [],
                'info': {},
                'templates': {},
                'preview': {},
                'live_support': True,
                'custom_fonts': [],
                'current_plan': {},
                'all_plans': []
            }
            shop = None
            if 'shop_url_pdf' in request.session:
                shop = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env).shop_model
            app_key = request.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_api_key')
            if shop:
                info, templates = self.get_value_setting(shop=shop)
                # list_apps = shop.get_related_apps()
                list_apps = []
                if not shop.install:
                    shop.install = True
                # shop.init_default_template()
                value.update({
                    'info': info,
                    'templates': templates,
                    'shop_url': 'admin.shopify.com/store/' + shop.name.replace(".myshopify.com", ""),
                    'list_apps': list_apps,
                    'current_plan': shop.sudo().get_current_plan_data(),
                    'all_plans': request.env['shopify.pdf.plan'].sudo().get_all_plans_data(),
                    'shop': shop.name,
                    'api_key': app_key,
                    'setup_tasks': self.get_setup_tasks(shop)
                })
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_pdf_invoice.main', {'config': json.dumps(value)}, headers=headers)
        except Exception as e:
            # _logger.error(str(e))
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            return self.render_exception()

    @http.route('/pdf/template/duplicate', type="json", auth='public', csrf=False, save_session=False)
    def duplicate(self, **kw):
        try:
            ensure_login()
            Shopify = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env)
            shop_model = Shopify.shop_model
            ids = json.loads(request.httprequest.data).get('data').get('ids')
            ids = [shop_model.decode(id) for id in ids]
            model = request.env['shopify.pdf.shop.template'].sudo()
            templates = model.search([('id', 'in', ids), ('shop_id', '=', shop_model.id)])
            if templates:
                new_template = templates.copy()
                # new_template.write({"default": False})
                templates = new_template.shop_id.get_all_shop_template()
            return {
                'templates': templates,
                'status': True
            }
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
        return json.dumps({
            'status': False
        })

    # '/pdf/templates/<int:id>/edit',
    @http.route(['/pdf/templates', '/pdf/templates/<int:id>/<string:mode>', '/pdf/templates/<int:id>/<string:mode>/<string:shop>',
                 '/pdf/templates/<string:mode>',
                 ], type='http', auth='public', save_session=False)
    def templates(self, id=None, mode=None, shop=None):
        try:
            ensure_login()
            app_key = request.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_api_key')
            value = {
                'page': 'templates',
                'all_templates': [],
                'mode': 'set',
                'template_info': {},
                'preview': {},
                'live_support': True,
                'list_apps': {
                    'apps': [],
                    'partner_apps': []
                },
                'custom_fonts': CUSTOM_FONTS if CUSTOM_FONTS else [],
                'api_key': app_key,
            }
            shop = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env).shop_model
            if shop:
                info, templates = self.get_value_setting(shop=shop)
                all_templates = shop.get_all_shop_template()
                value.update({
                    'info': info,
                    'templates': templates,
                    'all_templates': all_templates,
                    'current_plan': shop.get_current_plan_data(),
                    'shop_url': 'admin.shopify.com/store/' + shop.name.replace(".myshopify.com", ""),
                    'limit_request': shop.get_limit_request_status()
                })
            template_info = {}
            # if mode and mode == 'create':
            #     value.update({'mode': 'edit'})
            # if mode and mode == 'general':
            #     value.update({'mode': 'general'})
            if id == 0:
                value.update({'mode': mode, 'template_info': template_info})
                template_info.update({
                    'font_family': '',
                    'font_size': '16.0',
                    'top_margin': '16.0',
                    'bottom_margin': '16.0',
                    'left_margin': '16.0',
                    'right_margin': '16.0',
                    'page_size': 'a4',
                    'embed': '/pdf/invoice/' + str(0) + '/preview/load',
                    'embed_clipboard': '/pdf/invoice/' + str(0) + '/preview/clipboard',
                })
                value.update({'template_info': template_info})
            elif id:
                id = shop.decode(int(id))
                tem = request.env['shopify.pdf.shop.template'].sudo().search(
                    [('id', '=', id), ('shop_id', '=', shop.id)], limit=1)
                p = re.compile('(?<!\\\\)\'')

                if tem:
                    template_info.update({
                        'id': str(shop.encode(tem.id)),
                        'name': tem.name,
                        'type': tem.type if tem.type else 'invoice',
                        'html': tem.html if tem.html else '',
                        'json': tem.json if tem.json else '',
                        'page_size': tem.page_size if tem.page_size else 'a4',
                        'orientation': tem.orientation if tem.orientation else 'portrait',
                        'font_size': str(tem.font_size) if tem.font_size else '16.0',
                        'font_family': tem.font_family if tem.font_family else '',
                        'top_margin': str(tem.top_margin) if isinstance(tem.top_margin, float) else '16.0',
                        'bottom_margin': str(tem.bottom_margin) if isinstance(tem.bottom_margin, float) else '16.0',
                        'left_margin': str(tem.left_margin) if isinstance(tem.left_margin, float) else '16.0',
                        'right_margin': str(tem.right_margin) if isinstance(tem.right_margin, float) else '16.0',
                        'date_format': tem.date_format if tem.date_format else '%d/%m/%y',
                        'default': tem.default,
                        'embed': '/pdf/invoice/' + str(shop.encode(tem.id)) + '/preview/load?shop=' + shop.display_name,
                        'embed_clipboard': '/pdf/invoice/' + str(shop.encode(tem.id)) + '/preview/clipboard',
                    })

                else:
                    return redirect('/pdf/templates')
                value.update({'mode': mode, 'template_info': template_info})

            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session['shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_pdf_invoice.main', {'config': json.dumps(value)}, headers=headers)
        except Exception as e:
            # print(e)
            # _logger.error(str(e))
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            return self.render_exception()

    @http.route('/pdf/template/delete', type='json', auth='public', csrf=False, save_session=False)
    def delete(self):
        try:
            ensure_login()
            Shopify = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env)
            shop_model = Shopify.shop_model
            shop = request.env['shopify.pdf.shop'].sudo().search([('name', '=', request.session['shop_url_pdf'])])
            ids = json.loads(request.httprequest.data).get('data').get('ids')
            ids = [shop_model.decode(id) for id in ids]
            model = request.env['shopify.pdf.shop.template'].sudo()
            templates = model.search([('id', 'in', ids), ('shop_id', '=', shop_model.id)])
            templates.unlink()
            # if shop_model.default_template and shop_model.default_template != '':
            #     if shop_model.decode(int(shop_model.default_template)) in ids:
            #         shop_model.allow_frontend = False
            #         shop_model.script_tag_action(action='remove')
            # for template in templates:
            #     if template.shop_id == shop_model.id:
            #         template.sudo().unlink()
            templates = shop.get_all_shop_template()
            return {
                'templates': templates,
                'status': True
            }
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
        return {
            'status': False
        }

    @http.route('/pdf/template/update/<string:type>', type='json', auth='public', csrf=False, save_session=False)
    def create(self, type=None):
        try:
            ensure_login()
            Shopify = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env)
            shop_model = Shopify.shop_model
            params = json.loads(request.httprequest.data).get('data')

            model = request.env['shopify.pdf.shop.template'].sudo()
            data = {
                'name': params['info']['name'] if 'name' in params['info'] else 'Untitled template',
                'html': params['info']['html'] if 'html' in params['info'] else '',
                'json': params['info']['json'] if 'json' in params['info'] else '',
                'type': params['info']['type'] if 'type' in params['info'] else 'invoice',
                'page_size': params['info']['page_size'] if 'page_size' in params['info'] else 'a4',
                'orientation': params['info']['orientation'] if 'orientation' in params['info'] else 'portrait',
                'font_size': params['info']['font_size'] if 'font_size' in params['info'] else '16.0',
                'font_family': params['info']['font_family'] if 'font_family' in params['info'] else '',
                'top_margin': params['info']['top_margin'] if 'top_margin' in params['info'] and params['info'][
                    'top_margin'] != '' else '0.0',
                'bottom_margin': params['info']['bottom_margin'] if 'bottom_margin' in params['info'] and
                                                                    params['info']['bottom_margin'] != '' else '0.0',
                'left_margin': params['info']['left_margin'] if 'left_margin' in params['info'] and params['info'][
                    'left_margin'] != '' else '0.0',
                'right_margin': params['info']['right_margin'] if 'right_margin' in params['info'] and params['info'][
                    'right_margin'] != '' else '0.0',
                'default': params['info']['default'] if 'default' in params['info'] else False,
                'date_format': params['info']['date_format'] if 'date_format' in params['info'] else '%b %d %Y',
            }
            template = None
            if 'id' in params['info']:
                # record_id = int(params['info']['id'])
                id = shop_model.decode(int(params['info']['id']))
                template = model.search([('id', '=', id), ('shop_id', '=', shop_model.id)], limit=1)
            if type == 'clipboard':
                mode = 'clipboard'
                if template:
                    record_id = shop_model.encode(template.id)
                    template.sudo().write({
                        'clipboard': json.dumps(data)
                    })
                else:
                    data.update({
                        'shop_id': shop_model.id,
                        # 'virtual_rec': True,
                        'clipboard': json.dumps(data),
                    })
                    new_template = model.create(data)
                    record_id = shop_model.encode(new_template.id)
                return {
                    'status': True,
                    'record': str(record_id),
                    'mode': mode
                }
            if template and type == 'edit':
                record_id = shop_model.encode(template.id)
                mode = 'edit'
                template.sudo().write(data)
                if data['default'] == True:
                    for tem in shop_model.templates:
                        if tem.id != template.id and tem.type == template.type:
                            tem.default = False
            else:
                mode = 'create'
                data.update({'shop_id': shop_model.id})
                new_template = model.create(data)
                record_id = shop_model.encode(new_template.id)
                if data['default'] == True:
                    for tem in shop_model.templates:
                        if tem.id != new_template.id and tem.type == new_template.type:
                            tem.default = False
            return {
                'status': True,
                'record': str(record_id),
                'mode': mode
            }
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
        return {
            'status': False
        }

    @http.route('/pdf/templates/info/<int:id>', type='json', auth='public', save_session=False)
    def set_info_templates(self, id):
        try:
            ensure_login()
            shop = request.env['shopify.pdf.shop'].sudo().search([('name', '=', request.session['shop_url_pdf'])])
            template_info = {}
            if id == 0:
                template_info.update({
                    'font_family': '',
                    'font_size': '16.0',
                    'top_margin': '16.0',
                    'bottom_margin': '16.0',
                    'left_margin': '16.0',
                    'right_margin': '16.0',
                    'page_size': 'a4',
                    'embed': '/pdf/invoice/' + str(0) + '/preview/load',
                    'embed_clipboard': '/pdf/invoice/' + str(0) + '/preview/clipboard',
                    'name': 'Untitled template',
                    'type': 'invoice',
                    'html': '',
                    'json': '',
                    'date_format': '%d/%m/%y',
                    'orientation': 'portrait',
                })
            else:
                id = shop.decode(int(id))
                tem = request.env['shopify.pdf.shop.template'].sudo().search(
                    [('id', '=', id), ('shop_id', '=', shop.id)], limit=1)
                if tem:
                    template_info.update({
                    'name': tem.name,
                    'type': tem.type if tem.type else 'invoice',
                    'html': tem.html if tem.html else '',
                    'json': tem.json if tem.json else '',
                    'page_size': tem.page_size if tem.page_size else 'a4',
                    'orientation': tem.orientation if tem.orientation else 'portrait',
                    'font_size': str(tem.font_size) if tem.font_size else '16.0',
                    'font_family': tem.font_family if tem.font_family else '',
                    'top_margin': str(tem.top_margin) if isinstance(tem.top_margin, float) else '16.0',
                    'bottom_margin': str(tem.bottom_margin) if isinstance(tem.bottom_margin, float) else '16.0',
                    'left_margin': str(tem.left_margin) if isinstance(tem.left_margin, float) else '16.0',
                    'right_margin': str(tem.right_margin) if isinstance(tem.right_margin, float) else '16.0',
                    'date_format': tem.date_format if tem.date_format else '%d/%m/%y',
                    'embed': '/pdf/invoice/' + str(shop.encode(tem.id)) + '/preview/load?shop=' + shop.display_name,
                    'embed_clipboard': '/pdf/invoice/' + str(shop.encode(tem.id)) + '/preview/clipboard?shop=' + shop.display_name,
                    'default': tem.default if tem.default else False,
                })
            return {
                'status': True,
                'template_info': template_info,
            }
        except:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            return {
                'status': False
            }

    @http.route('/pdf/settings', type='http', auth='public', save_session=False)
    def settings(self):
        try:
            ensure_login()
            app_key = request.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_api_key')
            value = {
                'page': 'settings',
                'mode': 'set',
                'template_info': {},
                'all_templates': [],
                'preview': {},
                'live_support': True,
                'list_apps': [],
                'custom_fonts': [],
                'current_plan': {},
                'api_key': app_key,
            }
            shop = None
            if 'shop_url_pdf' in request.session:
                shop = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env).shop_model
            if shop:
                info, templates = self.get_value_setting(shop=shop)
                value.update({
                    'info': info,
                    'templates': templates,
                    'current_plan': shop.get_current_plan_data(),
                    'shop_url': 'admin.shopify.com/store/' + shop.name.replace(".myshopify.com", ""),
                })
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_pdf_invoice.main', {'config': json.dumps(value)}, headers=headers)
        except Exception as e:
            # print(e)
            # _logger.error(str(e))
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            return self.render_exception()

    @http.route('/pdf/email_notification', type='http', auth='public', save_session=False)
    def email_notification(self):
        try:
            ensure_login()
            app_key = request.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_api_key')
            value = {
                'page': 'Email Notification',
                'mode': 'set',
                'template_info': {},
                'all_templates': [],
                'preview': {},
                'live_support': True,
                'list_apps': [],
                'custom_fonts': [],
                'current_plan': {},
                'api_key': app_key,
            }
            shop = None
            if 'shop_url_pdf' in request.session:
                shop = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env).shop_model
            if shop:
                info, templates = self.get_value_setting(shop=shop)
                value.update({
                    'info': info,
                    'templates': templates,
                    'current_plan': shop.get_current_plan_data(),
                    'shop_url': 'admin.shopify.com/store/' + shop.name.replace(".myshopify.com", ""),
                })
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_pdf_invoice.main', {'config': json.dumps(value)}, headers=headers)
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            return self.render_exception()

    @http.route('/pdf/accounts', type='http', auth='public', save_session=False)
    def accounts(self):
        try:
            ensure_login()
            app_key = request.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_api_key')
            value = {
                'page': 'accounts',
                'mode': 'set',
                'template_info': {},
                'all_templates': [],
                'info': {},
                'templates': {},
                'preview': {},
                'live_support': True,
                'custom_fonts': [],
                'current_plan': {},
                'all_plans': [],
                'api_key': app_key
            }
            shop = None
            if 'shop_url_pdf' in request.session:
                shop = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env).shop_model
            if shop:
                info, templates = self.get_value_setting(shop=shop)
                # list_apps = shop.get_related_apps()
                list_apps = []
                if not shop.install:
                    shop.install = True
                # shop.init_default_template()
                value.update({
                    'info': info,
                    'templates': templates,
                    'shop_url': 'admin.shopify.com/store/' + shop.name.replace(".myshopify.com", ""),
                    'list_apps': list_apps,
                    'current_plan': shop.sudo().get_current_plan_data(),
                    'all_plans': request.env['shopify.pdf.plan'].sudo().get_all_plans_data(),
                })
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_pdf_invoice.main', {'config': json.dumps(value)}, headers=headers)
        except Exception as e:
            # print(e)
            # _logger.error(str(e))
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            return self.render_exception()

    @http.route('/pdf/save/settings', type='json', auth='public', csrf=False, save_session=False)
    def save(self):
        try:
            ensure_login()
            Shopify = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env)
            shop_model = Shopify.shop_model
            params = json.loads(request.httprequest.data).get('data')
            if shop_model:
                if 'address' in params:
                    shop_model.shop_address = params['address']
                if 'state' in params:
                    shop_model.shop_state = params['state']
                if 'city' in params:
                    shop_model.shop_city = params['city']
                if 'name' in params:
                    shop_model.shop_company_name = params['name']
                if 'vat' in params:
                    shop_model.shop_vat = params['vat']
                if 'phone' in params:
                    shop_model.shop_phone = params['phone']
                if 'email' in params:
                    shop_model.shop_email = params['email']
                if 'zip' in params:
                    shop_model.shop_zip = params['zip']
                if 'qrcode' in params:
                    shop_model.shop_qr_code = params['qrcode']
                if 'allow_backend' in params:
                    shop_model.allow_backend = params['allow_backend']
                if 'default_template' in params:
                    shop_model.default_template = str(params['default_template'])
                if 'email_notify_template' in params:
                    shop_model.email_notify_template = str(params['email_notify_template'])
                if 'download_link_text' in params:
                    shop_model.download_link_text = str(params['download_link_text'])
                if 'invoice_start_number' in params:
                    shop_model.invoice_start_number = str(params['invoice_start_number'])
                if 'allow_frontend' in params:
                    shop_model.allow_frontend = params['allow_frontend']
                    if params['allow_frontend']:
                        request.env['shopify.pdf.shop'].sudo().force_change_script_shop(shop_model)
                if 'front_button_label' in params:
                    shop_model.front_button_label = str(params['front_button_label'])
                if 'close_congratulation' in params:
                    shop_model.close_congratulation = params['close_congratulation']
                return True
            return False
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            return False

    @http.route(['/pdf/emailautomation', '/pdf/emailautomation/<int:id>/edit'], type='http', auth='public',
                save_session=False)
    def emailautomation(self, id=None):
        try:
            ensure_login()
            app_key = request.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_api_key')
            value = {
                'page': 'emailautomation',
                'all_templates': [],
                'mode': 'set',
                'template_info': {},
                'preview': {},
                'live_support': True,
                'list_apps': {
                    'apps': [],
                    'partner_apps': []
                },
                'custom_fonts': [],
                'email_automation_settings': {
                },
                'current_plan': {},
                'email_month_counts': 0,
                'api_key': app_key,
            }
            shop = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env).shop_model
            # if not shop.get_current_plan().automation_email:
            #     raise ValueError('You need to subscribe to our plan first')
            if shop:
                info, templates = self.get_value_setting(shop=shop)
                value.update({
                    'info': info,
                    'templates': templates,
                    'current_plan': shop.get_current_plan_data(),
                    'email_month_counts': shop.get_email_counts_current_month(),
                    'shop_url': 'admin.shopify.com/store/' + shop.name.replace(".myshopify.com", ""),
                })

                emails = shop.sudo().get_email_automation_settings()
                value.update({
                    'email_automation_settings': emails
                })

                if id:
                    email_info = shop.sudo().get_email_automation_setting(id=id)
                    value.update({'mode': 'edit', 'email_info': email_info})
            else:
                raise Exception('Could not find your current shop')

            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_pdf_invoice.main', {'config': json.dumps(value)}, headers=headers)
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            return self.render_exception()

    @http.route('/pdf/emailautomation/save', type='json', auth='public', csrf=False, save_session=False)
    def emailautomation_save(self):
        try:
            ensure_login()
            Shopify = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env)
            shop_model = Shopify.shop_model
            params = json.loads(request.httprequest.data).get('data')
            model = request.env['shopify.pdf.email.automation'].sudo()
            data = {
                'enable_email_automation': params['enable_email_automation'],
                'email_reply_to': params['email_reply_to'],
                'bcc_to': params['bcc_to'],
                'email_tags': params['email_tags'],
                'email_file_name': params['email_file_name'],
                'email_subject': params['email_subject'],
                'custom_email_message': params['custom_email_message'],
                'test_email': params['test_email'],
            }

            email = model.search([
                ('id', '=', params['id']), ('shop_id', '=', shop_model.id)],
                limit=1)
            email.write(data)

            return {
                'status': True,
                'record': str(params['id']),
                'mode': 'edit'
            }
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
        return {
            'status': False
        }

    @http.route('/pdf/submit/review', type='json', auth='public', csrf=False, save_session=False)
    def save_review(self):
        try:
            ensure_login()
            Shopify = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env)
            shop_model = Shopify.shop_model
            params = request.params['data']
            if 'rate' in params and params['rate'] != 0:
                shop_model.rating = params['rate']
            if 'review' in params:
                shop_model.review = params['review']
            return True
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            return False

    @http.route('/pdf/get/template', type='json', auth='public', csrf=False, save_session=False)
    def get_template(self):
        try:
            ensure_login()
            Shopify = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env)
            shop_model = Shopify.shop_model
            params = json.loads(request.httprequest.data)
            template_load = None
            for template in shop_model.templates:
                if template.id == shop_model.decode(int(params['id'])):
                    template_load = template
                    break
            if template_load is not None:
                html = template_load.html if template_load.html else ''
                json_data = template_load.json if template_load.json else ''
                return {"status": True, "data": {'html': html, 'json': json.loads(json.dumps(json_data))}}
            return {"status": False}
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            return {"status": False}

    @http.route('/pdf/templateDefault', type='json', auth='public', csrf=False, save_session=False)
    def reset_template(self):
        try:
            ensure_login()
            templates = request.env['shopify.pdf.template.default'].sudo().search([])
            value = []
            for template in templates:
                json_object = json.loads(template.json)
                value.append({'name': template.name, 'thumbnail': template.thumbnail, 'type': template.type, 'html': template.html, 'json': json_object})
            return {
                'status': True,
                'templates': value,
            }
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            return [False, {}]

    @http.route('/pdf/set_default_templates', type='json', auth='public', csrf=False, save_session=False)
    def set_default_templates(self):
        try:
            ensure_login()
            Shopify = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env)
            shop_model = Shopify.shop_model
            params = json.loads(request.httprequest.data).get('data')
            
            if not params or not params.get('templates') or not isinstance(params.get('templates'), list):
                return {
                    'status': False,
                    'message': 'Invalid template data provided'
                }
                
            template_model = request.env['shopify.pdf.shop.template'].sudo()
            templates_to_set = params.get('templates')
            
            # Group templates by type to handle defaults for each type
            templates_by_type = {}
            for template_data in templates_to_set:
                template_id = shop_model.decode(int(template_data.get('id')))
                template_type = template_data.get('type', 'invoice')
                
                if template_type not in templates_by_type:
                    templates_by_type[template_type] = []
                templates_by_type[template_type].append(template_id)
            
            # Process each type group
            for template_type, template_ids in templates_by_type.items():
                # First, unset default for all templates of this type
                all_templates_of_type = template_model.search([
                    ('shop_id', '=', shop_model.id),
                    ('type', '=', template_type)
                ])
                
                for template in all_templates_of_type:
                    template.sudo().write({'default': False})
                
                # Now set default for the selected templates
                for template_id in template_ids:
                    template = template_model.search([
                        ('id', '=', template_id),
                        ('shop_id', '=', shop_model.id)
                    ], limit=1)
                    
                    if template:
                        template.sudo().write({'default': True})
            
            # Update shop settings if needed (for backward compatibility)
            if 'invoice' in templates_by_type and templates_by_type['invoice']:
                # Just use the first invoice template as the main default
                main_default_id = templates_by_type['invoice'][0]
                main_default_template = template_model.search([
                    ('id', '=', main_default_id),
                    ('shop_id', '=', shop_model.id)
                ], limit=1)
                
                if main_default_template:
                    shop_model.default_template = str(shop_model.encode(main_default_template.id))
            
            return {
                'status': True,
                'message': 'Default templates updated successfully'
            }
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            return {
                'status': False,
                'message': 'Error updating default templates'
            }

    def get_value_setting(self, shop):
        info = shop.get_shop_settings_info()
        templates = shop.get_shop_template()
        return info, templates

    def create_shop_log(self, log=None):
        shop_name = 'shop_url not in session'
        if 'shop_url_pdf' in request.session:
            shop = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env).shop_model
            if shop:
                shop_name = shop.name
        log = {
            'name': shop_name,
            'created_at': fields.Datetime.now(),
            'log': log
        }
        request.env['shopify.pdf.shop.log'].sudo().create(log)
        return True

    @http.route('/pdf/get/data', type='http', auth='user')
    def get_shop_data(self):
        try:
            shops = request.env['shopify.pdf.shop'].sudo().search([('data_fetched', '=', False)], limit=50)
            for shop in shops:
                shop.get_data()
            if len(shops) == 0:
                return 'Clear'
            return 'Done'
        except Exception as e:
            _logger.error(traceback.format_exc())
            return str(e)

    @http.route('/request/submit', type='json', auth='public', csrf=False, save_session=False)
    def save_request(self):
        try:
            ensure_login()
            Shopify = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env)
            shop_model = Shopify.shop_model
            params = json.loads(request.httprequest.data)
            request_data = {
                'name': shop_model.name,
                'shop_id': shop_model.id,
                'email': params['email'],
                'template_type': params['type'],
                'description': params['description'],
            }
            record = request.env['shopify.pdf.shop.request'].sudo().create(request_data)
            if record:
                return {
                    'status': True
                }
        except Exception as e:
            _logger.error(traceback.format_exc())
        return {
            'status': False
        }

    @http.route('/pdf/setupCheck', type='http', auth='public', csrf=False, save_session=False)
    def setup_check(self, page):
        ensure_login()
        try:
            store = request.env['shopify.pdf.shop'].sudo().search([('name', '=', request.session['shop_url_pdf'])],
                                                                  limit=1)
            if page == 'allow_frontend':
                store.write({'is_allow_frontend': True})
            elif page == 'is_open_template':
                store.write({'is_open_template_setting': True})
            elif page == 'setup_info':
                store.write({'is_open_setup_info': True})
        except Exception as e:
            _logger.error(traceback.format_exc())
            return {
                'status': False
            }

    @http.route('/pdf/save/task', type='json', auth='public', csrf=False, save_session=False)
    def save_task_status(self):
        try:
            ensure_login()
            data = json.loads(request.httprequest.data).get('data')
            task_id = data.get('taskId')
            checked = data.get('checked', False)
            
            Shopify = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env)
            shop_model = Shopify.shop_model
            
            if shop_model:
                # Update appropriate fields based on task ID
                if task_id == 1:
                    shop_model.check_infor = checked
                elif task_id == 2:
                    shop_model.check_print_button = checked
                elif task_id == 3 and checked:
                    shop_model.check_insert_button = checked
                elif task_id == 4 and checked:
                    shop_model.check_custom_invoice_number = checked
                elif task_id == 5:
                    shop_model.check_custom_invoice_template = checked
                return {
                    'status': True,
                    'message': 'Task status updated successfully'
                }
            return {
                'status': False,
                'message': 'Shop not found'
            }
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            return {
                'status': False,
                'message': 'Error updating task status'
            }

    def get_setup_tasks(self, shop):
        setup_tasks = {
            'check_infor': shop.check_infor,
            'check_print_button': shop.check_print_button,
            'check_insert_button': shop.check_insert_button,
            'check_custom_invoice_number': shop.check_custom_invoice_number,
            'check_custom_invoice_template': shop.check_custom_invoice_template
        }
        return setup_tasks

    def render_exception(self):
        headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
            'shop_url_pdf'] + " https://admin.shopify.com;"}
        return request.render('shopify_pdf_invoice.exception', {
            'reset_action': '/shopify/pdf/reset'
        }, headers=headers)