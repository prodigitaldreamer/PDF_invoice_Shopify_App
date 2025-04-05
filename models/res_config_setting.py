import datetime

from odoo import models, fields
from ..oauth2.auth import ShopifyHelper as ShopifyHelper, ShopifyAuth


class ResConfigPdfSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    shopify_api_key = fields.Char('Shopify API Key', readonly=False, config_parameter='shopify_order_printer.shopify_api_key')
    shopify_api_secret = fields.Char('Shopify API Secret', readonly=False,
                                         config_parameter='shopify_order_printer.shopify_api_secret')
    shopify_app_name = fields.Char('Shopify App Name', readonly=False,
                                       config_parameter='shopify_order_printer.shopify_app_name')
    shopify_api_version = fields.Char('Shopify Api Version', readonly=False,
                                          config_parameter='shopify_order_printer.shopify_api_version')
    shopify_env = fields.Selection([('sandbox', 'Sandbox'), ('prod', 'Production')], 'Shopify PDF ENV',
                                       config_parameter='shopify_order_printer.shopify_environment')
