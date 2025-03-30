import datetime

from odoo import models, fields
from ..oauth2.auth import ShopifyHelper as ShopifyHelper, ShopifyAuth


class ResConfigPdfSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    shopify_pdf_api_key = fields.Char('Shopify API Key', readonly=False, config_parameter='shopify_pdf.shopify_api_key')
    shopify_pdf_api_secret = fields.Char('Shopify API Secret', readonly=False,
                                         config_parameter='shopify_pdf.shopify_api_secret')
    shopify_pdf_app_name = fields.Char('Shopify App Name', readonly=False,
                                       config_parameter='shopify_pdf.shopify_app_name')
    shopify_pdf_api_version = fields.Char('Shopify Api Version', readonly=False,
                                          config_parameter='shopify_pdf.shopify_api_version')
    send_from_email = fields.Char('Send Grid From Email', readonly=False,
                                  config_parameter='shopify_pdf.send_from_email')
    shopify_pdf_env = fields.Selection([('sandbox', 'Sandbox'), ('prod', 'Production')], 'Shopify PDF ENV',
                                       config_parameter='shopify_pdf.shopify_environment')
    pdf_shopify_script_front = fields.Char('Script Front', config_parameter='shopify_pdf.shopify_script_front')
    # shopify_pdf_force_update_scopes = fields.Boolean('Shopify Force Update Scopes', readonly=False, config_parameter='shopify_pdf.force_update_scopes', default=False)
    shopify_pdf_smtp_user = fields.Char('SMTP Username', readonly=False,
                                        config_parameter='shopify_pdf.shopify_pdf_smtp_user')
    shopify_pdf_smtp_pass = fields.Char('SMTP Password', readonly=False,
                                        config_parameter='shopify_pdf.shopify_pdf_smtp_pass')
    shopify_pdf_smtp_host = fields.Char('SMTP Host', readonly=False,
                                        config_parameter='shopify_pdf.shopify_pdf_smtp_host')
    shopify_pdf_smtp_port = fields.Char('SMTP Port', readonly=False,
                                        config_parameter='shopify_pdf.shopify_pdf_smtp_port')

    def test_sendgrid_client(self):
        mail_client = self.env['shopify.pdf.mail']
        try:
            mail_client.send(to_email=mail_client.get_from_email(), subject='Email From Hapoapps',
                             content='Hi, this is a test email sent successfully!')
        except Exception as e:
            raise ValueError(str(e)) from e

    def change_script(self):
        base_url = self.env['ir.config_parameter'].sudo().get_param(
            'web.base.url')
        timestamp = str(datetime.datetime.utcnow().timestamp())
        cdn_script_tag = base_url + '/shopify_order_printer/static/src/js/pdf-invoice-frontend-button.js'
        cdn_script_tag = cdn_script_tag + '?v=' + timestamp
        old_scripts = self.sudo().env['shopify.pdf.shop'].search(
            [('token', '!=', False), ('has_change_script', '=', True)])
        old_scripts.write({
            'has_change_script': False
        })
        self.sudo().env['ir.config_parameter'].sudo().set_param(
            'shopify_pdf.shopify_script_front', cdn_script_tag)
        return True

    def force_update_scope(self):
        shops = self.sudo().env['shopify.pdf.shop'].search([('token', '!=', False), ('force_update_scope', '!=', True)])
        shops.write({
            'force_update_scope': True
        })
        return True

    def force_update_webhook(self):
        shops = self.sudo().env['shopify.pdf.shop'].search([('install', '=', True)])
        for shop in shops:
            try:
                Shopify = ShopifyHelper(shop_url=shop.name, token=shop.token, env=self.env)
                Shopify.set_shop_info()
                Shopify.get_shop_model().add_webhook_to_shop(topic='orders/create',
                                                             path="/shopify/webhook/" + shop.name + '/' + "s_shopify_order_printer" + '/order_create')
                Shopify.get_shop_model().add_webhook_to_shop(topic='orders/paid',
                                                             path="/shopify/webhook/" + shop.name + '/' + "s_shopify_order_printer" + '/order_paid')
            except Exception as e:
                self.env['ir.logging'].sudo().create({
                    'type': 'server',
                    'name': 'Force Update Webhook',
                    'path': 'path',
                    'line': 'line',
                    # 'status': 'success',
                    'func': 'force_update_webhook',
                    'message': f"{e}"
                })
                continue
