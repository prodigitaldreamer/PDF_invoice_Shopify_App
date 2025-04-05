from odoo import models, fields, api


class ShopifyLog(models.Model):
    _name = 'shopify.pdf.shop.log'

    name = fields.Char('Shop', index=True)
    created_at = fields.Datetime("Created at")
    log = fields.Text('Log')