import traceback
from odoo import http
import logging
from odoo.http import request
import json
from ..oauth2.decorator import ensure_login
from ..oauth2.auth import ShopifyHelper
from .pdf import PdfReportController
from .authenticate import ShopifyConnector
from ..models.mail import EmailLog
import shopify
import re


_logger = logging.getLogger(__name__)


class Mail(PdfReportController):

    @http.route('/pdf/email/send/<string:shop>/<string:type>', type='json', auth="public", save_session=False)
    def email_order_webhook(self, shop=None, type=None):
        email_log = {
            'customer_email': None,
            'shopify_object_id': None,
            'shop_id': None,
            'type': type,
            'message': '',
            'traceback': '',
            'request_data': ''
        }
        message = ''
        try:
            secret_key = request.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_api_secret')
            verify = ShopifyConnector.verify_webhook(request.httprequest.data.decode("utf-8"), request.httprequest.headers.get('X-Shopify-Hmac-Sha256'), secret_key)
            session = self.start_shopify_session(shop=shop)
            shop_model = session['shop']
            if not shop_model or not verify:
                raise ValueError('Could not find shop')
            email_log['shop_id'] = shop_model.id

            if not shop_model.get_current_plan().automation_email:
                return {
                    "status": False,
                    "message": "You need to subscribe to our plan first"
                }

            email_log['request_data'] = json.dumps(json.loads(request.httprequest.data))
            if type != 'refund':
                order = shopify.Order(attributes=json.loads(request.httprequest.data))
            elif json.loads(request.httprequest.data).get('order_id'):
                order = shopify.Order.find(json.loads(request.httprequest.data).get('order_id'))
            else:
                order = None

            if not order:
                raise ValueError('Order not found')

            customer_email = order.attributes.get('contact_email')
            email_log['customer_email'] = customer_email

            if type != 'refund':
                shopify_object_id = order.attributes.get('id')
            else:
                # for partial refund, need to add items ID to object id for duplicate checking
                items_id = []
                for item in json.loads(request.httprequest.data).get('refund_line_items', []):
                    items_id.append(item.get('id', None))
                items_id.sort()
                shopify_object_id = ','.join(str(x) for x in ([order.attributes.get('id')] + items_id))

            email_log['shopify_object_id'] = shopify_object_id

            email_log_existed = request.env['shopify.pdf.email.log'].sudo().search([
                ('shop_id', '=', shop_model.id),
                ('shopify_object_id', '=', shopify_object_id),
                ('type', '=', type)
            ])

            if email_log_existed:
                return 'Already Sent'

            if not customer_email:
                # handling no email
                raise ValueError('No Customer Email')

            # compute PDF file
            orders = [order]
            templates = shop_model.templates.filtered(lambda l: l.default and l.type == type)

            # handling email settings
            email_settings = request.env['shopify.pdf.email.automation'].sudo().search([('shop_id', '=', shop_model.id), ('type', '=', type)], limit=1)
            subject = email_settings.email_subject
            custom_message = email_settings.custom_email_message
            file_name = email_settings.email_file_name

            checked = True

            # check email tags
            tags = email_settings.get_email_tags_list()
            if tags:
                order_tags = order.attributes.get('tags')
                if not order_tags:
                    email_log['status'] = EmailLog.STATUS_PROCESSED
                    email_log['message'] = 'No order tags were found'
                    checked = False
                # else:
                #     # strip white spaces from head and tail
                #     order_tags = [x.strip() for x in order_tags.split(',')]
                #     for tag in tags:
                #         if tag not in order_tags:
                #             checked = False
                #             email_log['status'] = EmailLog.STATUS_PROCESSED
                #             email_log['message'] = 'Tag: <' + tag + '> was not found in the order'
                #             break

            # check email limits
            checked = checked and shop_model.sudo().check_email_limits()

            if checked:
                # pdf content
                image_data = self.get_image_data(orders=orders,shop=shop_model,template=templates)
                pdf_content = shop_model.get_pdf(templates=templates, orders=orders, image_data=image_data, type=type)

                # translate subject, file_name and content
                shortcodes = shop_model.prepare_order_data(order=order, shop=shop_model, type=type, template=templates)

                def replace_shortcode(match):
                    shortcode = match.group(1)
                    shortcode = shortcodes.get(shortcode) if shortcodes.get(shortcode) else shortcode
                    return str(shortcode)
                subject = re.sub('(\{\{[^\{\}]*\}\})', replace_shortcode, subject)
                custom_message = re.sub('(\{\{[^\{\}]*\}\})', replace_shortcode, custom_message)
                file_name = re.sub('(\{\{[^\{\}]*\}\})', replace_shortcode, file_name)

                # mail body

                # handle items' image
                items = order.attributes.get('line_items')
                for item in items:
                    product_id = str(item.attributes.get('product_id'))
                    variant_id = str(item.attributes.get('variant_id'))
                    if product_id in image_data:
                        if variant_id in image_data[product_id]:
                            item.attributes['image_url'] = image_data[product_id][variant_id]
                        elif product_id + 'none' in image_data[product_id]:
                            item.attributes['image_url'] = image_data[product_id][product_id + 'none']

                content = request.env["ir.ui.view"]._render_template('shopify_pdf_invoice.mail', {
                    'custom_message': custom_message,
                    'order_name': order.attributes.get('name'),
                    'shop_name': shop_model.shop_company_name,
                    'order_status_url': order.attributes.get('order_status_url'),
                    'store_url': shop_model.name,
                    'items': items,
                    'order': order
                })

                # sending email
                mail_client = request.env['shopify.pdf.mail']
                # attachment = mail_client.prep_attachment(pdf_content, file_name=file_name, file_type='application/pdf')
                reply_to = email_settings.email_reply_to
                if not reply_to:
                    reply_to = shop_model.email
                mail_client.send(to_email=customer_email, subject=subject, content=content, pdf_content=pdf_content, file_name=file_name
                                 , bcc=email_settings.bcc_to, reply_to=reply_to, name=shop_model.shop_name)
                email_log['status'] = EmailLog.STATUS_SUCCESS
                message = 'Sent'
        except Exception as e:
            email_log['status'] = EmailLog.STATUS_ERROR
            email_log['message'] = str(e)
            email_log['traceback'] = traceback.format_exc()
            message = str(e)
        request.env['shopify.pdf.email.log'].sudo().create([email_log])
        return message

    @http.route('/pdf/emailautomation/test', type='json', auth="public", methods=['POST'], save_session=False)
    def email_test(self):
        ensure_login()
        session = self.start_shopify_session(shop=request.session['shop_url_pdf'])
        shop_model = session['shop']
        if not shop_model.get_current_plan().automation_email:
            return {
                "status": False,
                "message": "You need to subscribe to our plan first"
            }
        params = json.loads(request.httprequest.data).get('data')  # type: dict
        if not params:
            print('Parameters not found')
            return {
                "status": False
            }
        type = params.get('type')

        # clean data
        params.pop('id', None)
        params.pop('email_tags_split', None)

        email_log = {
            'customer_email': None,
            'shopify_object_id': None,
            'shop_id': None,
            'type': type,
            'message': '',
            'traceback': '',
            'request_data': ''
        }
        message = ''
        status = False
        try:
            email_log['shop_id'] = shop_model.id

            email_log['request_data'] = json.dumps(request.params)

            customer_email = params.get('test_email')

            if not customer_email:
                return {
                    "status": False,
                    "message": "Please set your test email"
                }

            email_log['customer_email'] = customer_email

            # compute PDF file
            templates = shop_model.templates.filtered(lambda l: l.default and l.type == type)

            # handling email settings
            email_settings = request.env['shopify.pdf.email.automation'].new(params)
            subject = email_settings.email_subject
            custom_message = email_settings.custom_email_message
            file_name = email_settings.email_file_name

            # sample data
            sample_data = self.SAMPLE_DATA()

            # translate subject, file_name and content
            shortcodes = sample_data

            def replace_shortcode(match):
                shortcode = match.group(1)
                shortcode = shortcodes.get(shortcode) if shortcodes.get(shortcode) else shortcode
                return str(shortcode)

            subject = re.sub('(\{\{[^\{\}]*\}\})', replace_shortcode, subject)
            custom_message = re.sub('(\{\{[^\{\}]*\}\})', replace_shortcode, custom_message)
            file_name = re.sub('(\{\{[^\{\}]*\}\})', replace_shortcode, file_name)

            # make a fake order
            order = shopify.Order({
                'currency': 'USD',
                'price': '320.00',
                'total_price': '320.00',
                'subtotal_price': '300.00',
                'total_tax': '0.00',
                'total_discounts': '0.00',
                'total_shipping_price_set': {
                    'shop_money': {
                        'amount': '20.00'
                    }
                },
                'shipping_address': {
                    'name': 'Hapoapps',
                    'address1': '300 De La Thanh, Dong Da',
                    'province': 'Dong Da',
                    'city': 'Ha Noi',
                    'zip': '10000',
                    'country_code': 'VN'
                },
                'billing_address': {
                    'name': 'Hapoapps',
                    'address1': '300 De La Thanh, Dong Da',
                    'province': 'Dong Da',
                    'city': 'Ha Noi',
                    'zip': '10000',
                    'country_code': 'VN'
                },
                'shipping_lines': [{
                    'title': 'DHL Express'
                }],
                'payment_details': {
                    'credit_card_company': 'Master Card'
                },
                'items': [
                    {
                        'image_url': '%s/shopify_pdf_invoice/static/description/Logo.png' % (request.env['ir.config_parameter'].sudo().get_param('web.base.url')),
                        'name': 'Adidas Green/Black',
                        'price': '50.00',
                        'quantity': '2',
                    },
                    {
                        'image_url': '%s/shopify_pdf_invoice/static/description/Logo.png' % (request.env['ir.config_parameter'].sudo().get_param('web.base.url')),
                        'name': 'Nike Green/Black',
                        'price': '50.00',
                        'quantity': '3',
                    }
                ]
            })

            # pdf content
            pdf_content = shop_model.get_pdf(orders=[order], templates=templates, type=type, prepare_data=sample_data)

            # mail body
            content = request.env["ir.ui.view"]._render_template('shopify_pdf_invoice.mail', {
                'custom_message': custom_message,
                'order_name': sample_data.get('order_name'),
                'shop_name': shop_model.shop_company_name,
                'order_status_url': sample_data.get('order_status_url'),
                'store_url': shop_model.name,
                'items': order.attributes.get('items'),
                'order': order
            })

            # sending email
            mail_client = request.env['shopify.pdf.mail']
            # attachment = mail_client.prep_attachment(pdf_content, file_name=file_name, file_type='application/pdf')
            mail_client.send(to_email=customer_email, subject=subject, content=content, pdf_content=pdf_content, file_name=file_name
                             , bcc=email_settings.bcc_to, reply_to=email_settings.email_reply_to, name=shop_model.shop_name)
            email_log['status'] = EmailLog.STATUS_SUCCESS
            status = True
            message = 'Sent'
        except Exception as e:
            email_log['status'] = EmailLog.STATUS_ERROR
            email_log['message'] = str(e)
            email_log['traceback'] = traceback.format_exc()
            message = str(e)
        request.env['shopify.pdf.email.log'].sudo().create([email_log])
        return {
            'status': status,
            'message': message
        }
