from datetime import datetime
from odoo import models, fields, api
import re
import cssutils
import pdfkit
# from premailer import transform
import logging
import traceback

cssutils.log.setLevel(logging.CRITICAL)

_logger = logging.getLogger(__name__)
import xml.dom.minidom
from ..oauth2.auth import ShopifyHelper
import shopify
import PyPDF2
from currencies import Currency
import pyqrcode
import base64
import io
import os
# from odoo.tools import html_escape as escape
import html as HTML
from ..app import PDF_FONTS_CSS_PATH
from xml.dom.minidom import Element, parseString, _write_data
from lxml import etree, html
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup, Tag
import html as Html
import json

day_endings = {
    '01': 'st',
    '02': 'nd',
    '03': 'rd',
    '21': 'st',
    '22': 'nd',
    '23': 'rd',
    '31': 'st'
}


class Shopify(models.Model):
    _inherit = 'shopify.pdf.shop'
    _description = 'Shopify Shop'

    currency_format = fields.Char('Currency Format')

    def get_qr_code(self, url=''):
        url = pyqrcode.create(url)
        s = io.BytesIO()
        url.png(s, scale=6)
        encoded = base64.b64encode(s.getvalue()).decode("ascii")
        base64_url = 'data:image/png;base64,' + encoded
        return base64_url

    def get_pdf(self, orders=None, templates=None, image_data=None, type=None, isDraftOrder=False, prepare_data=None):
        pdf_writer = PyPDF2.PdfFileWriter()
        session = {'shop': self}
        
        for template in templates:
            for order in orders:
                # Khởi tạo lại session cho mỗi đơn hàng
                self.start_shopify_session()
                current_shop = shopify.Shop.current()
                
                # GraphQL client setup
                client = shopify.GraphQL()
                
                # GraphQL query for transactions
                query = '''
                query TransactionsForOrder($orderId: ID!) {
                order(id: $orderId) {
                    transactions(first: 10) {
                        gateway
                        status
                        kind
                        paymentDetails {
                        ... on CardPaymentDetails {
                        company
                        name
                        paymentMethodName
                        number
                        }
                        ... on ShopPayInstallmentsPaymentDetails {
                        paymentMethodName
                        }
                        }
                      }
                    }
                }
                '''
                variables = {
                    'orderId': f"gid://shopify/Order/{order.id}"
                }
                res = client.execute(query, variables=variables)
                result = json.loads(res)
                print(result)
                
                # Extract transaction data from GraphQL response
                transaction = None
                if result.get('data', {}).get('order', {}).get('transactions', {}):
                    latest_transaction = result['data']['order']['transactions'][-1]
                    if 'paymentDetails' in latest_transaction:
                        transaction = {
                            'paymentDetails': {
                                'creditCardCompany': latest_transaction.get('paymentDetails', {}).get('company', 'unknown'),
                                'creditCardNumber': latest_transaction.get('paymentDetails', {}).get('number', '--')
                            },
                        }

                merge_html_css, options = self.get_pdf_data(order=order, session=session, template=template,
                                                            image_data=image_data, type=type, isDraftOrder=isDraftOrder,
                                                            prepare_data=prepare_data, transaction=transaction)
                os.environ['QT_QPA_PLATFORM'] = 'offscreen'
                config = pdfkit.configuration(wkhtmltopdf=bytes("/usr/local/bin/wkhtmltopdf", 'utf8'))
                pdf_content = pdfkit.from_string(merge_html_css, False, options=options, css=PDF_FONTS_CSS_PATH,
                                                 configuration=config)
                reader = PyPDF2.PdfFileReader(io.BytesIO(pdf_content), strict=False, overwriteWarnings=False)
                for page in range(reader.getNumPages()):
                    pdf_writer.addPage(reader.getPage(page))
        _buffer = io.BytesIO()
        pdf_writer.write(_buffer)
        merged_pdf = _buffer.getvalue()
        _buffer.close()
        return merged_pdf

    def get_pdf_data(self, order=None, session=None, template=None, image_data=None, type=None, isDraftOrder=False,
                     prepare_data=None, transaction=None):
        if not prepare_data:
            if not isDraftOrder:
                prepare_data = self.prepare_order_data(order=order, shop=session['shop'], image_data=image_data,
                                                       type=type, template=template, transaction=transaction)
            else:
                prepare_data = self.prepare_draft_order_data(order=order, shop=session['shop'], image_data=image_data,
                                                             type=type, template=template, transaction=transaction)
        html = self.html_well_format(html=template.html)
        html = self.fill_orders_data(html_str=html, data=prepare_data)
        for key in prepare_data:
            if key != 'items':
                html = html.replace(key, str(prepare_data[key]))
        merge_html_css = html
        # merge_html_css = transform(merge_html_css)
        # remove all shortcode in valid
        merge_html_css = re.sub('(\{\{[^\{\}]*\}\})', '', merge_html_css)
        options = {
            'page-size': template.page_size if template.page_size else 'A4',
            'orientation': 'Portrait' if template.orientation == 'portrait' else 'Landscape',
            'dpi': 96,
            'quiet': '',
            'margin-top': str(template.top_margin) + 'px',
            'margin-bottom': str(template.bottom_margin) + 'px',
            'margin-right': str(template.right_margin) + 'px',
            'margin-left': str(template.left_margin) + 'px',
            'encoding': "UTF-8",
            'lowquality': ''
        }
        return merge_html_css, options

    def prepare_order_data(self, order, shop=None, image_data=None, type=None, template=None, transaction=None):
        data = {'items': {}}
        if not self.currency_format:
            session = shop.start_shopify_session()
            current_shop = shopify.Shop.current()
            if current_shop:
                currency_format = current_shop.attributes.get('money_format')
                self.currency_format = currency_format
    
        currency_format = self.currency_format
    
        if order is not None:
            items = []
            currency = order.attributes.get('currency') if order.attributes.get('currency') else order.attributes.get(
                'presentment_currency')
            presentment_currency = order.attributes.get('presentment_currency') if order.attributes.get(
                'presentment_currency') else order.attributes.get('currency')
            create_at = order.attributes.get('created_at').split('T')[0] if order.attributes.get('created_at') else ''
            tax_rate = 0
            detailed_tax_html = ''
            presentment_detailed_tax_html = ''
            if order.attributes.get('tax_lines') and len(order.attributes.get('tax_lines')) > 0:
                tax_rate = order.attributes.get('tax_lines')[0].attributes['rate']
                for tax_line in order.attributes.get('tax_lines'):
                    tax_line_rate = tax_line.attributes.get('rate')
                    tax_rate_str = '(' + str(tax_line_rate * 100) + '%' + ')'
                    detailed_tax_html += tax_line.attributes.get('title') + tax_rate_str + ': ' + \
                                         self.get_format_currency(currency,
                                                                  float(tax_line.attributes.get(
                                                                      'price_set').attributes.get(
                                                                      'shop_money').attributes.get('amount')),
                                                                  currency_format=currency_format) + \
                                         '<br/>'
                    presentment_detailed_tax_html += tax_line.attributes.get('title') + tax_rate_str + ': ' + \
                                                     self.get_present_format_currency(presentment_currency,
                                                                                      float(tax_line.attributes.get(
                                                                                          'price_set').attributes.get(
                                                                                          'presentment_money').attributes.get(
                                                                                          'amount')),
                                                                                      currency_format=currency_format) + \
                                                     '<br/>'

            if create_at != '':
                create_at = datetime.strptime(create_at, '%Y-%m-%d').strftime(template.date_format)
                # create_at = create_at.split('-')[0] + ' ' + create_at.split('-')[1] + day_endings.get(create_at.split('-')[1], 'th') + ' ' + create_at.split('-')[2]
            remove_sub_amount = 0
            remove_tax_amount = 0
            remove_discount_amount = 0
            refund_note = ''
            tax_included = order.attributes.get('taxes_included')
            discount_allocations = order.attributes.get('discount_allocations')
            if type == 'invoice':
                items = order.attributes['line_items']
                for item in items:
                    item.attributes['origin_quantity'] = item.attributes.get('quantity')
                # remove items out of invoice
                if order.attributes.get('refunds') and len(order.attributes.get('refunds')) > 0:
                    for refund in order.attributes['refunds']:
                        if len(refund.attributes.get('transactions')) > 0:
                            for refund_item in refund.attributes.get('refund_line_items'):
                                remove_qty = refund_item.attributes.get('quantity')
                                remove_sub_amount += refund_item.attributes.get('subtotal')
                                remove_tax_amount += refund_item.attributes.get('total_tax')
                                for item in items:
                                    if refund_item.attributes.get('line_item_id') == item.attributes.get('id'):
                                        for disc in item.attributes.get('discount_allocations'):
                                            remove_discount_amount += float(
                                                float(disc.attributes.get('amount')) / item.attributes.get(
                                                    'quantity') * remove_qty)
                                        if remove_qty == item.attributes.get('quantity'):
                                            items.remove(item)
                                        else:
                                            item.attributes.update({
                                                'quantity': item.attributes.get('quantity') - remove_qty
                                            })
            else:
                all_items = order.attributes['line_items']
                if order.attributes.get('refunds') and len(order.attributes.get('refunds')) > 0:
                    for refund in order.attributes['refunds']:
                        if not len(refund.attributes.get('transactions')) > 0:
                            for refund_item in refund.attributes.get('refund_line_items'):
                                remove_qty = refund_item.attributes.get('quantity')
                                remove_sub_amount += refund_item.attributes.get('subtotal')
                                remove_tax_amount += refund_item.attributes.get('total_tax')
                                for item in all_items:
                                    if refund_item.attributes.get('line_item_id') == item.attributes.get('id'):
                                        for disc in item.attributes.get('discount_allocations'):
                                            remove_discount_amount += float(
                                                float(disc.attributes.get('amount')) / item.attributes.get(
                                                    'quantity') * remove_qty)
            # update total after remove items
            order_subtotal_price = float(order.attributes.get('subtotal_price')) - remove_sub_amount
            order_total_tax = float(order.attributes.get('total_tax')) - remove_tax_amount
            order_discount_total = float(order.attributes.get('total_discounts')) - remove_discount_amount
            if tax_included:
                order_grand_total = float(order.attributes.get('total_price')) - remove_sub_amount
            else:
                order_grand_total = float(order.attributes.get('total_price')) - remove_sub_amount - remove_tax_amount
            order.attributes.update({
                'subtotal_price': order_subtotal_price,
                'total_tax': order_total_tax,
                'total_discounts': order_discount_total,
                'total_price': order_grand_total,
            })
            refund_amount = 0
            shipping_refund_amount = 0
            presentment_shipping_refund_amount = 0
            refund_date = '--'
            refund_vat = 0
            if type == 'refund':
                if len(order.attributes.get('refunds')) > 0:
                    for refund in order.attributes['refunds']:
                        if len(refund.attributes.get('transactions')) > 0:
                            for refund_item in refund.attributes.get('refund_line_items'):
                                item = refund_item.attributes.get('line_item')
                                item.attributes.update({
                                    'quantity': refund_item.attributes.get('quantity'),
                                })
                                items.append(item)
                                refund_vat += refund_item.attributes.get('total_tax')
                            for tran in refund.attributes.get('transactions'):
                                if tran.attributes.get('kind') == 'refund' and tran.attributes.get(
                                        'status') == 'success':
                                    refund_amount += float(tran.attributes.get('amount'))
                            for adjustment in refund.attributes.get('order_adjustments'):
                                if adjustment.attributes.get('kind') == 'shipping_refund':
                                    shipping_refund_amount += -(float(
                                        adjustment.attributes.get('amount_set').attributes.get(
                                            'shop_money').attributes.get('amount')))
                                    presentment_shipping_refund_amount += -(float(
                                        adjustment.attributes.get('amount_set').attributes.get(
                                            'presentment_money').attributes.get('amount')))
                        refund_date = refund.attributes.get('processed_at')[:10]
                    for refund in order.attributes['refunds']:
                        if len(refund.attributes.get('transactions')) > 0:
                            create_at = refund.attributes.get('created_at').split('T')[0] if refund.attributes.get(
                                'created_at') else ''
                            if create_at != '':
                                create_at = datetime.strptime(create_at, '%Y-%m-%d').strftime(template.date_format)
                            refund_note = refund.attributes.get('note') if refund.attributes.get('note') else ''
                            break
            data.update({
                '{{refund_amount}}': self.get_format_currency(currency, refund_amount, currency_format=currency_format),
                '{{refund_amount_no_vat}}': self.get_format_currency(currency, float(refund_amount / (1 + tax_rate)),
                                                                     currency_format=currency_format),
                '{{refund_vat}}': self.get_format_currency(currency, float(refund_vat),
                                                           currency_format=currency_format),
                '{{shipping_refund_amount}}': self.get_format_currency(currency, shipping_refund_amount,
                                                                       currency_format=currency_format),
                '{{presentment_shipping_refund_amount}}': self.get_present_format_currency(presentment_currency,
                                                                                           presentment_shipping_refund_amount,
                                                                                           currency_format=currency_format),
                '{{refund_note}}': refund_note
            })
            tracking_company = '--'
            tracking_numbers = '--'
            fulfilled_date = '--'
            if type == 'packing':
                if len(order.attributes.get('fulfillments')) > 0:
                    for fulfill in order.attributes.get('fulfillments'):
                        if fulfill.attributes.get('status') and fulfill.attributes.get('status') == 'success':
                            for item in fulfill.attributes.get('line_items'):
                                item.attributes.update({
                                    'tracking_number': fulfill.attributes.get('tracking_number'),
                                })
                                items.append(item)
                if len(order.attributes.get('fulfillments')) == 1:
                    create_at = order.attributes.get('fulfillments')[0].attributes.get('created_at').split('T')[0] if \
                        order.attributes.get('fulfillments')[0].attributes.get('created_at') else ''
                    if create_at != '':
                        create_at = datetime.strptime(create_at, '%Y-%m-%d').strftime(template.date_format)
                    tracking_company = order.attributes.get('fulfillments')[0].attributes.get('tracking_company')
                    tracking_numbers = order.attributes.get('fulfillments')[0].attributes.get('tracking_number')
                    created_at = datetime.strptime(order.attributes.get('fulfillments')[0].attributes.get('created_at'),
                                                   '%Y-%m-%dT%H:%M:%S%z')
                    fulfilled_date = created_at.strftime(template.date_format + " - %H:%M:%S")
                if len(order.attributes.get('fulfillments')) > 1:
                    tracking_companys = []
                    all_tracking_number = []
                    for fulfill in order.attributes.get('fulfillments'):
                        if fulfill.attributes.get('tracking_company') and fulfill.attributes.get(
                                'tracking_company') not in tracking_companys:
                            tracking_companys.append(fulfill.attributes.get('tracking_company'))
                        if fulfill.attributes.get('tracking_number') and fulfill.attributes.get(
                                'tracking_number') not in all_tracking_number:
                            all_tracking_number.append(fulfill.attributes.get('tracking_number'))
                        fulfilled_date = fulfill.attributes.get('created_at')
                    tracking_company = ','.join(tracking_companys)
                    tracking_numbers = ','.join(all_tracking_number)
            data.update({
                '{{packing_amount}}': self.get_format_currency(currency, float(order.attributes.get('total_price')),
                                                               currency_format=currency_format),
                '{{presentment_packing_amount}}': self.get_present_format_currency(presentment_currency,
                                                                                   float(order.attributes.get(
                                                                                       'total_price_set').attributes.get(
                                                                                       'presentment_money').attributes.get(
                                                                                       'amount')),
                                                                                   currency_format=currency_format),
            })
            count = 0
            total_discount_items = 0
            presentment_total_discount_items = 0
            for item in items:
                src = ''
                count += 1
                description = ''
                compare_price = ''
                hs_code = ''
                country_of_origin = ''
                cost_per_item = ''
                if image_data is not None:
                    if str(item.attributes.get('product_id')) in image_data:
                        if str(item.attributes.get('variant_id')) in image_data[str(item.attributes.get('product_id'))]:
                            src = image_data[str(item.attributes.get('product_id'))][
                                str(item.attributes.get('variant_id'))]
                        else:
                            if str(item.attributes.get('product_id')) + 'none' in image_data[
                                str(item.attributes.get('product_id'))]:
                                src = image_data[str(item.attributes.get('product_id'))][
                                    str(item.attributes.get('product_id')) + 'none']
                        if str(item.attributes.get('variant_id')) in image_data[
                            str(item.attributes.get('product_id')) + '_compare_price']:
                            if image_data[str(item.attributes.get('product_id')) + '_compare_price'][
                                str(item.attributes.get('variant_id'))] is not None:
                                compare_price = self.get_format_currency(currency, float(
                                    image_data[str(item.attributes.get('product_id')) + '_compare_price'][
                                        str(item.attributes.get('variant_id'))]),
                                                                         currency_format=currency_format)
                    if str(item.attributes.get('product_id')) + '_description' in image_data:
                        description = image_data[str(item.attributes.get('product_id')) + '_description']
                    if str(item.attributes.get('product_id')) + '_inventory' in image_data:
                        if str(item.attributes.get('variant_id')) in image_data[
                            str(item.attributes.get('product_id')) + '_inventory']:
                            inventory = image_data[str(item.attributes.get('product_id')) + '_inventory'][
                                str(item.attributes.get('variant_id'))]
                            hs_code = inventory['hs_code']
                            country_of_origin = inventory['country_of_origin']
                            cost_per_item = inventory['cost_per_item']
                tax_total = 0.0
                presentment_tax_total = 0.0
                total_item_tax = 0.0
                total_presentment_item_tax = 0.0
                if item.attributes.get('tax_lines') and len(item.attributes.get('tax_lines')) > 0:
                    for tax in item.attributes.get('tax_lines'):
                        tax_total += float(
                            tax.attributes.get('price_set').attributes.get('shop_money').attributes.get('amount'))
                        presentment_tax_total += float(
                            tax.attributes.get('price_set').attributes.get('presentment_money').attributes.get(
                                'amount'))
                        total_item_tax += float(
                            tax.attributes.get('price_set').attributes.get('shop_money').attributes.get(
                                'amount')) / float(item.attributes.get('quantity'))
                        total_presentment_item_tax += float(
                            tax.attributes.get('price_set').attributes.get('presentment_money').attributes.get(
                                'amount')) / float(item.attributes.get('quantity'))

                item_origin_qty = item.attributes.get('quantity')
                if 'origin_quantity' in item.attributes and item.attributes.get('origin_quantity'):
                    item_origin_qty = item.attributes.get('origin_quantity')

                discount_per_item = 0
                presentment_discount_per_item = 0
                remove_item_qty = 0
                if item.attributes.get('total_discount') is not None:
                    total_discount_items += float(
                        item.attributes.get('total_discount')) / item_origin_qty * item.attributes.get('quantity')
                    discount_per_item = float(
                        float(item.attributes.get('total_discount')) / item_origin_qty)
                    presentment_total_discount_items += float(
                        item.attributes.get('total_discount_set').attributes.get('presentment_money').attributes.get(
                            'amount')) / item_origin_qty
                    presentment_discount_per_item = float(float(
                        item.attributes.get('total_discount_set').attributes.get('presentment_money').attributes.get(
                            'amount')) / (item_origin_qty + remove_item_qty))

                # item_discount_allocations = item.attributes.get('discount_allocations')
                # discount_per_item = 0
                # for item_discount_allocation in item_discount_allocations:
                #     discount_per_item += float(discount_allocations[item_discount_allocation.attributes.get('discount_application_index')]['value'])
                # total_discount_items += discount_per_item * item_qty
                # if discount_per_item > 0:
                #     remove_item_qty = (float(item.attributes.get('total_discount')) - discount_per_item * item_qty)/discount_per_item
                # presentment_total_discount_items += presentment_discount_per_item * (item_qty + remove_item_qty)
                price_after_discount = float(
                    item.attributes.get('price')) - discount_per_item if discount_per_item > 0 else float(
                    item.attributes.get('price'))
                presentment_price_after_discount = float(
                    item.attributes.get('price_set').attributes.get('presentment_money').attributes.get(
                        'amount')) - presentment_discount_per_item if presentment_discount_per_item > 0 else float(
                    item.attributes.get('price_set').attributes.get('presentment_money').attributes.get('amount'))
                data['items'].update({
                    str(item.attributes.get('id')): {
                        '{{item_number}}': str(count) + '.',
                        '{{product_image}}': '<img style="width: 60px; height: 60px; object-fit: cover" src="' + src + '"/>',
                        '{{product_name}}': item.attributes.get('name'),
                        '{{sku}}': item.attributes.get('sku'),
                        '{{qty}}': item.attributes.get('quantity'),
                        '{{price}}': self.get_format_currency(currency, float(item.attributes.get('price')),
                                                              currency_format=currency_format),
                        '{{presentment_price}}': self.get_present_format_currency(presentment_currency, float(
                            item.attributes.get('price_set').attributes.get('presentment_money').attributes.get(
                                'amount')),
                                                                                  currency_format=currency_format),
                        '{{tax_amount}}': self.get_format_currency(currency, tax_total,
                                                                   currency_format=currency_format),
                        '{{presentment_tax_amount}}': self.get_present_format_currency(presentment_currency,
                                                                                       presentment_tax_total,
                                                                                       currency_format=currency_format),
                        '{{compare_price}}': compare_price,
                        '{{price_no_vat}}': self.get_format_currency(currency, float(
                            item.attributes.get('price')) - total_item_tax, currency_format=currency_format),
                        '{{presentment_price_no_vat}}': self.get_present_format_currency(presentment_currency,
                                                                                         float(item.attributes.get(
                                                                                             'price_set').attributes.get(
                                                                                             'presentment_money').attributes.get(
                                                                                             'amount')) - total_presentment_item_tax,
                                                                                         currency_format=currency_format),
                        '{{discount_amount}}': self.get_format_currency(currency,
                                                                        float(item.attributes.get('total_discount')),
                                                                        currency_format=currency_format),
                        '{{presentment_discount_amount}}': self.get_present_format_currency(presentment_currency,
                                                                                            float(item.attributes.get(
                                                                                                'total_discount_set').attributes.get(
                                                                                                'presentment_money').attributes.get(
                                                                                                'amount')),
                                                                                            currency_format=currency_format),
                        '{{subtotal}}': self.get_format_currency(currency,
                                                                 float(item.attributes.get('price'))
                                                                 * float(item.attributes.get('quantity'))
                                                                 - float(item.attributes.get('total_discount')),
                                                                 currency_format=currency_format),
                        '{{presentment_subtotal}}': self.get_present_format_currency(presentment_currency,
                                                                                     float(item.attributes.get(
                                                                                         'price_set').attributes.get(
                                                                                         'presentment_money').attributes.get(
                                                                                         'amount'))
                                                                                     * float(item.attributes.get(
                                                                                         'quantity'))
                                                                                     - float(item.attributes.get(
                                                                                         'total_discount_set').attributes.get(
                                                                                         'presentment_money').attributes.get(
                                                                                         'amount')),
                                                                                     currency_format=currency_format),
                        '{{tracking_number}}': item.attributes.get('tracking_number'),
                        '{{product_description}}': description,
                        '{{subtotal_no_vat}}': self.get_format_currency(currency,
                                                                        (
                                                                                float(item.attributes.get('price'))
                                                                                - total_item_tax
                                                                        )
                                                                        * float(item.attributes.get('quantity')),
                                                                        currency_format=currency_format),
                        '{{presentment_subtotal_no_vat}}': self.get_present_format_currency(presentment_currency,
                                                                                            (
                                                                                                    float(
                                                                                                        item.attributes.get(
                                                                                                            'price_set').attributes.get(
                                                                                                            'presentment_money').attributes.get(
                                                                                                            'amount'))
                                                                                                    - total_presentment_item_tax
                                                                                            )
                                                                                            * float(item.attributes.get(
                                                                                                'quantity')),
                                                                                            currency_format=currency_format),
                        '{{product_vendor}}': item.attributes.get('vendor'),
                        '{{product_origin_country}}': country_of_origin,
                        '{{discount_per_item}}': self.get_format_currency(currency, discount_per_item,
                                                                          currency_format=currency_format,
                                                                          rounds=False),
                        '{{presentment_discount_per_item}}': self.get_present_format_currency(presentment_currency,
                                                                                              presentment_discount_per_item,
                                                                                              currency_format=currency_format),
                        '{{price_with_discount}}': self.get_format_currency(currency, round(price_after_discount, 2),
                                                                            currency_format=currency_format,
                                                                            rounds=False),
                        '{{presentment_price_with_discount}}': self.get_present_format_currency(presentment_currency,
                                                                                                round(
                                                                                                    presentment_price_after_discount,
                                                                                                    2),
                                                                                                currency_format=currency_format),
                        '{{product_hs_code}}': hs_code,
                        # '{{product_country_of_origin_code}}': country_of_origin,
                        '{{cost_per_item}}': cost_per_item,
                    }
                })
            # shipping = 0
            # for ship in order.attributes.get('shipping_lines'):
            #     shipping += float(ship.attributes.get('price'))
            shipping_address = None
            if order.attributes.get('shipping_address'):
                shipping_address = order.attributes.get('shipping_address').attributes.get('name')
            billing_address = None
            if order.attributes.get('billing_address'):
                billing_address = order.attributes.get('billing_address').attributes.get('name')
            shipping = 0.0
            presentment_shipping = 0.0
            tax_total_shipping = 0.0
            presentment_tax_total_shipping = 0.0
            if len(order.attributes.get('shipping_lines')) > 0:
                for shipping_line in order.attributes.get('shipping_lines'):
                    shipping += float(
                        shipping_line.attributes.get('price_set').attributes.get('shop_money').attributes.get('amount'))
                    presentment_shipping += float(
                        shipping_line.attributes.get('price_set').attributes.get('presentment_money').attributes.get(
                            'amount'))
                    if shipping_line.attributes.get('tax_lines') and len(shipping_line.attributes.get('tax_lines')) > 0:
                        for shipping_tax in shipping_line.attributes.get('tax_lines'):
                            tax_total_shipping += float(
                                shipping_tax.attributes.get('price_set').attributes.get('shop_money').attributes.get(
                                    'amount'))
                            presentment_tax_total_shipping += float(
                                shipping_tax.attributes.get('price_set').attributes.get(
                                    'presentment_money').attributes.get('amount'))
            if tax_total_shipping > 0:
                order_tax_with_ship_tax = self.get_format_currency(currency, float(order.attributes.get('total_tax')),
                                                                   currency_format=currency_format)
                order_shippingAndHandling_no_vat = self.get_format_currency(currency, shipping - tax_total_shipping,
                                                                            currency_format=currency_format)
                order_grandtotal_no_vat = self.get_format_currency(currency,
                                                                   float(order.attributes.get('total_price')) - float(
                                                                       order.attributes.get('total_tax')),
                                                                   currency_format=currency_format)

                presentment_order_tax_with_ship_tax = self.get_present_format_currency(presentment_currency,
                                                                                       float(order.attributes.get(
                                                                                           'total_tax_set').attributes.get(
                                                                                           'presentment_money').attributes.get(
                                                                                           'amount')),
                                                                                       currency_format=currency_format)
                presentment_order_shippingAndHandling_no_vat = self.get_present_format_currency(presentment_currency,
                                                                                                presentment_shipping - presentment_tax_total_shipping,
                                                                                                currency_format=currency_format)
                presentment_order_grandtotal_no_vat = self.get_present_format_currency(presentment_currency,
                                                                                       float(order.attributes.get(
                                                                                           'total_price_set').attributes.get(
                                                                                           'presentment_money').attributes.get(
                                                                                           'amount'))
                                                                                       - float(order.attributes.get(
                                                                                           'total_tax_set').attributes.get(
                                                                                           'presentment_money').attributes.get(
                                                                                           'amount')),
                                                                                       currency_format=currency_format)
            else:
                order_tax_with_ship_tax = self.get_format_currency(currency,
                                                                   float(order.attributes.get('total_tax')) + float(
                                                                       shipping * tax_rate),
                                                                   currency_format=currency_format)
                order_shippingAndHandling_no_vat = self.get_format_currency(currency, shipping - shipping * tax_rate,
                                                                            currency_format=currency_format)
                order_grandtotal_no_vat = self.get_format_currency(currency,
                                                                   float(order.attributes.get('total_price')) - float(
                                                                       order.attributes.get(
                                                                           'total_tax')) - shipping * tax_rate,
                                                                   currency_format=currency_format)

                presentment_order_tax_with_ship_tax = self.get_present_format_currency(presentment_currency,
                                                                                       float(order.attributes.get(
                                                                                           'total_tax_set').attributes.get(
                                                                                           'presentment_money').attributes.get(
                                                                                           'amount'))
                                                                                       + float(
                                                                                           presentment_shipping * tax_rate),
                                                                                       currency_format=currency_format)
                presentment_order_shippingAndHandling_no_vat = self.get_present_format_currency(presentment_currency,
                                                                                                presentment_shipping - presentment_shipping * tax_rate,
                                                                                                currency_format=currency_format)
                presentment_order_grandtotal_no_vat = self.get_present_format_currency(presentment_currency,
                                                                                       float(order.attributes.get(
                                                                                           'total_price_set').attributes.get(
                                                                                           'presentment_money').attributes.get(
                                                                                           'amount'))
                                                                                       - float(order.attributes.get(
                                                                                           'total_tax_set').attributes.get(
                                                                                           'presentment_money').attributes.get(
                                                                                           'amount')) - presentment_shipping * tax_rate,
                                                                                       currency_format=currency_format)
            payment_method = '--'
            payment_card = '--'
            if transaction:
                if transaction.get('paymentDetails'):
                    payment_method = transaction.get('paymentDetails').get('creditCardCompany')
                    payment_card = transaction.get('paymentDetails').get('creditCardNumber')
                    if payment_method == 'unknown':
                        if order.attributes.get('payment_gateway_names') and len(
                                order.attributes.get('payment_gateway_names')) > 0:
                            # tam thoi lay gateway dau tien do gateway tu order api da bi DEPRECATED
                            payment_method = order.attributes.get('payment_gateway_names')[0]
                else:
                    if order.attributes.get('gateway'):
                        payment_method = order.attributes.get('gateway')
            order_total_discount_amount = float(order.attributes.get('total_discounts'))
            presentment_order_total_discount_amount = float(
                order.attributes.get('total_discounts_set').attributes.get('presentment_money').attributes.get(
                    'amount'))
            order.attributes['presentment_total_discounts'] = float(
                order.attributes.get('total_discounts_set').attributes.get('presentment_money').attributes.get(
                    'amount'))
            if total_discount_items > 0:
                order.attributes.update({
                    'total_discounts': float(order.attributes.get('total_discounts')) - total_discount_items,
                    'presentment_total_discounts': float(
                        order.attributes.get('total_discounts_set').attributes.get('presentment_money').attributes.get(
                            'amount')) - presentment_total_discount_items
                })

            order_subtotal = float(order.attributes.get('subtotal_price')) + float(
                order.attributes.get('total_discounts'))
            presentment_order_subtotal = float(
                order.attributes.get('subtotal_price_set').attributes.get('presentment_money').attributes.get('amount')) \
                                         + float(
                order.attributes.get('total_discounts_set').attributes.get('presentment_money').attributes.get(
                    'amount'))
            note_attributes = []
            for item in order.attributes.get('note_attributes'):
                value = item.attributes.get('value')
                if isinstance(value, bool):
                    value_str = str(value).lower()  # Chuyển đổi giá trị boolean thành chuỗi và chuyển thành chữ thường
                else:
                    value_str = value
                attr = item.attributes.get('name') + " : " + str(value_str)
                note_attributes.append(attr)
            data.update({
                '{{rowtotal}}': len(items),
                '{{order_subtotal_discount_apply}}': self.get_format_currency(currency, float(
                    order.attributes.get('subtotal_price')), currency_format=currency_format),
                '{{order_subtotal}}': self.get_format_currency(currency, order_subtotal,
                                                               currency_format=currency_format),
                '{{presentment_order_subtotal}}': self.get_present_format_currency(presentment_currency,
                                                                                   presentment_order_subtotal,
                                                                                   currency_format=currency_format),
                '{{order_subtotal_no_vat}}': self.get_format_currency(currency, order_subtotal / (tax_rate + 1),
                                                                      currency_format=currency_format),
                '{{presentment_order_subtotal_no_vat}}': self.get_present_format_currency(presentment_currency,
                                                                                          presentment_order_subtotal / (
                                                                                                  tax_rate + 1),
                                                                                          currency_format=currency_format),
                '{{order_discount_amount}}': self.get_format_currency(currency,
                                                                      float(order.attributes.get('total_discounts')),
                                                                      currency_format=currency_format),
                '{{presentment_order_discount_amount}}': self.get_present_format_currency(presentment_currency,
                                                                                          float(order.attributes.get(
                                                                                              'presentment_total_discounts')),
                                                                                          currency_format=currency_format),
                '{{order_total_discount_amount}}': self.get_format_currency(currency, order_total_discount_amount,
                                                                            currency_format=currency_format),
                '{{presentment_order_total_discount_amount}}': self.get_present_format_currency(presentment_currency,
                                                                                                presentment_order_total_discount_amount,
                                                                                                currency_format=currency_format),
                '{{order_discount_amount_no_vat}}': self.get_format_currency(currency, float(
                    order.attributes.get('total_discounts')) / (1 + tax_rate), currency_format=currency_format),
                '{{presentment_order_discount_amount_no_vat}}': self.get_present_format_currency(presentment_currency,
                                                                                                 float(
                                                                                                     order.attributes.get(
                                                                                                         'total_discounts_set').attributes.get(
                                                                                                         'presentment_money').attributes.get(
                                                                                                         'amount')) / (
                                                                                                         1 + tax_rate),
                                                                                                 currency_format=currency_format),
                '{{order_shippingAndHandling}}': self.get_format_currency(currency, shipping,
                                                                          currency_format=currency_format),
                '{{presentment_order_shippingAndHandling}}': self.get_present_format_currency(presentment_currency,
                                                                                              presentment_shipping,
                                                                                              currency_format=currency_format),
                '{{order_shippingAndHandling_no_vat}}': order_shippingAndHandling_no_vat,
                '{{presentment_order_shippingAndHandling_no_vat}}': presentment_order_shippingAndHandling_no_vat,
                '{{order_tax}}': self.get_format_currency(currency, float(order.attributes.get('total_tax')),
                                                          currency_format=currency_format),
                '{{presentment_order_tax}}': self.get_present_format_currency(presentment_currency, float(
                    order.attributes.get('total_tax_set').attributes.get('presentment_money').attributes.get('amount')),
                                                                              currency_format=currency_format),
                '{{order_tax_with_ship_tax}}': order_tax_with_ship_tax,
                '{{presentment_order_tax_with_ship_tax}}': presentment_order_tax_with_ship_tax,
                '{{order_grandtotal}}': self.get_format_currency(currency, float(order.attributes.get('total_price')),
                                                                 currency_format=currency_format),
                '{{presentment_order_grandtotal}}': self.get_present_format_currency(presentment_currency,
                                                                                     float(order.attributes.get(
                                                                                         'total_price_set').attributes.get(
                                                                                         'presentment_money').attributes.get(
                                                                                         'amount')),
                                                                                     currency_format=currency_format),
                '{{order_grandtotal_no_vat}}': order_grandtotal_no_vat,
                '{{presentment_order_grandtotal_no_vat}}': presentment_order_grandtotal_no_vat,
                '{{total_tip_received}}': self.get_format_currency(currency,
                                                                   float(order.attributes.get('total_tip_received')),
                                                                   currency_format=currency_format),
                '{{shipping_method}}': order.attributes.get('shipping_lines')[0].attributes.get('title') if len(
                    order.attributes.get('shipping_lines')) > 0 else '--',
                '{{tracking_company}}': tracking_company,
                '{{tracking_number}}': tracking_numbers,
                '{{fulfilled_date}}': fulfilled_date,
                '{{payment_method}}': payment_method,
                '{{payment_card}}': payment_card,
                '{{order_id}}': order.attributes.get('id'),
                '{{refund_name}}': order.attributes.get('name'),
                '{{order_name}}': order.attributes.get('name'),
                '{{shipment_name}}': order.attributes.get('name'),
                '{{create_at}}': create_at,
                '{{status}}': order.attributes.get('financial_status'),
                '{{order_note}}': order.attributes.get('note') if order.attributes.get(
                    'note') and order.attributes.get(
                    'note') != '' else '--',
                '{{order_note_attribute}}': "<br/>".join(note_attributes) if len(note_attributes) > 0 else '--',
                '{{qr_code}}': 'https://' + shop.name + '/account/orders/' + order.attributes.get(
                    'token') if order.attributes.get('token') else 'https://' + shop.name + '/account/orders',
                '{{invoice_printing_date}}': fields.Datetime.now().strftime(template.date_format),
                '{{invoice_number}}': self.get_invoice_number(order),
                '{{detailed_tax_html}}': detailed_tax_html,
                '{{presentment_detailed_tax_html}}': presentment_detailed_tax_html,
                '{{order_created_at}}': datetime.fromisoformat(order.attributes.get('created_at')).strftime(
                    template.date_format)
            })
            billing_data = self.get_order_billing_address(order)
            shipping_data = self.get_order_shipping_adress(order)
            shop_data = self.get_shop_infomation(shop)
            customer_info = self.get_customer_infomation(order)
            data.update(billing_data)
            data.update(shipping_data)
            data.update(shop_data)
            data.update(customer_info)

        # Replace none value to empty string
        data = self.re_format_data(data)
        return data

    def re_format_data(self, data):
        for key in data['items']:
            for k in data['items'][key]:
                if data['items'][key][k] is None:
                    data['items'][key][k] = '--'
        for key in data:
            if key != 'items':
                if data[key] is None:
                    data[key] = '--'
        return data

    def prepare_draft_order_data(self, order, shop=None, image_data=None, type=None, template=None, transaction=None):
        data = {'items': {}}
        if not self.currency_format:
            session = shop.start_shopify_session()
            current_shop = shopify.Shop.current()
            if current_shop:
                currency_format = current_shop.attributes.get('money_format')
                self.currency_format = currency_format
        currency_format = self.currency_format
        shopify.ShopifyResource.clear_session()
        if order is not None:
            items = []
            currency = order.attributes.get('currency') if order.attributes.get('currency') else order.attributes.get(
                'presentment_currency')
            create_at = order.attributes.get('created_at').split('T')[0] if order.attributes.get('created_at') else ''
            tax_rate = 0
            detailed_tax_html = ''
            if order.attributes.get('tax_lines') and len(order.attributes.get('tax_lines')) > 0:
                tax_rate = order.attributes.get('tax_lines')[0].attributes['rate']
                for tax_line in order.attributes.get('tax_lines'):
                    tax_line_rate = tax_line.attributes.get('rate')
                    tax_rate_str = '(' + str(tax_line_rate * 100) + '%' + ')'
                    detailed_tax_html += tax_line.attributes.get('title') + tax_rate_str + ': ' + \
                                         self.get_format_currency(currency,
                                                                  float(tax_line.attributes.get('price')),
                                                                  currency_format=currency_format) + \
                                         '<br/>'
            if create_at != '':
                create_at = datetime.strptime(create_at, '%Y-%m-%d').strftime(template.date_format)
            if type == 'invoice':
                items = order.attributes['line_items']
            count = 0
            total_discount_items = 0
            order_subtotal_no_vat = 0
            for item in items:
                src = ''
                count += 1
                description = ''
                compare_price = ''
                hs_code = ''
                country_of_origin = ''
                cost_per_item = ''
                if image_data is not None:
                    if str(item.attributes.get('product_id')) in image_data:
                        if str(item.attributes.get('variant_id')) in image_data[str(item.attributes.get('product_id'))]:
                            src = image_data[str(item.attributes.get('product_id'))][
                                str(item.attributes.get('variant_id'))]
                        else:
                            if str(item.attributes.get('product_id')) + 'none' in image_data[
                                str(item.attributes.get('product_id'))]:
                                src = image_data[str(item.attributes.get('product_id'))][
                                    str(item.attributes.get('product_id')) + 'none']
                        if str(item.attributes.get('variant_id')) in image_data[
                            str(item.attributes.get('product_id')) + '_compare_price']:
                            if image_data[str(item.attributes.get('product_id')) + '_compare_price'][
                                str(item.attributes.get('variant_id'))] is not None:
                                compare_price = self.get_format_currency(currency, float(
                                    image_data[str(item.attributes.get('product_id')) + '_compare_price'][
                                        str(item.attributes.get('variant_id'))]),
                                                                         currency_format=currency_format)
                        if str(item.attributes.get('product_id')) + '_inventory' in image_data:
                            if str(item.attributes.get('variant_id')) in image_data[
                                str(item.attributes.get('product_id')) + '_inventory']:
                                inventory = image_data[str(item.attributes.get('product_id')) + '_inventory'][
                                    str(item.attributes.get('variant_id'))]
                                hs_code = inventory['hs_code']
                                country_of_origin = inventory['country_of_origin']
                                cost_per_item = inventory['cost_per_item']
                    if str(item.attributes.get('product_id')) + '_description' in image_data:
                        description = image_data[str(item.attributes.get('product_id')) + '_description']
                tax_total = 0.0
                total_item_tax = 0.0
                if item.attributes.get('tax_lines') and len(item.attributes.get('tax_lines')) > 0:
                    for tax in item.attributes.get('tax_lines'):
                        tax_total += float(tax.attributes.get('price'))
                        total_item_tax += float(tax.attributes.get('price')) / float(item.attributes.get('quantity'))
                total_discount_items += float(
                    item.attributes.get('applied_discount').attributes.get('amount')) if item.attributes.get(
                    'applied_discount') else 0
                discount_per_item = float(item.attributes.get('applied_discount').attributes.get('amount')) / float(
                    item.attributes.get('quantity')) if item.attributes.get('applied_discount') else 0
                price_after_discount = float(
                    item.attributes.get('price')) - discount_per_item if discount_per_item > 0 else float(
                    item.attributes.get('price'))
                total_items_discount = float(
                    item.attributes.get('applied_discount').attributes.get('amount')) if item.attributes.get(
                    'applied_discount') else 0
                # key generate
                key = str(item.attributes.get('variant_id'))
                if key in data['items']:
                    key = key + str(count)
                data['items'].update({
                    key: {
                        '{{item_number}}': str(count) + '.',
                        '{{product_image}}': '<img style="width: 60px; height: 60px; object-fit: cover" src="' + src + '"/>',
                        '{{product_name}}': item.attributes.get('name'),
                        '{{sku}}': item.attributes.get('sku'),
                        '{{qty}}': item.attributes.get('quantity'),
                        '{{price}}': self.get_format_currency(currency, float(item.attributes.get('price')),
                                                              currency_format=currency_format),
                        '{{tax_amount}}': self.get_format_currency(currency, tax_total,
                                                                   currency_format=currency_format),
                        '{{compare_price}}': compare_price,
                        '{{price_no_vat}}': self.get_format_currency(currency, float(
                            item.attributes.get('price')) - total_item_tax, currency_format=currency_format),
                        '{{discount_amount}}': self.get_format_currency(currency, total_items_discount,
                                                                        currency_format=currency_format),
                        '{{subtotal}}': self.get_format_currency(currency, float(item.attributes.get('price')) * float(
                            item.attributes.get('quantity')) - total_items_discount,
                                                                 currency_format=currency_format),
                        '{{tracking_number}}': item.attributes.get('tracking_number'),
                        '{{product_description}}': description,
                        '{{subtotal_no_vat}}': self.get_format_currency(currency, (
                                float(item.attributes.get('price')) - total_item_tax) * float(
                            item.attributes.get('quantity')),
                                                                        currency_format=currency_format),
                        '{{product_vendor}}': item.attributes.get('vendor'),
                        '{{discount_per_item}}': self.get_format_currency(currency, discount_per_item,
                                                                          currency_format=currency_format,
                                                                          rounds=False),
                        '{{price_with_discount}}': self.get_format_currency(currency, round(price_after_discount, 2),
                                                                            currency_format=currency_format,
                                                                            rounds=False),
                        # '{{product_origin_country}}': item.attributes.get('origin_location').attributes.get(
                        #     'country_code') if item.attributes.get('origin_location') else '',
                        '{{product_hs_code}}': hs_code,
                        # '{{product_country_of_origin_code}}': country_of_origin,
                        '{{cost_per_item}}': cost_per_item,
                    }
                })

                # order_subtotal_no_vat
                order_subtotal_no_vat += float(float(item.attributes.get('price')) - float(total_item_tax)) * float(
                    item.attributes.get('quantity'))
            # Custom value
            shipping = 0.0
            tax_total_shipping = 0.0
            if order.attributes.get('shipping_line'):
                shipping += float(order.attributes.get('shipping_line').attributes.get('price'))
                tax_total_shipping = shipping * tax_rate
                if order.attributes.get('taxes_included'):
                    tax_total_shipping = shipping - float(shipping / (tax_rate + 1))

            order_tax_with_ship_tax = self.get_format_currency(currency, float(order.attributes.get('total_tax')),
                                                               currency_format=currency_format)
            order_shippingAndHandling_no_vat = self.get_format_currency(currency, shipping - tax_total_shipping,
                                                                        currency_format=currency_format)
            order_grandtotal_no_vat = self.get_format_currency(currency,
                                                               float(order.attributes.get('total_price')) - float(
                                                                   order.attributes.get('total_tax')),
                                                               currency_format=currency_format)
            payment_method = '--'
            payment_card = '--'
            data.update({
                '{{refund_amount}}': 0,
                '{{refund_amount_no_vat}}': 0,
                '{{refund_vat}}': 0,
                '{{shipping_refund_amount}}': 0,
                '{{packing_amount}}': 0,
                'tracking_number': '--'

            })
            order_discount_amount = float(
                order.attributes.get('applied_discount').attributes.get('amount')) if order.attributes.get(
                'applied_discount') else 0
            if order.attributes.get('status') == 'open':
                order_subtotal = float(order.attributes.get('subtotal_price'))
            else:
                order_subtotal = float(order.attributes.get('subtotal_price')) + order_discount_amount

            data.update({
                '{{rowtotal}}': len(items),
                '{{order_subtotal_discount_apply}}': self.get_format_currency(currency, float(
                    order.attributes.get('subtotal_price')), currency_format=currency_format),
                '{{order_subtotal}}': self.get_format_currency(currency, order_subtotal,
                                                               currency_format=currency_format),
                # '{{order_subtotal_no_discount_apply}}': float(order.attributes.get('subtotal_price')) + order_discount_amount,
                '{{order_subtotal_no_vat}}': self.get_format_currency(order_subtotal_no_vat,
                                                                      currency_format=currency_format),
                '{{order_discount_amount}}': self.get_format_currency(currency, order_discount_amount,
                                                                      currency_format=currency_format),
                '{{order_total_discount_amount}}': self.get_format_currency(currency, order_discount_amount,
                                                                            currency_format=currency_format),
                '{{order_discount_amount_no_vat}}': self.get_format_currency(currency,
                                                                             order_discount_amount / (1 + tax_rate),
                                                                             currency_format=currency_format),
                '{{order_shippingAndHandling}}': self.get_format_currency(currency, shipping,
                                                                          currency_format=currency_format),
                '{{order_shippingAndHandling_no_vat}}': order_shippingAndHandling_no_vat,
                '{{order_tax}}': self.get_format_currency(currency, float(order.attributes.get('total_tax')),
                                                          currency_format=currency_format),
                '{{order_tax_with_ship_tax}}': order_tax_with_ship_tax,
                '{{order_grandtotal}}': self.get_format_currency(currency, float(order.attributes.get('total_price')),
                                                                 currency_format=currency_format),
                '{{order_grandtotal_no_vat}}': order_grandtotal_no_vat,
                '{{total_tip_received}}': self.get_format_currency(currency, order.attributes.get('total_tip_received'),
                                                                   currency_format=currency_format),
                '{{shipping_method}}': order.attributes.get('shipping_line').attributes.get(
                    'title') if order.attributes.get('shipping_line') else '--',
                '{{tracking_company}}': '--',
                '{{tracking_number}}': '--',
                '{{payment_method}}': payment_method,
                '{{payment_card}}': payment_card,
                '{{order_id}}': order.attributes.get('id'),
                '{{refund_name}}': '--',
                '{{order_name}}': order.attributes.get('name'),
                '{{shipment_name}}': order.attributes.get('name'),
                '{{create_at}}': create_at,
                '{{status}}': order.attributes.get('status'),
                '{{note}}': order.attributes.get('note') if order.attributes.get(
                    'note') and order.attributes.get(
                    'note') != '' else '--',
                '{{qr_code}}': 'https://' + shop.name + '/account/orders/' + order.attributes.get(
                    'token') if order.attributes.get('token') else 'https://' + shop.name + '/account/orders',
                '{{invoice_printing_date}}': fields.Datetime.now().strftime(template.date_format),
                '{{detailed_tax_html}}': detailed_tax_html,
                '{{order_created_at}}': datetime.fromisoformat(order.attributes.get('created_at')).strftime(
                    template.date_format)
            })
            billing_data = self.get_order_billing_address(order)
            shipping_data = self.get_order_shipping_adress(order)
            shop_data = self.get_shop_infomation(shop)
            customer_info = self.get_customer_infomation(order)
            data.update(billing_data)
            data.update(shipping_data)
            data.update(shop_data)
            data.update(customer_info)
        # Replace none value to empty string
        data = self.re_format_data(data)
        return data

    def get_invoice_number(self, order):
        if not self.invoice_start_number or not self.get_current_plan().custom_invoice_number or (
                order.attributes.get('financial_status') != 'paid' and order.attributes.get(
                'financial_status') != 'refunded'):
            return 'N/A'

        order_id = self.env['shopify.pdf.order'].search([('order_id', '=', order.id), ('shop_id', '=', self.id)])
        if order_id and self.invoice_start_number == order_id.start_number:
            return order_id.custom_invoice_number if order_id.custom_invoice_number else 'N/A'
        return 'N/A'


    def get_order_shipping_adress(self, order=None):
        data = {}
        if order is not None:
            shipping_address = False
            if order.attributes.get('shipping_address'):
                shipping_address = True
            data.update({
                '{{shipping_name}}': order.attributes.get('shipping_address').attributes.get(
                    'name') if shipping_address and order.attributes.get('shipping_address').attributes.get(
                    'name') else '--',
                '{{shipping_first_name}}': order.attributes.get('shipping_address').attributes.get(
                    'first_name') if shipping_address and order.attributes.get('shipping_address').attributes.get(
                    'first_name') else '--',
                '{{shipping_last_name}}': order.attributes.get('shipping_address').attributes.get(
                    'last_name') if shipping_address and order.attributes.get('shipping_address').attributes.get(
                    'last_name') else '--',
                '{{shipping_street1}}': order.attributes.get('shipping_address').attributes.get(
                    'address1') if shipping_address and order.attributes.get('shipping_address').attributes.get(
                    'address1') else '--',
                '{{shipping_street2}}': order.attributes.get('shipping_address').attributes.get(
                    'address2') if shipping_address and order.attributes.get('shipping_address').attributes.get(
                    'address2') else '--',
                '{{shipping_company}}': order.attributes.get('shipping_address').attributes.get(
                    'company') if shipping_address and order.attributes.get('shipping_address').attributes.get(
                    'company') else '--',
                '{{shipping_region}}': order.attributes.get('shipping_address').attributes.get(
                    'province') if shipping_address and order.attributes.get('shipping_address').attributes.get(
                    'province') else '--',
                '{{shipping_phone_number}}': order.attributes.get('shipping_address').attributes.get(
                    'phone') if shipping_address and order.attributes.get('shipping_address').attributes.get(
                    'phone') else '--',
                '{{shipping_post_code}}': order.attributes.get('shipping_address').attributes.get(
                    'zip') if shipping_address and order.attributes.get('shipping_address').attributes.get(
                    'zip') else '--',
                '{{shipping_country}}': order.attributes.get('shipping_address').attributes.get(
                    'country') if shipping_address and order.attributes.get('shipping_address').attributes.get(
                    'country') else '--',
                '{{shipping_city}}': order.attributes.get('shipping_address').attributes.get(
                    'city') if shipping_address and order.attributes.get('shipping_address').attributes.get(
                    'city') else '--',
            })
        return data

    def get_order_billing_address(self, order=None):
        data = {}
        if order is not None:
            billing_address = False
            if order.attributes.get('billing_address'):
                billing_address = True
            data.update({
                '{{billing_name}}': order.attributes.get('billing_address').attributes.get(
                    'name') if billing_address and order.attributes.get('billing_address').attributes.get(
                    'name') else '--',
                '{{billing_first_name}}': order.attributes.get('billing_address').attributes.get(
                    'first_name') if billing_address and order.attributes.get('billing_address').attributes.get(
                    'first_name') else '--',
                '{{billing_last_name}}': order.attributes.get('billing_address').attributes.get(
                    'last_name') if billing_address and order.attributes.get('billing_address').attributes.get(
                    'last_name') else '--',
                '{{billing_street1}}': order.attributes.get('billing_address').attributes.get(
                    'address1') if billing_address and order.attributes.get('billing_address').attributes.get(
                    'address1') else '--',
                '{{billing_street2}}': order.attributes.get('billing_address').attributes.get(
                    'address2') if billing_address and order.attributes.get('billing_address').attributes.get(
                    'address2') else '--',
                '{{billing_company}}': order.attributes.get('billing_address').attributes.get(
                    'company') if billing_address and order.attributes.get('billing_address').attributes.get(
                    'company') else '--',
                '{{billing_region}}': order.attributes.get('billing_address').attributes.get(
                    'province') if billing_address and order.attributes.get('billing_address').attributes.get(
                    'province') else '--',
                '{{billing_phone_number}}': order.attributes.get('billing_address').attributes.get(
                    'phone') if billing_address and order.attributes.get('billing_address').attributes.get(
                    'phone') else '--',
                '{{billing_post_code}}': order.attributes.get('billing_address').attributes.get(
                    'zip') if billing_address and order.attributes.get('billing_address').attributes.get(
                    'zip') else '--',
                '{{billing_country}}': order.attributes.get('billing_address').attributes.get(
                    'country') if billing_address and order.attributes.get('billing_address').attributes.get(
                    'country') else '--',
                '{{billing_city}}': order.attributes.get('billing_address').attributes.get(
                    'city') if billing_address and order.attributes.get('billing_address').attributes.get(
                    'city') else '--',
            })
        return data

    def get_shop_infomation(self, shop=None):
        data = {}
        if shop is not None:
            data.update({
                '{{store_name}}': shop.shop_company_name if shop.shop_company_name else '',
                '{{store_phone}}': shop.shop_phone if shop.shop_phone else '--',
                '{{store_email}}': shop.shop_email if shop.shop_email else '--',
                '{{store_address}}': shop.shop_address if shop.shop_address else '--',
                '{{store_street_line1}}': shop.shop_address if shop.shop_address else '--',
                '{{store_state}}': shop.shop_state if shop.shop_state else '--',
                '{{store_city}}': shop.shop_city if shop.shop_city else '--',
                '{{store_postcode}}': shop.shop_zip if shop.shop_zip else '--',
                '{{vat_number}}': shop.shop_vat if shop.shop_vat else '--',
            })
        return data

    def get_customer_infomation(self, order=None):
        data = {}
        if order is not None:
            data.update({
                '{{customer_email}}': order.attributes.get('customer').attributes.get('email') if order.attributes.get(
                    'customer') else '--',
                '{{customer_first_name}}': order.attributes.get('customer').attributes.get(
                    'first_name') if order.attributes.get('customer') else '--',
                '{{customer_last_name}}': order.attributes.get('customer').attributes.get(
                    'last_name') if order.attributes.get('customer') else '--',
                '{{customer_phone}}': order.attributes.get('customer').attributes.get('phone') if order.attributes.get(
                    'customer') else '--',
                '{{customer_add_company}}': order.attributes.get('customer').attributes.get(
                    'default_address').attributes.get('company') if order.attributes.get(
                    'customer') and order.attributes.get(
                    'customer').attributes.get('default_address') else '--',
                '{{customer_add_1}}': order.attributes.get('customer').attributes.get('default_address').attributes.get(
                    'address1') if order.attributes.get('customer') and order.attributes.get(
                    'customer').attributes.get('default_address') else '--',
                '{{customer_add_2}}': order.attributes.get('customer').attributes.get('default_address').attributes.get(
                    'address2') if order.attributes.get('customer') and order.attributes.get(
                    'customer').attributes.get('default_address') else '--',
                '{{customer_add_city}}': order.attributes.get('customer').attributes.get(
                    'default_address').attributes.get('city') if order.attributes.get(
                    'customer') and order.attributes.get(
                    'customer').attributes.get('default_address') else '--',
                '{{customer_add_province}}': order.attributes.get('customer').attributes.get(
                    'default_address').attributes.get('province') if order.attributes.get(
                    'customer') and order.attributes.get(
                    'customer').attributes.get('default_address') else '--',
                '{{customer_add_country}}': order.attributes.get('customer').attributes.get(
                    'default_address').attributes.get('country') if order.attributes.get(
                    'customer') and order.attributes.get(
                    'customer').attributes.get('default_address') else '--',
                '{{customer_add_zip}}': order.attributes.get('customer').attributes.get(
                    'default_address').attributes.get('zip') if order.attributes.get(
                    'customer') and order.attributes.get(
                    'customer').attributes.get('default_address') else '--',
            })
        return data

    # def get_format_currency(self, currency=None, amount=None, currency_format=None):
    #     # handle amount
    #     if amount is None or amount == 0:
    #         amount = 0.00
    #     amount = '{:,.2f}'.format(amount)
    #
    #     try:
    #         # change format
    #         if currency_format is not None:
    #             #     # if format is html, convert to string
    #             currency_format = re.sub(r'<(.+?)>', '', currency_format)
    #             # if format not correct, convert to correct
    #             currency_format = re.sub(r'{{[^\t]*}}', '{amount}', currency_format)
    #             if currency in Currency.money_formats and '{amount}' in currency_format:
    #                 origin_format = Currency.money_formats[currency]['money_format']
    #                 symbol = origin_format.replace('{amount}', '').replace(' ', '')
    #                 currency_format_symbol = currency_format.replace('{amount}', '').replace(' ', '')
    #                 currency_format = currency_format.replace(currency_format_symbol, symbol)
    #                 Currency.money_formats.update({
    #                     currency: {
    #                         "money_format": currency_format,
    #                         "money_with_currency_format": Currency.money_formats[currency]['money_with_currency_format'],
    #                     },
    #                 })
    #                 currency_item = Currency(currency)
    #                 currency_format = currency_item.get_money_format(amount)
    #     # except Exception as e:
    #     #     _logger.error(traceback.format_exc())
    #     # currency_format = str(amount)
    #     # try:
    #     #     currency_item = Currency(currency)
    #     #     currency_format = currency_item.get_money_format(amount)
    #     except Exception as e:
    #         _logger.error(traceback.format_exc())
    #         currency_format = str(amount)
    #         return str(currency_format)
    #         # currency_format = str(currency) + ' ' + str(amount)
    #
    #     return str(currency_format)

    def get_present_format_currency(self, currency=None, amount=None, currency_format=None):
        if amount is None or amount == 0:
            amount = 0.00
        amount = '{:,.2f}'.format(amount)
        try:
            currency_item = Currency(currency)
            currency_format = currency_item.get_money_format(amount)
            return str(currency_format)
        except Exception as e:
            _logger.error(traceback.format_exc())
        return str(currency) + str(amount)

    def get_format_currency(self, currency=None, amount=None, currency_format=None, rounds=False):
        # handle amount
        if amount is None or amount == 0:
            amount = 0.00
        if rounds:
            amount = round(amount, 2)
            if round(amount % 1, 2) >= 0.99:
                amount = round(amount, 1)
        amount = '{:,.2f}'.format(amount)
        # change format
        if currency_format is not None:
            #     # if format is html, convert to string
            currency_format = re.sub(r'<(.+?)>', '', currency_format)
            # if format not correct, convert to correct
            currency_format = re.sub(r'{{[^\t]*}}', '{amount}', currency_format)
            currency_format_with_symbol = currency_format.replace('{amount}', str(amount)).replace(' ', '')
            return str(currency_format_with_symbol)
        return str(amount)

    def is_html(self, html=None):
        try:
            html = xml.dom.minidom.parseString(html)
            return True
        except Exception as e:
            a = 0
        return False

    # def check_is_row_items_block(self, tr):
    #     if tr.getAttribute("id") == 'row_items' or 'row_items' in tr.getAttribute("id"):
    #         return True
    #     count = 0
    #     shortcodes = ['{{product_image}}', '{{product_name}}', '{{sku}}', '{{qty}}', '{{price}}', '{{price_no_vat}}',
    #                   '{{subtotal}}', '{{subtotal_no_vat}}', '{{discount_amount}}', '{{item_number}}']
    #     try:
    #         for td in tr.childNodes:
    #             for child_node in td.childNodes:
    #                 if child_node.nodeName and child_node.nodeName == 'img':
    #                     src = child_node.getAttributeNode('src').nodeValue
    #                     if src in shortcodes:
    #                         count += 1
    #                 else:
    #                     if child_node.nodeName != '#text' and len(child_node.getElementsByTagName('shortcode')) > 0:
    #                         for short_code_node in child_node.getElementsByTagName('shortcode'):
    #                             short_code = short_code_node.firstChild.nodeValue
    #                             short_code = re.sub("\n", "", short_code)
    #                             short_code = short_code.replace(" ", "")
    #                             if short_code in shortcodes:
    #                                 count += 1
    #                     if child_node.nodeName == 'shortcode':
    #                         for short_code_node in child_node.childNodes:
    #                             short_code = short_code_node.nodeValue
    #                             short_code = re.sub("\n", "", short_code)
    #                             short_code = short_code.replace(" ", "")
    #                             if short_code in shortcodes:
    #                                 count += 1
    #                 if child_node.nodeName != '#text' and len(child_node.getElementsByTagName('img')) > 0:
    #                     for img_child_node in child_node.getElementsByTagName('img'):
    #                         if img_child_node.getAttributeNode('src').nodeValue == '{{product_image}}':
    #                             count += 1
    #     except Exception as e:
    #         _logger.error(traceback.format_exc())
    #     if count >= 3:
    #         return True
    #     return False

    def check_is_row_items_block(self, div):
        count = 0
        shortcodes = ['{{product_image}}', '{{product_name}}', '{{sku}}', '{{qty}}', '{{price}}', '{{price_no_vat}}',
                      '{{subtotal}}', '{{subtotal_no_vat}}', '{{discount_amount}}', '{{item_number}}']

        check = False
        for shortcode in shortcodes:
            if shortcode in div.toxml():
                count += 1
        if count >= 2:
            return True
        else:
            return False

    # def remove_style(self, html_str):
    #     html_str = self.html_format(html_str)
    #     htmldoc = html.fromstring(html_str)
    #     out_xml = etree.tostring(htmldoc)
    #     dom = parseString(out_xml.decode('ascii'))
    #     style_tag = dom.getElementsByTagName("style")
    #     if len(style_tag) > 0:
    #         for tag in style_tag:
    #             tag.childNodes = []
    #     html_str = dom.toxml()
    #     return html_str
    def remove_style(self, html_str):
        html_str = self.html_format(html_str)
        soup = BeautifulSoup(html_str, 'html.parser')
        for style in soup.find_all('style'):
            style.clear()  # Xóa nội dung bên trong thẻ <style>
        return str(soup)

    def fill_orders_data(self, html_str=None, data=None):
        if not html_str or not data:
            return html_str
        
        # Format the HTML string
        html_str = self.html_format(html_str)
        
        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(html_str, 'html.parser')
        
        # Remove styles content (keep the tags)
        for style_tag in soup.find_all('style'):
            style_tag.clear()
        
        # Find all div elements with class 'u-row-container'
        item_divs = []
        for div in soup.find_all('div', class_='u-row-container'):
            # Check if this div is an items row
            div_html = str(div)
            shortcode_count = sum(1 for shortcode in ['{{product_image}}', '{{product_name}}', 
                                                     '{{sku}}', '{{qty}}', '{{price}}', 
                                                     '{{subtotal}}'] if shortcode in div_html)
            if shortcode_count >= 2:
                item_divs.append(div)
        
        # Process each item div
        for item_div in item_divs:
            # Get the original div as template
            template_div = str(item_div)
            
            # Create a container for all new divs
            new_divs = []
            
            # For each item, create a new div with replaced content
            for item_key in data['items']:
                if not item_key:
                    continue
                    
                new_div_html = template_div
                for attr, value in data['items'][item_key].items():
                    # Handle special characters safely
                    if value is None:
                        value = '--'
                    # Convert to string and handle ampersands
                    safe_value = str(value)
                    if '&' in safe_value and not safe_value.startswith('<img'):
                        # Only escape & that aren't already part of HTML entities
                        safe_value = safe_value.replace('&', '&amp;')
                        # Fix double-escaped entities
                        safe_value = safe_value.replace('&amp;amp;', '&amp;')
                        safe_value = safe_value.replace('&amp;lt;', '&lt;')
                        safe_value = safe_value.replace('&amp;gt;', '&gt;')
                        
                    # Replace the attribute in HTML
                    new_div_html = new_div_html.replace(attr, safe_value)
                
                # Parse the new div HTML
                new_div_soup = BeautifulSoup(new_div_html, 'html.parser')
                # Get the top-level div
                new_div = new_div_soup.div
                if new_div:
                    new_divs.append(new_div)
            
            # Insert all new divs before the template div
            for new_div in new_divs:
                item_div.insert_before(new_div)
                
        # Return the modified HTML
        return str(soup)

    def html_well_format(self, html=None):
        html = "<root>" + html + "</root>"
        html = re.sub(r'<svg[^\t]*<\/svg>', '', html)
        html = re.sub('<o:p></o:p>', '', html)
        return html

    def html_format(self, html=None):
        # html = re.sub('&', "&amp;", html)
        # html = re.sub('&amp;amp;', "&amp;", html)
        # html = re.sub("'", "&#39;", html)
        # html = re.sub("&amp;#039;", "&#39;", html)
        # html = re.sub('&amp;quot;', "&quot;", html)
        return html


class OverrideNode(Element):
    EMPTY_ELEMENT = [
        'area',
        'base',
        'br',
        'col',
        'embed',
        'hr',
        'img',
        'input',
        'keygen',
        'link',
        'meta',
        'param',
        'source',
        'track',
        'wbr'
    ]

    def writexml(self, writer, indent="", addindent="", newl=""):
        writer.write(indent + "<" + self.tagName)

        attrs = self._get_attributes()
        a_names = sorted(attrs.keys())

        for a_name in a_names:
            writer.write(" %s=\"" % a_name)
            _write_data(writer, attrs[a_name].value)
            writer.write("\"")
        if self.childNodes or self.nodeName not in OverrideNode.EMPTY_ELEMENT:
            writer.write(">")
            if (len(self.childNodes) == 1 and
                    self.childNodes[0].nodeType == self.TEXT_NODE):
                self.childNodes[0].writexml(writer, '', '', '')
            else:
                writer.write(newl)
                for node in self.childNodes:
                    node.writexml(writer, indent + addindent, addindent, newl)
                writer.write(indent)
            writer.write("</%s>%s" % (self.tagName, newl))
        else:
            writer.write("/>%s" % (newl))


Element.writexml = OverrideNode.writexml
