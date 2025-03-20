import json
import re
import cssutils
import pdfkit
# from premailer import transform
from odoo import http, fields
from odoo.http import request
from odoo.tools import html_escape
from ..oauth2.decorator import ensure_login
import logging
import traceback
import os

cssutils.log.setLevel(logging.CRITICAL)

_logger = logging.getLogger(__name__)
import xml.dom.minidom
from ..oauth2.auth import ShopifyHelper
import shopify
from werkzeug.utils import redirect
from urllib.parse import urlencode
from datetime import datetime
from ..app import PDF_FONTS_CSS_PATH
import urllib.parse

class PdfReportController(http.Controller):

    def SAMPLE_DATA(self):
        SAMPLE_DATA = {
            'items': {
                '1': {
                    '{{product_image}}': '<img style="width: 100px" src="'+ '%s/shopify_pdf_invoice/static/description/Logo.png' % (
                        request.env['ir.config_parameter'].sudo().get_param('web.base.url')) + '"/>',
                    '{{product_name}}': 'Sneaker Green/Black',
                    '{{sku}}': 'MH07-L-Green',
                    '{{qty}}': '2',
                    '{{price}}': '$150.00',
                    '{{tax_amount}}': '$2.50',
                    '{{presentment_tax_amount}}': '$2.50',
                    '{{presentment_price}}': '$50.00',
                    '{{price_with_discount}}': '$50.00',
                    '{{presentment_price_with_discount}}': '$50.00',
                    '{{compare_price}}': '$45.00',
                    '{{price_no_vat}}': '$45.00',
                    '{{presentment_price_no_vat}}': '$45.00',
                    '{{subtotal}}': '$300.00',
                    '{{presentment_subtotal}}': '$100.00',
                    '{{item_number}}': '1.',
                    '{{tracking_number}}': 'Q55',
                    '{{product_description}}': 'Adidas Green/Black Color',
                    '{{subtotal_no_vat}}': '$90.00',
                    '{{presentment_subtotal_no_vat}}': '$90.00',
                    '{{product_vendor}}': 'Adidas',
                    '{{discount_amount}}': '$0.00',
                    '{{presentment_discount_amount}}': '$0.00',
                    '{{discount_per_item}}': '$0.00',
                    '{{presentment_discount_per_item}}': '$0.00',
                    '{{product_hs_code}}': '123456',
                    '{{product_origin_country}}': 'US',
                    '{{cost_per_item}}': '$30',
                },
                '2': {
                    '{{product_image}}': '<img style="width: 100px" src="'+ '%s/shopify_pdf_invoice/static/description/Logo.png' % (
                        request.env['ir.config_parameter'].sudo().get_param('web.base.url')) + '"/>',
                    '{{product_name}}': 'Sneaker Green/Black',
                    '{{sku}}': 'MH08-L-Green',
                    '{{qty}}': '3',
                    '{{price}}': '$50.00',
                    '{{tax_amount}}': '$2.50',
                    '{{presentment_tax_amount}}': '$2.50',
                    '{{presentment_price}}': '$50.00',
                    '{{price_with_discount}}': '$45.00',
                    '{{presentment_price_with_discount}}': '$45.00',
                    '{{price_no_vat}}': '$40.00',
                    '{{presentment_price_no_vat}}': '$40.00',
                    '{{compare_price}}': '$45.00',
                    '{{subtotal}}': '$150.00',
                    '{{presentment_subtotal}}': '$150.00',
                    '{{item_number}}': '2.',
                    '{{tracking_number}}': 'Q56',
                    '{{product_description}}': 'Nike Green/Black Color',
                    '{{subtotal_no_vat}}': '$135.00',
                    '{{presentment_subtotal_no_vat}}': '$135.00',
                    '{{product_vendor}}': 'Nike',
                    '{{discount_amount}}': '$5.00',
                    '{{presentment_discount_amount}}': '$0.00',
                    '{{discount_per_item}}': '$0.00',
                    '{{presentment_discount_per_item}}': '$0.00',
                    '{{product_hs_code}}': '123457',
                    '{{product_origin_country}}': 'US',
                    '{{cost_per_item}}': '$30',
                }
            },
            '{{rowtotal}}': '2',
            '{{discount_amount}}': '$0.00',
            '{{presentment_discount_amount}}': '$0.00',
            '{{order_total_discount_amount}}': '$0.00',
            '{{presentment_order_total_discount_amount}}': '$0.00',
            '{{order_subtotal}}': '$300.00',
            '{{presentment_order_subtotal}}': '$300.00',
            '{{order_subtotal_discount_apply}}': '$300.00',
            '{{presentment_order_subtotal_discount_apply}}': '$300.00',
            '{{order_subtotal_no_vat}}': '$225.00',
            '{{presentment_order_subtotal_no_vat}}': '$225.00',
            '{{order_discount_amount}}': '$0.00',
            '{{presentment_order_discount_amount}}': '$0.00',
            '{{order_discount_amount_no_vat}}': '$0.00',
            '{{presentment_order_discount_amount_no_vat}}': '$0.00',
            '{{order_shippingAndHandling}}': '$20.00',
            '{{presentment_order_shippingAndHandling}}': '$20.00',
            '{{order_shippingAndHandling_no_vat}}': '$18.00',
            '{{presentment_order_shippingAndHandling_no_vat}}': '$18.00',
            '{{order_tax}}': '$2.50',
            '{{presentment_order_tax}}': '$0.00',
            '{{order_tax_with_ship_tax}}': '$0.00',
            '{{presentment_order_tax_with_ship_tax}}': '$0.00',
            '{{order_grandtotal}}': '$322.50',
            '{{presentment_order_grandtotal}}': '$322.50',
            '{{order_grandtotal_no_vat}}': '$245.00',
            '{{presentment_order_grandtotal_no_vat}}': '$245.00',
            '{{shipping_method}}': 'Flat Rate - Fixed',
            '{{shipping_name}}': 'Sarah Rayes',
            '{{shipping_first_name}}': 'Sarah',
            '{{shipping_last_name}}': 'Rayes',
            '{{shipping_street1}}': '481 S. Theatre Street Houston, TX 77009',
            '{{shipping_street2}}': '31 Shub Farm Lane Houston, TX 77080',
            '{{shipping_company}}': 'Customer company',
            '{{shipping_region}}': 'North America',
            '{{shipping_phone_number}}': '+1202-555-0302',
            '{{shipping_post_code}}': '77080',
            '{{shipping_country}}': 'United States',
            '{{shipping_city}}': 'Houston',
            '{{tracking_company}}': 'DHL Express',
            '{{tracking_number}}': '#10010',
            '{{fulfilled_date}}': 'Oct 12th 2022',
            '{{payment_method}}': 'PayPal',
            '{{payment_card}}': '•• •••• •••2 1',
            '{{billing_name}}': 'Sarah Rayes',
            '{{billing_first_name}}': 'Sarah',
            '{{billing_last_name}}': 'Rayes',
            '{{billing_street1}}': '481 S. Theatre Street Houston, TX 77009',
            '{{billing_street2}}': '31 Shub Farm Lane Houston, TX 77080',
            '{{billing_company}}': 'Customer company',
            '{{billing_region}}': 'North America',
            '{{billing_phone_number}}': '+1202-555-0302',
            '{{billing_post_code}}': '77080',
            '{{billing_country}}': 'United States',
            '{{billing_city}}': 'Houston',
            '{{order_id}}': '000000008',
            '{{order_name}}': '#1020',
            '{{refund_name}}': '#1020',
            '{{shipment_name}}': '#1020',
            '{{refund_id}}': '000000100',
            '{{refund_amount}}': '$30.00',
            '{{presentment_refund_amount}}': '$30.00',
            '{{refund_amount_no_vat}}': '$25.00',
            '{{presentment_refund_amount_no_vat}}': '$25.00',
            '{{refund_vat}}': '$5',
            '{{presentment_refund_vat}}': '$5',
            '{{refund_note}}': 'This is note of this refund',
            '{{shipping_refund_amount}}': '$5.00',
            '{{presentment_shipping_refund_amount}}': '$5.00',
            '{{packing_amount}}': '$30.00',
            '{{presentment_packing_amount}}': '$30.00',
            '{{invoice_id}}': '000000100',
            '{{shipment_id}}': '000000100',
            '{{customer_email}}': 'sarahr@email.com',
            '{{order_created_at}}': 'Oct 10th 2022',
            '{{invoice_printing_date}}': 'Oct 10th 2022',
            '{{invoice_number}}': '#001',
            '{{order_status}}': 'Open',
            '{{store_name}}': 'Hapo store',
            '{{store_phone}}': '+1 202 555 0156',
            '{{store_email}}': 'support@hapoapps.com',
            '{{store_address}}': '4016 Doane Street, Fremont CA 94538',
            '{{store_state}}': 'California',
            '{{store_city}}': 'Fremont',
            '{{store_street_line1}}': '4016 Doane Street, Fremont CA 94538',
            # '{{store_street_line2}}': '14 Lawrence St. San Jose, CA 95123',
            '{{store_postcode}}': '94538',
            # '{{store_country}}': 'United States',
            # '{{store_region}}': 'North America',
            '{{order_note}}': 'Note for this order',
            # '{{store_city}}': 'Fremont',
            # '{{store_country}}': 'United States',
            # '{{store_region}}': 'North America',
            '{{vat_number}}': '0106780134',
            '{{customer_first_name}}': 'Sarah',
            '{{customer_last_name}}': 'Reyes',
            '{{customer_phone}}': '+1202-555-0302',
            '{{customer_add_company}}': 'NestScale',
            '{{customer_add_1}}': '481 S. Theatre Street Houston, TX 77009',
            '{{customer_add_2}}': '31 Shub Farm Lane Houston, TX 77080',
            '{{customer_add_city}}': 'Houston',
            '{{customer_add_province}}': 'Texas',
            '{{customer_add_country}}': 'United States',
            '{{customer_add_zip}}': '94538',
            '{{detailed_tax_html}}': "A Tax(6.5%): $2.95 <br/> B(3.75%): $1.70",
            '{{presentment_detailed_tax_html}}': "A Tax(6.5%): $2.95 <br/> B(3.75%): $1.70",
            '{{order_note_attribute}}':"Delivery/Pickup Date: Apr 6, 2024 <br/> Order Fulfillment Type: Local Delivery <br/> Order Ready Email Sent: true"
        }
        return SAMPLE_DATA

    @http.route('/pdf/invoice/<int:id>/<string:action>/<string:status>', type='http', auth="public", save_session=False)
    def report_pdf(self, id=None, action=None, status=None):
        try:
            # context = dict(request.env.context)
            ensure_login()
            if id is not None:
                shop = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env).shop_model
                id = shop.decode(id)
                template = request.env['shopify.pdf.shop.template'].sudo().search(
                    [('shop_id', '=', shop.id), ('id', '=', id)])

                if template:
                    html = shop.html_well_format(html=template.html)
                    clipboard = json.loads(
                        template.clipboard) if template.clipboard and template.clipboard != '' else {}
                    if status == 'clipboard' and clipboard is not None:
                        html = clipboard['html'] if 'html' in clipboard else ''
                        html = shop.html_well_format(html=html)
                    create_at = datetime.now().strftime(template.date_format)
                    if status == 'clipboard' and clipboard is not None:
                        if 'date_format' in clipboard:
                            create_at = datetime.now().strftime(clipboard['date_format'])
                    data = self.SAMPLE_DATA()
                    data.update({'{{create_at}}': create_at})
                    # html = self.fill_sample_data(html=html, shop=shop)
                    # remove style tag
                    html = shop.remove_style(html)
                    # fill sample data
                    data.update(
                        self.SAMPLE_DATA()['items']['1']
                    )

                    for key in data:
                        if key != 'items':
                            html = html.replace(key, data[key])
                    merge_html_css = html
                    # merge_html_css = transform(merge_html_css)
                    merge_html_css = merge_html_css.replace('&nbsp;', ' ')
                    merge_html_css = re.sub('(\{\{[^\{\}]*\}\})', '', merge_html_css)
                    options = {
                        'page-size': template.page_size if template.page_size else 'A4',
                        'orientation': 'Portrait' if template.orientation == 'portrait' else 'Landscape',
                        'quiet': '',
                        'dpi': 96,
                        'margin-top': str(clipboard['top_margin']) + 'px' if "top_margin" in clipboard else "16px",
                        'margin-bottom': str(
                            clipboard['bottom_margin']) + 'px' if "bottom_margin" in clipboard else "16px",
                        'margin-right': str(
                            clipboard['right_margin']) + 'px' if "right_margin" in clipboard else "16px",
                        'margin-left': str(clipboard['left_margin']) + 'px' if "left_margin" in clipboard else "16px",
                        'encoding': "UTF-8",
                        'lowquality': ''
                    }
                    if status == 'clipboard' and clipboard is not None:
                        options = {
                            'page-size': clipboard['page_size'] if 'page_size' in clipboard else 'A4',
                            'orientation': clipboard['orientation'] if 'orientation' in clipboard else 'Portrait',
                            'quiet': '',
                            'dpi': 96,
                            'margin-top': str(clipboard['top_margin']) + 'px' if "top_margin" in clipboard else "16px",
                            'margin-bottom': str(
                                clipboard['bottom_margin']) + 'px' if "bottom_margin" in clipboard else "16px",
                            'margin-right': str(
                                clipboard['right_margin']) + 'px' if "right_margin" in clipboard else "16px",
                            'margin-left': str(
                                clipboard['left_margin']) + 'px' if "left_margin" in clipboard else "16px",
                            'encoding': "UTF-8",
                            'lowquality': ''
                        }

                    os.environ['QT_QPA_PLATFORM'] = 'offscreen'

                    pdf_content = pdfkit.from_string(merge_html_css, False, options=options, css=PDF_FONTS_CSS_PATH)
                    pdfhttpheaders = [
                        ('Content-Type', 'application/pdf'),
                        # ('Content-Length', len(pdf_content)),
                        ('Content-Disposition', 'inline; filename=' + 'PDF_demo' + '.pdf'),
                        ('Content-Security-Policy', "frame-ancestors https://" + request.session[
                            'shop_url_pdf'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"),
                    ]
                    response = request.make_response(pdf_content, headers=pdfhttpheaders)
                    # response.set_cookie('fileToken', token)
                    return merge_html_css

            pdfhttpheaders = [
                ('Content-Type', 'application/pdf'),
                # ('Content-Length', len(pdf_content)),
                ('Content-Disposition', 'inline; filename=' + 'PDF_demo' + '.pdf'),
                ('Content-Security-Policy', "frame-ancestors https://" + request.session[
                    'shop_url_pdf'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"),
            ]
            pdf_content = pdfkit.from_string("", False, )

            return merge_html_css
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_pdf_invoice.404_not_found', headers=headers)

    @http.route('/pdf/preview/<string:action>', type='http', auth="public", save_session=False)
    def preview_pdf(self, action=None):
        try:
            request.session['shop_url_pdf'] = request.params['shop']
            # if 'shop_url_pdf' not in request.session or (
            #         'shop_url_pdf' in request.session and 'shop' in request.params and request.session[
            #     'shop_url_pdf'] != request.params['shop']):
            #     redirect_request = request.httprequest.url
            #     redirect_request = redirect_request.replace(request.httprequest.url_root, '/')
            #     return redirect('/shopify/pdf?' + urlencode({'shop': request.params['shop']}) + '&' + urlencode(
            #         {'redirect_action': redirect_request}))
            ensure_login()
            params = request.params
            order_id = params['id'] if 'id' in params else ''
            shop = params['shop'] if 'shop' in params else ''
            shop_model = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env).shop_model
            app_key = request.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_api_key')
            value = {
                'page': '',
                'info': {},
                'templates': {},
                'mode': '',
                'all_templates': [],
                'template_info': {},
                'shop': '',
                'preview': {
                    'refund': 0,
                    'packing': 0,
                    'embed': {}
                },
                'api_key': app_key,
                'shop_url': shop,
            }
            types = ['invoice', 'refund', 'packing']
            timeout = 1500
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"}
            if shop_model.allow_backend:
                embed = None
                status = False
                if shop != '':
                    status = True
                if action == 'order' or action == 'bulk':
                    for template in shop_model.templates:
                        if template.type == 'refund' and template.default:
                            value['preview'].update({'refund': 1})
                        if template.type == 'packing' and template.default:
                            value['preview'].update({'packing': 1})
                if action == 'order':
                    for type in types:
                        embed = request.env['ir.config_parameter'].sudo().get_param(
                            'web.base.url') + '/pdf/single/print/' + type + '?id=' + str(
                            order_id) + '&' + 'shop=' + shop
                        value['preview']['embed'].update({
                            type: embed
                        })
                if action == 'bulk' or action == 'bulkDraftOrder':
                    url = request.httprequest.url
                    #Decode url ve dang ids[]
                    url_decode = urllib.parse.unquote(url)
                    ids = ''
                    count = 0
                    for param in url_decode.split('&'):
                        if 'ids[]' in param:
                            count += 1
                            ids += param + ','
                    for type in types:
                        if action == 'bulk':
                            embed = request.env['ir.config_parameter'].sudo().get_param(
                                'web.base.url') + '/pdf/bulk/print/' + type + '?shop=' + shop + '&' + 'url=' + ids
                            value['preview']['embed'].update({
                                type: embed[:-1] if embed.endswith(',') else embed
                            })
                        if action == 'bulkDraftOrder':
                            embed = request.env['ir.config_parameter'].sudo().get_param(
                                'web.base.url') + '/pdf/bulk/print/' + type + '?shop=' + shop + '&' + 'url=' + ids + '&' + 'orderType=' + action
                            value['preview']['embed'].update({
                                type: embed[:-1] if embed.endswith(',') else embed
                            })
                        # timeout = int(ids.count('ids[]')) * 1500
                if action == 'draftOrder':
                    for type in types:
                        embed = request.env['ir.config_parameter'].sudo().get_param(
                            'web.base.url') + '/pdf/single/print/' + type + '?id=' + str(
                            order_id) + '&' + 'shop=' + shop + '&' + 'orderType=' + action
                        value['preview']['embed'].update({
                            type: embed[:-1] if embed.endswith(',') else embed
                        })
                value.update({
                    'timeout': timeout
                })
                if embed is not None:
                    return request.render('shopify_pdf_invoice.preview', value, headers=headers)
            return request.render('shopify_pdf_invoice.turn_off', headers=headers)
        except Exception as e:
            shop = None
            if 'shop' in request.params:
                shop = request.params['shop']
            self.create_shop_log(log=traceback.format_exc(), shop=shop)
            _logger.error(traceback.format_exc())
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_pdf_invoice.404_not_found', headers=headers)

    @http.route('/admin/pdf/single/print/<string:type>', type='http', auth="user")
    def admin_print_single_pdf(self, type=None):
        try:
            # ensure_login()
            params = request.params
            session = self.start_shopify_session(shop=params['shop'])
            isDraftOrder = 'orderType' in params
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"}
            if isDraftOrder:
                isDraftOrder = isDraftOrder and params['orderType'] == 'draftOrder'
            if session['shop'].allow_backend:
                order_id = params['id']
                if not isDraftOrder:
                    order = shopify.Order.find(limit=10, id_=order_id)
                else:
                    order = shopify.DraftOrder.find(limit=10, id_=order_id)
                orders = []
                if type == 'invoice':
                    orders.append(order)
                if type == 'refund':
                    if order.attributes.get('refunds'):
                        if len(order.attributes.get('refunds')) > 0:
                            for refund in order.attributes['refunds']:
                                if len(refund.attributes.get('transactions')) > 0:
                                    orders.append(order)
                                    break
                if type == 'packing':
                    if order.attributes.get('fulfillments'):
                        if len(order.attributes.get('fulfillments')) > 0:
                            orders.append(order)
                templates = session['shop'].templates.filtered(lambda l: l.default == True and l.type == type)
                if len(templates) == 0 or len(orders) == 0:
                    return request.render('shopify_pdf_invoice.empty_state', headers=headers)
                file_name = re.sub('[^A-Za-z0-9]+', '', 'Order_' + str(order.attributes.get('name')) if order.attributes else "")
                mode = 'inline'
                orders.reverse()
                image_data = self.get_image_data(orders=orders, shop=session['shop'], template=templates)
                merged_pdf = session['shop'].get_pdf(templates=templates, orders=orders, image_data=image_data,
                                                     type=type, isDraftOrder=isDraftOrder)
                pdfhttpheaders = [
                    ('Content-Type', 'application/pdf'),
                    # ('Content-Length', len(pdf_content)),
                    ('Content-Disposition', mode + '; filename=' + file_name + '.pdf'),
                    ('Content-Security-Policy', "frame-ancestors https://" + request.session[
                        'shop_url_pdf'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"),
                ]
                response = request.make_response(merged_pdf, headers=pdfhttpheaders)
                # response.set_cookie('fileToken', token)
                return response
            return request.render('shopify_pdf_invoice.turn_off', headers=headers)
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_pdf_invoice.404_not_found', {'e': str(e)}, headers=headers)

    @http.route('/pdf/single/print/<string:type>', type='http', auth="public", save_session=False)
    def print_single_pdf(self, type=None):
        try:
            ensure_login()
            params = request.params
            session = self.start_shopify_session(shop=params['shop'])
            isDraftOrder = 'orderType' in params
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"}
            if isDraftOrder:
                isDraftOrder = isDraftOrder and params['orderType'] == 'draftOrder'
            if session['shop'].allow_backend:
                # check limit plan
                # if isDraftOrder:
                #     if not session['shop'].get_current_plan().price > 0:
                #         return request.render('shopify_pdf_invoice.empty_state_limit_pdf_view', {
                #             'type': 'limit_view_draft_order',
                #         }, headers=headers)
                order_id = params['id']
                # check limit plan
                view_count = session['shop'].get_view_count()
                if session['shop'].get_current_plan().limit_pdf_view > 0:
                    if view_count > session['shop'].get_current_plan().limit_pdf_view:
                        return request.render('shopify_pdf_invoice.empty_state_limit_pdf_view', {
                            'type': 'limit_pdf_view_order',
                        }, headers=headers)
                if not isDraftOrder:
                    order = shopify.Order.find(limit=10, id_=order_id)
                else:
                    order = shopify.DraftOrder.find(limit=10, id_=order_id)
                if order:
                    orders = []
                    if type == 'invoice':
                        orders.append(order)
                    if type == 'refund':
                        if order.attributes.get('refunds'):
                            if len(order.attributes.get('refunds')) > 0:
                                for refund in order.attributes['refunds']:
                                    if len(refund.attributes.get('transactions')) > 0:
                                        orders.append(order)
                                        break
                    if type == 'packing':
                        if order.attributes.get('fulfillments'):
                            if len(order.attributes.get('fulfillments')) > 0:
                                orders.append(order)
                    templates = session['shop'].templates.filtered(lambda l: l.default == True and l.type == type)
                    if len(templates) == 0 or len(orders) == 0:
                        return request.render('shopify_pdf_invoice.empty_state', headers=headers)
                    # create view log
                    request.env['shopify.pdf.view.log'].sudo().create({
                        'name': session['shop'].name + '-' + 'view order',
                        'shop_id': session['shop'].id,
                        'view_count': len(orders)
                    })
                    # render pdf
                    file_name = re.sub('[^A-Za-z0-9]+', '', 'Order_' + str(order.attributes.get('name')) if order.attributes else "" )
                    mode = 'inline'
                    orders.reverse()
                    image_data = self.get_image_data(orders=orders, shop=session['shop'], template=templates)
                    merged_pdf = session['shop'].get_pdf(templates=templates, orders=orders, image_data=image_data,
                                                         type=type, isDraftOrder=isDraftOrder)
                    pdfhttpheaders = [
                        ('Content-Type', 'application/pdf'),
                        # ('Content-Length', len(pdf_content)),
                        ('Content-Disposition', mode + '; filename=' + file_name + '.pdf'),
                        ('Content-Security-Policy', "frame-ancestors https://" + request.session[
                        'shop_url_pdf'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"),
                    ]
                    response = request.make_response(merged_pdf, headers=pdfhttpheaders)
                    # response.set_cookie('fileToken', token)
                    return response
                else:
                    return request.render('shopify_pdf_invoice.turn_off', headers=headers)
            return request.render('shopify_pdf_invoice.turn_off', headers=headers)
        except Exception as e:
            shop = None
            if 'shop' in request.params:
                shop = request.params['shop']
            self.create_shop_log(log=traceback.format_exc(), shop=shop)
            _logger.error(traceback.format_exc())
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_pdf_invoice.404_not_found', {'e': str(e)}, headers=headers)

    @http.route('/admin/pdf/bulk/print/<string:type>', type='http', auth="user")
    def admin_print_multiple_pdf(self, type=None):
        try:
            # ensure_login()
            params = request.params
            session = self.start_shopify_session(shop=params['shop'])
            isDraftOrder = 'orderType' in params
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"}
            if isDraftOrder:
                isDraftOrder = isDraftOrder and params['orderType'] == 'bulkDraftOrder'
            if session['shop'].allow_backend:
                if 'url' in params:
                    url = params['url']
                else:
                    url = request.httprequest.url
                    url.replace('&', ',')
                ids = []
                reg = re.compile('[0-9]')
                for param in url.split(','):
                    if 'ids[]' in param:
                        string = param.replace('ids[]=', '')
                        if reg.match(string):
                            ids.append(string)
                filters = ','.join(ids)
                if not isDraftOrder:
                    orders_filters = shopify.Order.find(limit=200, **{'ids': filters, 'status': 'any'})
                else:
                    orders_filters = shopify.DraftOrder.find(limit=200, **{'ids': filters})
                templates = session['shop'].templates.filtered(lambda l: l.default == True and l.type == type)
                orders = []
                for order in orders_filters:
                    if type == 'invoice':
                        orders.append(order)
                    if type == 'refund':
                        if len(order.attributes.get('refunds')) > 0:
                            for refund in order.attributes['refunds']:
                                if len(refund.attributes.get('transactions')) > 0:
                                    orders.append(order)
                                    break
                    if type == 'packing':
                        if len(order.attributes.get('fulfillments')) > 0:
                            orders.append(order)
                if len(templates) == 0 or len(orders) == 0:
                    return request.render('shopify_pdf_invoice.empty_state', headers=headers)
                orders.reverse()
                image_data = self.get_image_data(orders=orders, shop=session['shop'], template=templates)
                file_name = 'Order_'
                for order in orders:
                    file_name = re.sub('[^A-Za-z0-9]+', '', order.attributes.get('name') + '_')
                mode = 'inline'
                if len(templates) == 0:
                    return request.render('shopify_pdf_invoice.empty_state', headers=headers)
                merged_pdf = session['shop'].get_pdf(templates=templates, orders=orders, image_data=image_data,
                                                     type=type, isDraftOrder=isDraftOrder)
                pdfhttpheaders = [
                    ('Content-Type', 'application/pdf'),
                    ('Content-Length', len(merged_pdf)),
                    ('Content-Disposition', mode + '; filename=' + file_name + '.pdf'),
                    ('Content-Security-Policy', "frame-ancestors https://" + request.session[
                        'shop_url_pdf'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"),
                ]
                response = request.make_response(merged_pdf, headers=pdfhttpheaders)
                # response.set_cookie('fileToken', token)
                return response
            return request.render('shopify_pdf_invoice.turn_off', headers=headers)
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_pdf_invoice.404_not_found', {'e': str(e)}, headers=headers)

    @http.route('/pdf/bulk/print/<string:type>', type='http', auth="public", save_session=False)
    def print_multiple_pdf(self, type=None):
        try:
            ensure_login()
            params = request.params
            session = self.start_shopify_session(shop=params['shop'])
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"}
            isDraftOrder = 'orderType' in params
            if isDraftOrder:
                isDraftOrder = isDraftOrder and params['orderType'] == 'bulkDraftOrder'
            if session['shop'].allow_backend:
                # check plan
                # if isDraftOrder:
                #     if not session['shop'].get_current_plan().price > 0:
                #         return request.render('shopify_pdf_invoice.empty_state_limit_pdf_view', {
                #             'type': 'limit_view_draft_order',
                #         }, headers=headers)
                if 'url' in params:
                    url = params['url']
                else:
                    url = request.httprequest.url
                    url.replace('&', ',')
                ids = []
                reg = re.compile('[0-9]')
                for param in url.split(','):
                    if 'ids[]' in param:
                        string = param.replace('ids[]=', '')
                        if reg.match(string):
                            ids.append(string)
                filters = ','.join(ids)
                if session['shop'] and 0 < session['shop'].get_current_plan().limit_bulk_print < len(ids):
                    return request.render('shopify_pdf_invoice.empty_state_limit_bulk', {
                        'bulk_limit': session['shop'].plan.limit_bulk_print,
                        'plan_name': session['shop'].plan.name
                    }, headers=headers)
                # check limit plan
                view_count = session['shop'].get_view_count()
                if session['shop'].get_current_plan().limit_pdf_view > 0:
                    if view_count > session['shop'].get_current_plan().limit_pdf_view:
                        return request.render('shopify_pdf_invoice.empty_state_limit_pdf_view', {
                            'type': 'limit_pdf_view_order',
                        }, headers=headers)
                if not isDraftOrder:
                    orders_filters = shopify.Order.find(limit=200, **{'ids': filters, 'status': 'any'})
                else:
                    orders_filters = shopify.DraftOrder.find(limit=200, **{'ids': filters})
                templates = session['shop'].templates.filtered(lambda l: l.default == True and l.type == type)
                orders = []
                for order in orders_filters:
                    if type == 'invoice':
                        orders.append(order)
                    if type == 'refund' and order.attributes.get('refunds'):
                        if len(order.attributes.get('refunds')) > 0:
                            for refund in order.attributes['refunds']:
                                if len(refund.attributes.get('transactions')) > 0:
                                    orders.append(order)
                                    break
                    if type == 'packing' and order.attributes.get('fulfillments'):
                        if len(order.attributes.get('fulfillments')) > 0:
                            orders.append(order)
                if len(templates) == 0 or len(orders) == 0:
                    return request.render('shopify_pdf_invoice.empty_state', headers=headers)
                # create view log
                request.env['shopify.pdf.view.log'].sudo().create({
                    'name': session['shop'].name + '-' + 'view order',
                    'shop_id': session['shop'].id,
                    'view_count': len(orders)
                })
                orders.reverse()
                image_data = self.get_image_data(orders=orders, shop=session['shop'], template=templates)
                file_name = 'Order_'
                for order in orders:
                    file_name = re.sub('[^A-Za-z0-9]+', '', order.attributes.get('name') + '_')
                mode = 'inline'
                if len(templates) == 0:
                    return request.render('shopify_pdf_invoice.empty_state', headers=headers)
                merged_pdf = session['shop'].get_pdf(templates=templates, orders=orders, image_data=image_data,
                                                     type=type, isDraftOrder=isDraftOrder)
                pdfhttpheaders = [
                    ('Content-Type', 'application/pdf'),
                    ('Content-Length', len(merged_pdf)),
                    ('Content-Disposition', mode + '; filename=' + file_name + '.pdf'),
                    ('Content-Security-Policy', "frame-ancestors https://" + request.session[
                        'shop_url_pdf'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"),
                ]
                response = request.make_response(merged_pdf, headers=pdfhttpheaders)
                # response.set_cookie('fileToken', token)
                return response
            return request.render('shopify_pdf_invoice.turn_off', headers=headers)
        except Exception as e:
            shop = None
            if 'shop' in request.params:
                shop = request.params['shop']
            self.create_shop_log(log=traceback.format_exc(), shop=shop)
            _logger.error(traceback.format_exc())
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_pdf_invoice.404_not_found', {'e': str(e)}, headers=headers)

    def get_image_data(self, orders=None, shop=None, template=None):
        image_data = {}
        img = {}
        compare_price = {}
        products = []
        inventory_ids = []
        inventory_item_dict = {}
        for order in orders:
            for item in order.attributes.get('line_items'):
                if str(item.attributes.get('product_id')) not in products:
                    products.append(str(item.attributes.get('product_id')))
        products = ','.join(products)
        all_products = shopify.Product.find(limit=200, **{'ids': products})
        for product in all_products:
            for image in product.attributes.get('images'):
                if len(image.attributes.get('variant_ids')) > 0:
                    for variant_img in image.attributes.get('variant_ids'):
                        img.update({
                            str(variant_img): image.attributes.get('src')
                        })

            if len(product.attributes.get('images')) > 0:
                img.update({
                    str(product.attributes.get('id')) + 'none': product.attributes.get('images')[0].attributes.get(
                        'src'),
                })
            if product.attributes.get('variants') and len(product.attributes.get('variants')) > 0:
                for variant in product.attributes.get('variants'):
                    compare_price.update({
                        str(variant.attributes.get('id')): variant.attributes.get('compare_at_price')
                    })
                    inventory_ids.append(str(variant.attributes.get('inventory_item_id')))
                    inventory_item_dict.update({
                        str(variant.attributes.get('inventory_item_id')): str(variant.attributes.get('id'))
                    })
            image_data.update({
                str(product.attributes.get('id')): img,
                str(product.attributes.get('id')) + '_description': self.convert_product_description(
                    product.attributes.get('body_html')),
                str(product.attributes.get('id')) + '_compare_price': compare_price
            })
            if shop and shop.plan and shop.plan.more_product_info:
                if template and self.check_more_product_info_template(template):
                    inventory_ids_str = ','.join(inventory_ids)
                    shopify_inventory_items = shopify.InventoryItem.find(limit=200, **{'ids': inventory_ids_str})
                    for inventory_item in shopify_inventory_items:
                        item_data = {}
                        item_data['hs_code'] = inventory_item.attributes.get('harmonized_system_code')
                        item_data['country_of_origin'] = inventory_item.attributes.get('country_code_of_origin')
                        item_data['cost_per_item'] = inventory_item.attributes.get('cost')
                        if str(inventory_item.attributes.get('id')) in inventory_item_dict:
                            variant_id = inventory_item_dict[str(inventory_item.attributes.get('id'))]
                            inventory_item_dict[variant_id] = item_data
                    image_data.update({
                        str(product.attributes.get('id')) + '_inventory': inventory_item_dict
                    })
        return image_data

    def check_more_product_info_template(self, templates):
        for template in templates:
            html = template.html
            return '{{product_hs_code}}' in html or '{{product_country_of_origin}}' in html or '{{cost_per_item}}' in html
        return False

    def convert_product_description(self, description=None):
        if description is not None:
            html = re.sub(r'<(.+?)>', '', description)
            return html
        return ''

    def fill_sample_data(self, html=None, shop=None):
        html = shop.html_format(html)
        dom = xml.dom.minidom.parseString(html)
        trs = dom.getElementsByTagName("tr")
        for tr in trs:
            if tr.getAttribute("id") == 'row_items' or shop.check_is_row_items_block(tr):
                for x in self.SAMPLE_DATA()['items']:
                    new_tr = tr.cloneNode(True)
                    for td in new_tr.childNodes:
                        for child_node in td.childNodes:
                            if child_node.nodeName == 'img':
                                src = child_node.getAttributeNode('src').nodeValue
                                if src in self.SAMPLE_DATA()['items'][x]:
                                    child_node.getAttributeNode('src').nodeValue = self.SAMPLE_DATA()['items'][x][src]
                            else:
                                if child_node.nodeName != '#text' and len(
                                        child_node.getElementsByTagName('shortcode')) > 0:
                                    for short_code_node in child_node.getElementsByTagName('shortcode'):
                                        short_code = short_code_node.firstChild.nodeValue
                                        short_code = re.sub("\n", "", short_code)
                                        short_code = short_code.replace(" ", "")
                                        if short_code in self.SAMPLE_DATA()['items'][x]:
                                            short_code_node.firstChild.nodeValue = self.SAMPLE_DATA()['items'][x][
                                                short_code]
                                        else:
                                            short_code_node.firstChild.nodeValue = '--'
                                if child_node.nodeName == 'shortcode':
                                    for short_code_node in child_node.childNodes:
                                        short_code = short_code_node.nodeValue
                                        short_code = re.sub("\n", "", short_code)
                                        short_code = short_code.replace(" ", "")
                                        if short_code in self.SAMPLE_DATA()['items'][x]:
                                            short_code_node.nodeValue = self.SAMPLE_DATA()['items'][x][short_code]
                                        else:
                                            short_code_node.nodeValue = '--'
                            if child_node.nodeName != '#text' and len(child_node.getElementsByTagName('img')) > 0:
                                for img_child_node in child_node.getElementsByTagName('img'):
                                    if img_child_node.getAttributeNode('src').nodeValue == '{{product_image}}':
                                        img_child_node.getAttributeNode('src').nodeValue = \
                                        self.SAMPLE_DATA()['items'][x]['{{product_image}}']
                    tr.parentNode.insertBefore(new_tr, tr)
                tr.parentNode.removeChild(tr)
        img_tag = dom.getElementsByTagName("img")
        for img in img_tag:
            if img.getAttribute("id") == 'qr_code':
                src = shop.get_qr_code(self.SAMPLE_DATA()['{{qr_code}}'])
                img.getAttributeNode('src').nodeValue = src
            if '{{' in img.getAttributeNode('src').nodeValue or '}}' in img.getAttributeNode('src').nodeValue:
                img.getAttributeNode('src').nodeValue = ''
        html = dom.toxml()
        return html

    def start_shopify_session(self, shop=None):
        shop_model = ShopifyHelper(shop_url=shop, env=request.env).shop_model
        token = None
        session = None
        if shop_model:
            token = shop_model.token
            session = ShopifyHelper(shop_url=shop_model.name, token=token, env=request.env).auth()
        return {
            'session': session,
            'shop': shop_model
        }

    @http.route('/pdf/print/<string:type>/<string:page>', type='http', auth="public", save_session=False)
    def pdf_preview_online_store(self, type=None, page=None):
        try:
            params = request.params
            session = self.start_shopify_session(shop=params['shop'])
            order_id = None
            token = params['token'] if 'token' in params else ''
            if type == 'order_status_page':
                order_id = int(int(params['id']) / 78) if 'id' in params else ''
            if type == 'customer_order_page':
                order_id = int(int(params['id']) / 77) if 'id' in params else ''
            template_id = False
            if session['shop'].default_template and session['shop'].default_template != '':
                template_id = session['shop'].decode(int(session['shop'].default_template))
            templates = session['shop'].templates.filtered(lambda t: t.id == template_id)
            orders = []
            message = 'Order not found !'
            if order_id is not None and templates:
                order = shopify.Order.find(id_=order_id)
                if not order:
                    raise ValueError('Order not found')
                check_token = False
                if type == 'order_status_page':
                    if order and order.attributes.get('checkout_token') == token:
                        check_token = True
                elif type == 'customer_order_page':
                    if order and order.attributes.get('token') == token:
                        check_token = True
                else:
                    raise ValueError('Type is missing')

                if check_token:
                    orders.append(order)
                    file_name = re.sub('[^A-Za-z0-9]+', '', 'Order_' + str(order.attributes.get('name')))
                    mode = 'inline'
                    orders.reverse()
                    image_data = self.get_image_data(orders=orders, shop=session['shop'], template=templates)
                    merged_pdf = session['shop'].get_pdf(templates=templates, orders=orders, image_data=image_data,
                                                         type=templates.type)
                    pdfhttpheaders = [
                        ('Content-Type', 'application/pdf'),
                        # ('Content-Length', len(pdf_content)),
                        ('Content-Disposition', mode + '; filename=' + file_name + '.pdf'),
                        ('Content-Security-Policy', "frame-ancestors https://" + request.params['shop'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"),
                    ]
                    response = request.make_response(merged_pdf, headers=pdfhttpheaders)
                    return response
                else:
                    raise ValueError('Token is missing')
            else:
                self.create_shop_log(log=str(order_id) + str(templates), shop=params['shop'])
        except Exception as e:
            shop = None
            if 'shop' in request.params:
                shop = request.params['shop']
            self.create_shop_log(log=traceback.format_exc(), shop=shop)
            _logger.error(traceback.format_exc())
            message = str(e)
        error = {
            'message': message,
        }
        return request.make_response((json.dumps(error)), headers=[('Content-Type', 'application/json; charset=utf-8')])

    @http.route('/pdf/print/<int:template_id>/<int:order_id>/<int:order_number>', type='http', auth="public",
                save_session=False)
    def email_notification_pdf(self, template_id=None, order_id=None, order_number=None):
        try:
            params = request.params
            shop = ''
            if 'shop' in request.params:
                shop = request.params['shop']
            session = self.start_shopify_session(shop=shop)

            order_id = int(int(order_id) / 78) if order_id else None
            order_number = int(order_number / 78) if order_number else None
            template_id_decode = session['shop'].decode(int(template_id))
            templates = session['shop'].templates.filtered(lambda t: t.id == template_id_decode)
            # fix stupid code, khong can hieu doan code nay lam gi
            if not templates:
                template_force_id_2020 = int((int(template_id) - 2020) / session['shop'].id)
                templates = session['shop'].templates.filtered(lambda t: t.id == template_force_id_2020)
                if not templates:
                    template_force_id_2021 = int((int(template_id) - 2021) / session['shop'].id)
                    templates = session['shop'].templates.filtered(lambda t: t.id == template_force_id_2021)
            # done stupid code
            orders = []
            message = 'Error!'
            if order_id is not None and templates:
                order = shopify.Order.find(id_=order_id)
                if not order:
                    message = 'Order not found !'
                check_order = False
                if order and order.attributes.get('order_number') == order_number:
                    check_order = True
                if check_order:
                    orders.append(order)
                    file_name = re.sub('[^A-Za-z0-9]+', '', 'Order_' + str(order.attributes.get('name')))
                    # mode = 'attachment'
                    mode = 'inline'
                    image_data = self.get_image_data(orders=orders, shop=session['shop'], template=templates)
                    merged_pdf = session['shop'].get_pdf(templates=templates, orders=orders, image_data=image_data,
                                                         type=templates.type)
                    pdfhttpheaders = [
                        ('Content-Type', 'application/pdf'),
                        # ('Content-Length', len(pdf_content)),
                        ('Content-Disposition', mode + '; filename=' + file_name + '.pdf'),
                        ('Content-Security-Policy', "frame-ancestors https://" + request.params['shop'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"),
                    ]
                    shopify.ShopifyResource.clear_session()
                    response = request.make_response(merged_pdf, headers=pdfhttpheaders)
                    return response
            else:
                self.create_shop_log(log=str(order_id) + str(templates), shop=params['shop'])
        except Exception as e:
            shop = None
            if 'shop' in request.params:
                shop = request.params['shop']
            self.create_shop_log(log=traceback.format_exc(), shop=shop)
            _logger.error(traceback.format_exc())
            message = 'Error!'
        shopify.ShopifyResource.clear_session()
        error = {
            'code': 200,
            'message': message,
        }
        return request.make_response((json.dumps(error)), headers=[('Content-Type', 'application/json; charset=utf-8')])

    @http.route('/pdf/theme/print/<string:type>/<int:order_id>', type='http', auth="public",
                save_session=False)
    def pdf_download_order_history(self, type=None, order_id=None):
        try:
            params = request.params
            shop = ''
            if 'shop' in request.params:
                shop = request.params['shop']
            session = self.start_shopify_session(shop=shop)

            order_id = int(int(order_id) / 78) if order_id else None
            templates = session['shop'].templates.filtered(lambda t: t.type == type and t.active)
            # done stupid code
            orders = []
            message = 'Error!'
            if order_id is not None and templates:
                order = shopify.Order.find(id_=order_id)
                if not order:
                    message = 'Order not found !'
                check_order = False
                if order:
                    check_order = True
                if check_order:
                    orders.append(order)
                    file_name = re.sub('[^A-Za-z0-9]+', '', 'Order_' + str(order.attributes.get('name')))
                    # mode = 'attachment'
                    mode = 'inline'
                    image_data = self.get_image_data(orders=orders, shop=session['shop'], template=templates)
                    merged_pdf = session['shop'].get_pdf(templates=templates, orders=orders, image_data=image_data,
                                                        type=templates.type)
                    pdfhttpheaders = [
                        ('Content-Type', 'application/pdf'),
                        # ('Content-Length', len(pdf_content)),
                        ('Content-Disposition', mode + '; filename=' + file_name + '.pdf'),
                        ('Content-Security-Policy', "frame-ancestors https://" + request.params['shop'] + " https://admin.shopify.com https://" + request.httprequest.host + ";"),
                    ]
                    shopify.ShopifyResource.clear_session()
                    response = request.make_response(merged_pdf, headers=pdfhttpheaders)
                    return response
            else:
                self.create_shop_log(log=str(order_id) + str(templates), shop=params['shop'])
        except Exception as e:
            shop = None
            if 'shop' in request.params:
                shop = request.params['shop']
            self.create_shop_log(log=traceback.format_exc(), shop=shop)
            _logger.error(traceback.format_exc())
            message = 'Error!'
        shopify.ShopifyResource.clear_session()
        error = {
            'code': 200,
            'message': message,
        }
        return request.make_response((json.dumps(error)), headers=[('Content-Type', 'application/json; charset=utf-8')])

    def create_shop_log(self, log=None, shop=None):
        shop_name = ''
        if 'shop_url_pdf' in request.session:
            shop_model = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env).shop_model
            if shop_model:
                shop_name = shop_model.name
        if shop is not None:
            shop_name = shop
        log = {
            'name': shop_name,
            'created_at': fields.Datetime.now(),
            'log': log
        }
        request.env['shopify.pdf.shop.log'].sudo().create(log)
        return True

    @http.route('/admin/get/order', type='http', auth="user")
    def admin_get_order(self):
        try:
            params = request.params
            shop = params['shop']
            order_id = params['id']
            message = 'Not Found'
            session = self.start_shopify_session(shop=shop)
            order = shopify.Order.find(id_=order_id)
            if order:
                return request.make_response(json.dumps({'data': str(order.attributes)}),
                                             headers=[('Content-Type', 'application/json; charset=utf-8')])
        except Exception as e:
            message = str(e)
            _logger.error(traceback.format_exc())
        error = {
            'code': 200,
            'message': message,
        }
        return request.make_response((json.dumps(error)), headers=[('Content-Type', 'application/json; charset=utf-8')])

    @http.route('/admin/reset/redirect_action', type='http', auth="user")
    def admin_reset_redirect(self):
        try:
            # all shop
            shops = request.env['shopify.pdf.shop'].sudo().search([('token', '!=', False)])
            for shop in shops:
                shop.redirect_action = False
            return 'Done'
        except Exception as e:
            message = str(e)
            _logger.error(traceback.format_exc())
        return 'Not Done'

    @http.route('/get/button/label', type='http', auth='public', methods=['GET'], cors='*', save_session=False)
    def get_button_label(self, **params):
        label = "Print your invoice here"
        allow_frontend = None
        if 'shop' in params:
            shop = request.env['shopify.pdf.shop'].sudo().search([('name', '=', params['shop'])])
            if shop and shop.front_button_label:
                label = shop.front_button_label
                allow_frontend = shop.allow_frontend
        return json.dumps({
            'label': label,
            'allow_frontend': allow_frontend
        })

