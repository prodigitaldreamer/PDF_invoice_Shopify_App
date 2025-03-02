from odoo import models, fields, api


class Template(models.Model):
    _name = 'shopify.pdf.template.default'

    name = fields.Char("Name")
    thumbnail = fields.Binary("Thumbnail")
    html = fields.Text("HTML")
    json = fields.Text("Json")
    type = fields.Char("Type")
    default = fields.Boolean("Default")
