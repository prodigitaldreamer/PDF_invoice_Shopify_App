# -*- coding: utf-8 -*-
from odoo import models, fields, api

class DefaultPdfTemplate(models.Model):
    """
    Defines default PDF template configurations that can be assigned to shops.
    
    These templates serve as starting points for shop-specific templates and include
    basic layout and styling information for different types of PDF documents
    (invoices, orders, packing slips, etc.).
    """
    _name = 'shopify.pdf.template.default'
    _description = 'Default PDF Template Configuration'

    name = fields.Char(string="Template Name", required=True, help="Descriptive name for the template")
    thumbnail = fields.Binary(string="Template Thumbnail", help="Preview image of the template")
    html = fields.Text(string="HTML Content", help="HTML structure of the template")
    json = fields.Text(string="JSON Configuration", help="Template configuration in JSON format")
    type = fields.Char(string="Template Type", help="Categorization of the template (invoice, order, etc.)")
    default = fields.Boolean(string="Is Default", default=False, 
                            help="Whether this template should be used as the default for new shops")
