# -*- coding: utf-8 -*-
import base64
import json
from datetime import datetime
import shopify
from odoo import models, fields, api
from odoo.modules import get_module_resource
from ..oauth2.auth import ShopifyHelper
import logging, traceback
_logger = logging.getLogger(__name__)


class Shopify(models.Model):
    _name = 'shopify.pdf.shop'
    _description = 'Shopify Shop'

    name = fields.Char(string='Shop URL', index=True)
    token = fields.Char('Shopify token')
    timezone = fields.Char('Timezone')
    shop_name = fields.Char()
    shop_owner = fields.Char()
    email = fields.Char()
    country = fields.Char()
    install = fields.Boolean(default=True)
    data_fetched = fields.Boolean(default=False)
    status = fields.Boolean()
    image_128 = fields.Image("Image Logo")
    # shop setting
    shop_address = fields.Char()
    shop_state = fields.Char()
    shop_city = fields.Char()
    shop_postcode = fields.Char()
    shop_company_name = fields.Char()
    shop_vat = fields.Char()
    shop_zip = fields.Char()
    shop_qr_code = fields.Char()
    shop_phone = fields.Char()
    shop_email = fields.Char()
    allow_backend = fields.Boolean(default=False)
    allow_frontend = fields.Boolean()
    default_template = fields.Char()
    templates = fields.One2many('shopify.pdf.shop.template', 'shop_id', string='Templates')
    scrip_tag_id = fields.Char()
    close_congratulation = fields.Boolean(default=False)
    # launch
    launch_url = fields.Char()
    redirect_action = fields.Char()
    shopify_session = fields.Char()
    # email notify template
    email_notify_template = fields.Char()
    download_link_text = fields.Char(default='Download your PDF Invoice here')
    invoice_start_number = fields.Char()
    invoice_last_number = fields.Char()
    # rating
    rating = fields.Integer('Rate')
    review = fields.Char('Review')
    # force update
    force_update_scope = fields.Boolean('Force update scope', default=True)
    front_button_label = fields.Char(default='Print your invoice here')
    has_change_script = fields.Boolean(default=False)
    is_reload_session = fields.Boolean(default=False)
    email_send = fields.Integer()
    total_of_month = fields.Integer()
    is_allow_frontend = fields.Boolean(default=False)
    is_open_template_setting = fields.Boolean(default=False)
    is_open_setup_info = fields.Boolean(default=False)

    def get_data(self):
        try:
            uninstall_wh = False
            if self.token:
                self.start_shopify_session()
                shop = shopify.Shop.current()
                if not self.email:
                    self.email = shop.attributes.get('email')
                if not self.country:
                    self.country = shop.attributes.get('country_name')
                existing_webhooks = shopify.Webhook.find()
                if existing_webhooks:
                    for webhook in existing_webhooks:
                        if 's_shopify_pdf_invoice' in webhook.attributes['address']:
                            uninstall_wh = True
                if not uninstall_wh:
                    self.add_webhook_to_shop(topic='app/uninstalled',
                                             path="/shopify/webhook/" + self.name + '/' + "s_shopify_pdf_invoice" + '/app_uninstalled')
            if not self.token:
                self.install = False
                uninstall_wh = True
            if self.email and self.country and self.shop_owner and uninstall_wh:
                self.data_fetched = True
            shopify.ShopifyResource.clear_session()
        except Exception as e:
            self.data_fetched = False
            _logger.error(traceback.format_exc())

    def schedule_update_shop_data(self):
        # shops = self.env['shopify.pdf.shop'].sudo().search([('data_fetched', '=', False)], limit=50, order="create_date desc")
        # for shop in shops:
        #     shop.get_data()
        return True

    def delete_webhook_from_shop(self, id):
        try:
            self.start_shopify_session()
            hook = shopify.Webhook()
            hook.id = id
            hook.destroy()
        except Exception as e:
            _logger.error(traceback.format_exc())

    def add_webhook_to_shop(self, topic, path):
        try:
            self.start_shopify_session()
            if 'http' not in path:
                address = self.env['ir.config_parameter'].sudo().get_param('web.base.url') + path
            else:
                address = path
            hook = shopify.Webhook()
            hook.topic = topic
            hook.address = address
            hook.format = 'json'
            hook.save()
            return hook
        except Exception as e:
            _logger.error(traceback.format_exc())

    def init_default_template(self):
        exist = False
        template_default = self.env['shopify.pdf.template.default'].sudo().search([])
        for template in self.templates:
            if template.available:
                exist = True
                break
        if not exist:
            for key in template_default:
                self.env['shopify.pdf.shop.template'].sudo().create({
                    'shop_id': self.id,
                    'name': key.name,
                    'html': key.html,
                    'json': key.json,
                    'type': key.type,
                    'page_size': 'a4',
                    'orientation': 'portrait',
                    'font_size': 16,
                    'top_margin': 40,
                    'bottom_margin': 16,
                    'left_margin': 16,
                    'right_margin': 16,
                    'default': key.default,
                    'available': True,
                })
        return True

    def get_shop_template(self):
        templates = []
        for t in self.templates:
            if not t.virtual_rec:
                templates.append({
                    'label': t.name,
                    'value': int(self.encode(key=t.id)),
                    'type': {
                        'key': t.type,
                        'value': dict(t._fields['type'].selection).get(t.type)
                    },
                    'status': t.default
                })
        return templates

    def get_resource_url(self, type):
        switcher = {
            'invoice': "/shopify_pdf_invoice/static/description/images/bill.png",
            'order': "/shopify_pdf_invoice/static/description/images/order.png",
            'packing': "/shopify_pdf_invoice/static/description/images/box.png",
            'refund': "/shopify_pdf_invoice/static/description/images/refund.png",
        }
        return switcher.get(type, "/")

    def get_all_shop_template(self):
        templates = []
        for tem in self.templates:
            if not tem.virtual_rec:
                templates.append({
                    'id': self.encode(key=tem.id),
                    'url': '/pdf/templates/' + str(self.encode(tem.id)) + '/edit',
                    'avatarSource': self.get_resource_url(tem.type),
                    'type': tem.type,
                    'title': tem.name,
                    'shortcut': 1,
                    'default_set': True if tem.default else False,
                    'available_set': True if tem.available else False
                })
        return templates

    def encode(self, key):
        return int(int(key) * self.id)

    def decode(self, key):
        if isinstance(int(key) / self.id, int):
            return int(int(key) / self.id)
        return int(int(key) / self.id)

    def get_shop_settings_info(self):
        default_template = ''
        email_notify_template = ''
        if self.default_template and self.default_template != '':
            if self.decode(int(self.default_template)) in [t.id for t in self.templates]:
                default_template = self.default_template
        if self.email_notify_template and self.email_notify_template != '':
            if self.decode(int(self.email_notify_template)) in [t.id for t in self.templates]:
                email_notify_template = self.email_notify_template
        info = {
            'address': self.shop_address if self.shop_address else '',
            'state': self.shop_state if self.shop_state else '',
            'city': self.shop_city if self.shop_city else '',
            'postcode': self.shop_postcode if self.shop_postcode else '',
            'name': self.shop_company_name if self.shop_company_name else '',
            'vat': self.shop_vat if self.shop_vat else '',
            'phone': self.shop_phone if self.shop_phone else '',
            'zip': self.shop_zip if self.shop_zip else '',
            'qrcode': self.shop_qr_code if self.shop_qr_code else '',
            'email': self.shop_email if self.shop_email else '',
            'allow_backend': True if self.allow_backend else False,
            'allow_frontend': True if self.allow_frontend else False,
            'setup_status': {
                'is_open_setup_info': True if self.is_open_setup_info else False,
                'is_allow_frontend': True if self.is_allow_frontend else False,
                'is_open_template_setting': True if self.is_open_template_setting else False,
            },

            'default_template': default_template,
            'shop': self.name if self.name else 'Hapoapps',
            'shop_name': self.shop_name if self.shop_name else 'Hapoapps',
            'shop_owner': self.shop_owner if self.shop_owner else 'Hapoapps',
            'email_notify_template': email_notify_template,
            'download_link_text': self.download_link_text,
            'invoice_start_number': self.invoice_start_number if self.invoice_start_number else '',
            'rate': 5 if self.rating == 5 else 0,
            'front_button_label': self.front_button_label if self.front_button_label else '',
            'close_congratulation': True if self.close_congratulation else False
        }
        return info

    def schedule_change_script(self):
        shops = self.sudo().search(
            [('allow_frontend', '=', True), ('token', '!=', False), ('has_change_script', '=', False)])
        for shop in shops:
            shop.force_change_script()
        return

    def force_change_script_shop(self, model):
        for shop in model:
            shop.force_change_script()
        return

    def force_change_script(self):
        try:

            if self.allow_frontend:
                session = self.start_shopify_session()
                existedScriptTags = shopify.ScriptTag.find()
                for script in existedScriptTags:
                    if 'pdf' in script.attributes.get('src'):
                        shopify.ScriptTag.find(script.id).destroy()

                script_src = self.env['ir.config_parameter'].sudo().get_param(
                    'shopify_pdf.shopify_script_front')
                scriptTag = shopify.ScriptTag.create({
                    "event": "onload",
                    "display_scope": "all",
                    "src": script_src
                })
                self.scrip_tag_id = scriptTag.id
                self.has_change_script = True
        except Exception as e:
            a = 0

    def script_tag_action(self, action=None):
        session = self.start_shopify_session()
        base_url = self.env['ir.config_parameter'].sudo().get_param(
            'web.base.url')
        # script_src = self.env['ir.config_parameter'].sudo().get_param(
        #     'shopify_pdf.shopify_script_front')
        script_src = base_url + '/shopify_pdf_invoice/static/src/js/pdf-invoice-frontend-button.js'

        existedScriptTags = shopify.ScriptTag.find(src=script_src)

        if action == 'add':
            try:
                themes = shopify.Theme.find(limit=200)
                for them in themes:
                    if them.attributes.get('role') == 'main':
                        filters = {
                            'theme_id': them.attributes.get('id'),
                            'key': 'templates/customers/order.liquid'
                        }
                        asset = shopify.Asset.find(**filters)
                        if asset and 'order.id | times: 77' not in asset.attributes.get('value'):
                            html = asset.attributes.get('value')
                            script = '<script>\n' + 'window.object = "{{ order.id | times: 77}}"\n' + '</script>'
                            asset.attributes.update({
                                'value': html + script
                            })
                            # asset.attributes.value = html + script
                            asset.save()
                        break
            except Exception as e:
                _logger.error(traceback.format_exc())
            if existedScriptTags:
                if not self.scrip_tag_id:
                    self.scrip_tag_id = existedScriptTags[0].id
                if not self.has_change_script:
                    self.has_change_script = True
            else:
                scriptTag = shopify.ScriptTag.create({
                    "event": "onload",
                    "display_scope": "all",
                    "src": script_src
                })
                self.scrip_tag_id = scriptTag.id
                self.has_change_script = True
        if action == 'remove':
            if existedScriptTags:
                shopify.ScriptTag.delete(existedScriptTags[0].id)
            self.scrip_tag_id = False
            self.default_template = False

        return True

    def start_shopify_session(self):
        if not self.shopify_session:
            token = self.token
            self.shopify_session = ShopifyHelper(shop_url=self.name, token=token, env=self.env).auth()
        return self.shopify_session

    def get_related_apps(self):
        hapo_apps = []
        partner_apps = []
        try:
            apps = self.env['shopify.related.apps'].sudo().search([('key', '!=', 'pdf')])
            for app in apps:
                if not app.is_partner:
                    hapo_apps.append({
                        'title': app.name,
                        'url': app.url,
                        'media_url': app.media_url,
                        'caption': app.caption,
                        'rate': app.rate,
                        'rate_count': app.rate_count,
                        'plan': app.plan,
                        'owner': app.owner,
                        'quick_install_link': app.quick_install_link,
                    })
                else:
                    partner_apps.append({
                        'title': app.name,
                        'url': app.url,
                        'media_url': app.media_url,
                        'caption': app.caption,
                        'rate': app.rate,
                        'rate_count': app.rate_count,
                        'plan': app.plan,
                        'owner': app.owner,
                    })
        except Exception as e:
            _logger.error(traceback.format_exc())
        return {
            'apps': hapo_apps,
            'partner_apps': partner_apps
        }

    # Mass action update database
    # Fix stupid code, dont bother
    def force_update_id_template_setting(self):
        # find template setting
        for rec in self:
            if rec.default_template:
                template_id_decode = int((int(rec.default_template) - 2020) / rec.id)
                tem = self.env['shopify.pdf.shop.template'].sudo().browse(template_id_decode)
                if not tem:
                    template_id_decode = int((int(rec.default_template - 2021)) / rec.id)
                for t in rec.templates:
                    if t.id == template_id_decode:
                        rec.sudo().write({
                            'default_template': str(rec.encode(t.id))
                        })
                        break
            if rec.email_notify_template:
                template_e_id_decode = int((int(rec.email_notify_template) - 2020) / rec.id)
                tem = self.env['shopify.pdf.shop.template'].sudo().browse(template_e_id_decode)
                if not tem:
                    template_e_id_decode = int((int(rec.email_notify_template) - 2021) / rec.id)
                for t in rec.templates:
                    if t.id == template_e_id_decode:
                        rec.sudo().write({
                            'email_notify_template': str(rec.encode(t.id))
                        })
                        break

        return True

    def get_limit_request_status(self):
        request_to_day = self.env['shopify.pdf.shop.request'].sudo().search(
            [('create_date', '>=', datetime.now().strftime('%Y-%m-%d 00:00:00')),
             ('create_date', '<=', datetime.now().strftime('%Y-%m-%d 23:23:59')), ('shop_id', '=', self.id)])
        if len(request_to_day) >= 2:
            return True
        return False

    def get_view_count(self):
        first_of_month = datetime.today().replace(day=1)
        if self.create_date > first_of_month:
            first_of_month = self.create_date
        records = self.env['shopify.pdf.view.log'].sudo().search(
            [('shop_id', '=', self.id), ('create_date', '>=', first_of_month)])
        views_count = 0
        for rec in records:
            views_count += rec.view_count
        return views_count


