from odoo import models, fields, api
import logging
import traceback
import json

_logger = logging.getLogger(__name__)
from datetime import datetime


class ShopifyPdfOrder(models.Model):
    _name = "shopify.pdf.order"

    shop_id = fields.Many2one('shopify.pdf.shop', string="Shop")
    order_id = fields.Char()
    status = fields.Char()
    date_paid = fields.Datetime()
    custom_invoice_number = fields.Char()
    start_number = fields.Char()
    name = fields.Char()

    def create_shopify_order(self, shop, data):
        if data:
            try:
                if shop.invoice_start_number:
                    # data_json = json.loads(data)
                    exiting_order = self.search([('shop_id', '=', shop.id), ('order_id', '=', data['id'])], limit=1)
                    padding = len(shop.invoice_start_number)
                    dt_obj = datetime.fromisoformat(data['updated_at'])
                    date_format = dt_obj.strftime("%Y-%m-%d %H:%M:%S")
                    start_number = self.search([('custom_invoice_number', '!=', False), ('start_number', '!=', False)])
                    if not exiting_order:
                        if data['financial_status'] == 'paid':
                            if len(start_number) == 0:
                                # If not invoice start number
                                invoice_number = int(shop.invoice_start_number)
                            else:
                                # If changed invoice start number
                                if start_number[-1].start_number == shop.invoice_start_number:
                                    invoice_number = int(shop.invoice_last_number) + 1
                                else:
                                    invoice_number = int(shop.invoice_start_number)
                            self.sudo().create(
                                {'shop_id': shop.id, 'order_id': data['id'], 'status': data['financial_status'],
                                 'date_paid': date_format,
                                 'custom_invoice_number': ('#%0' + str(padding) + 'd') % invoice_number,
                                 'start_number': shop.invoice_start_number,
                                 'name': data['name']})
                            shop.invoice_last_number = invoice_number
                        else:
                            self.sudo().create(
                                {'shop_id': shop.id, 'order_id': data['id'], 'status': data['financial_status'],
                                 'name': data['name']})
                    self.env.cr.commit()
            except Exception as e:
                _logger.error(traceback.format_exc())

    def paid_shopify_order(self, shop, data):
        if data:
            try:
                if shop.invoice_start_number:
                    order_id = self.search([('shop_id', '=', shop.id), ('order_id', '=', data['id'])], limit=1)
                    dt_obj = datetime.fromisoformat(data['updated_at'])
                    date_format = dt_obj.strftime("%Y-%m-%d %H:%M:%S")
                    padding = len(shop.invoice_start_number)
                    start_number = self.search([('custom_invoice_number', '!=', False), ('start_number', '!=', False)])
                    if len(start_number) == 0:
                        # If not invoice start number
                        invoice_number = int(shop.invoice_start_number)
                    else:
                        # If changed invoice start number
                        if start_number[-1].start_number == shop.invoice_start_number:
                            invoice_number = int(shop.invoice_last_number) + 1
                        else:
                            invoice_number = int(shop.invoice_start_number)
                    if order_id:
                        order_id.sudo().write({'status': data['financial_status'], 'date_paid': date_format,
                                               'custom_invoice_number': ('#%0' + str(padding) + 'd') % invoice_number,
                                               'start_number': shop.invoice_start_number, 'name': data['name']})
                    else:
                        self.sudo().create(
                            {'shop_id': shop.id, 'order_id': data['id'], 'status': data['financial_status'],
                             'date_paid': date_format,
                             'custom_invoice_number': ('#%0' + str(padding) + 'd') % invoice_number,
                             'start_number': shop.invoice_start_number, 'name': data['name']})
                    shop.invoice_last_number = invoice_number
                    self.env.cr.commit()
            except Exception as e:
                _logger.error(traceback.format_exc())
