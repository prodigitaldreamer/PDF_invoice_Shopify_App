from odoo import models, fields, api


class ShopifyLog(models.Model):
    _name = 'shopify.pdf.shop.log'

    name = fields.Char('Shop', index=True)
    created_at = fields.Datetime("Created at")
    log = fields.Text('Log')

class ShopifyPdfViewLog(models.Model):
    _name = 'shopify.pdf.view.log'

    name = fields.Char('View Detail')
    shop_id = fields.Many2one('shopify.pdf.shop', index=True)
    view_count = fields.Integer()