class ShopifyPdfTemplate(models.Model):
    _name = 'shopify.pdf.shop.template'

    name = fields.Char()
    shop_id = fields.Many2one('shopify.pdf.shop', string="Shop", index=True)
    html = fields.Text()
    json = fields.Text()
    type = fields.Selection([('order', 'Orders'), ('invoice', 'Invoice'), ('packing', 'Packing'), ('refund', 'Refund')],
                            string='Type')
    # setting
    page_size = fields.Selection([('a4', 'A4'), ('a5', 'A5'), ('a6', 'A6'),
                                  ('Letter', 'Letter'), ('Legal', 'Legal'), ('Tabloid', 'Tabloid')], string='Size')
    orientation = fields.Selection([('portrait', 'Portrait'), ('landscape', 'Landscape')], string='Orientation')
    font_size = fields.Float(default=16.0)
    font_family = fields.Char()
    top_margin = fields.Float()
    bottom_margin = fields.Float()
    left_margin = fields.Float()
    right_margin = fields.Float()
    default = fields.Boolean(default=False)
    available = fields.Boolean(default=False)
    clipboard = fields.Char("Clip Board")
    virtual_rec = fields.Boolean(default=False, index=True)
    date_format = fields.Selection([
        ('%d/%m/%Y', '%d/%m/%y'),
        ('%m/%d/%Y', '%m/%d/%y'),
        ('%Y/%m/%d', '%y/%m/%d'),
        ('%d-%m-%Y', '%d-%m-%y'),
        ('%m-%d-%Y', '%m-%d-%y'),
        ('%Y-%m-%d', '%y-%m-%d'),
        ('%d.%m.%Y', '%d.%m.%y'),
        ('%m.%d.%Y', '%m.%d.%y'),
        ('%Y.%m.%d', '%y.%m.%d'),
        ('%d %b %Y', '%d %b %Y'),
        ('%b %d %Y', '%b %d %Y'),
        ('%Y %b %d', '%Y %b %d')
    ], string='Date Format', default='%b %d %Y')

    # @api.constrains('page_size')
    # def check_page_size_plan(self):
    #     if self.page_size != 'a4' and not self.shop_id.get_current_plan().more_paper_size:
    #         self.page_size = 'a4'

    def get_merged_css(self):
        self.ensure_one()
        merged_css = self.css
        if self.font_size:
            merged_css += self.get_global_font_size_css()
            merged_css += self.get_global_font_family_css()
        return merged_css

    def get_global_font_size_css(self, font_size=None):
        return '*{font-size: %spx;}' % (self.font_size if not font_size else font_size)

    def get_global_font_family_css(self, font_family=None):
        return '*{font-family: %s;}' % (self.font_family if not font_family else font_family)
    def copy(self, default=None):
        default = dict(default or {})
        default["default"] = False
        return super(ShopifyPdfTemplate, self).copy(default)

class ShopifyPdfRequestForm(models.Model):
    _name = 'shopify.pdf.shop.request'

    name = fields.Char("Shop URL")
    shop_id = fields.Many2one('shopify.pdf.shop')
    email = fields.Char()
    template_type = fields.Char()
    description = fields.Char()
    status = fields.Char(default='pending')

    def schedule_sent_email_for_mkt(self):
        emails = self.search([('status', '=', 'pending')])
        for email in emails:
            email.force_sent()
        return True

    def force_sent(self):
        try:
            mkt_email = self.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_mkt_email')
            subject = "Hapoapps - PDF Invoice Request Customization - %s" % (self.name)
            content = "Shop: %s<br/>Email:%s<br/>Request customize type: %s<br/>%s" % (
                self.name, self.email, self.template_type, self.description)
            # sending email
            mail_client = self.env['shopify.pdf.mail']
            mail_client.send(to_email=mkt_email, subject=subject, content=content, reply_to=mkt_email)
            self.status = 'done'
        except Exception as e:
            _logger.error(traceback.format_exc())
