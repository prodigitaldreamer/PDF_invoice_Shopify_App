# -*- coding: utf-8 -*-
# Standard library imports
import json
import re
import os
import logging
import traceback
import urllib.parse
import xml.dom.minidom
from datetime import datetime
from urllib.parse import urlencode

# Third-party imports
import cssutils
import pdfkit
import shopify
from werkzeug.utils import redirect

# Odoo imports
from odoo import http, fields
from odoo.http import request
from odoo.tools import html_escape

# Local application imports
from ..oauth2.decorator import ensure_login
from ..oauth2.auth import ShopifyHelper
from ..app import PDF_FONTS_CSS_PATH

# Configure logging
_logger = logging.getLogger(__name__)
cssutils.log.setLevel(logging.CRITICAL)

# Constants
DEFAULT_PAGE_SIZE = 'A4'
DEFAULT_ORIENTATION = 'Portrait'
DEFAULT_MARGIN = '16px'
REQUEST_TIMEOUT = 1500
PDF_CONTENT_TYPE = 'application/pdf'

class PdfReportController(http.Controller):
    """
    Controller for PDF report generation and handling in the Shopify PDF Invoice module
    """
    
    def _get_sample_item_data(self, item_number, sku, qty, price, subtotal, vendor, discount='0.00'):
        """
        Helper method to create sample item data for PDF preview
        Args:
            item_number: Item number (e.g. 1, 2)
            sku: Product SKU
            qty: Quantity
            price: Price
            subtotal: Subtotal
            vendor: Product vendor
            discount: Discount amount (default: $0.00)
        Returns:
            dict: Sample item data dictionary
        """
        base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')
        logo_url = f"{base_url}/shopify_order_printer/static/description/Logo.png"
        
        return {
            '{{product_image}}': f'<img style="width: 100px" src="{logo_url}"/>',
            '{{product_name}}': 'Sneaker Green/Black',
            '{{sku}}': sku,
            '{{qty}}': qty,
            '{{price}}': f'${price}',
            '{{tax_amount}}': '$2.50',
            '{{presentment_tax_amount}}': '$2.50',
            '{{presentment_price}}': '$50.00',
            '{{price_with_discount}}': f'${float(price) - float(discount)}',
            '{{presentment_price_with_discount}}': f'${float(price) - float(discount)}',
            '{{compare_price}}': '$45.00',
            '{{price_no_vat}}': '$45.00' if item_number == '1' else '$40.00',
            '{{presentment_price_no_vat}}': '$45.00' if item_number == '1' else '$40.00',
            '{{subtotal}}': f'${subtotal}',
            '{{presentment_subtotal}}': f'${subtotal}' if item_number == '2' else '$100.00',
            '{{item_number}}': f'{item_number}.',
            '{{tracking_number}}': f'Q5{5 + int(item_number)}',
            '{{product_description}}': f'{vendor} Green/Black Color',
            '{{subtotal_no_vat}}': '$90.00' if item_number == '1' else '$135.00',
            '{{presentment_subtotal_no_vat}}': '$90.00' if item_number == '1' else '$135.00',
            '{{product_vendor}}': vendor,
            '{{discount_amount}}': f'${discount}',
            '{{presentment_discount_amount}}': '$0.00',
            '{{discount_per_item}}': '$0.00',
            '{{presentment_discount_per_item}}': '$0.00',
            '{{product_hs_code}}': f'12345{6 + int(item_number)}',
            '{{product_origin_country}}': 'US',
            '{{cost_per_item}}': '$30',
        }
    
    def SAMPLE_DATA(self):
        """
        Generate sample data for PDF preview templates
        Returns:
            dict: Dictionary with sample data for PDF templates
        """
        # Create item data
        items = {
            '1': self._get_sample_item_data('1', 'MH07-L-Green', '2', '150.00', '300.00', 'Adidas'),
            '2': self._get_sample_item_data('2', 'MH08-L-Green', '3', '50.00', '150.00', 'Nike', '5.00')
        }
        
        # Create order data
        sample_data = {
            'items': items,
            # Order totals
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
            
            # Shipping information
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
            
            # Payment information
            '{{payment_method}}': 'PayPal',
            '{{payment_card}}': '•• •••• •••2 1',
            
            # Billing information
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
            
            # Order information
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
            
            # Store information
            '{{store_name}}': 'PDF Sample store',
            '{{store_phone}}': '+1 202 555 0156',
            '{{store_email}}': 'support@email.com',
            '{{store_address}}': '14 Lawrence St. San Jose, CA 95123',
            '{{store_state}}': 'California',
            '{{store_city}}': 'Fremont',
            '{{store_street_line1}}': '14 Lawrence St. San Jose, CA 95123',
            '{{store_postcode}}': '94538',
            '{{order_note}}': 'Note for this order',
            '{{vat_number}}': '0106780134',
            
            # Customer information
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
            
            # Tax information
            '{{detailed_tax_html}}': "A Tax(6.5%): $2.95 <br/> B(3.75%): $1.70",
            '{{presentment_detailed_tax_html}}': "A Tax(6.5%): $2.95 <br/> B(3.75%): $1.70",
            '{{order_note_attribute}}': "Delivery/Pickup Date: Apr 6, 2024 <br/> Order Fulfillment Type: Local Delivery <br/> Order Ready Email Sent: true"
        }
        
        return sample_data

    def _get_pdf_options(self, template, clipboard=None, status=None):
        """
        Get PDF generation options based on template and clipboard settings
        Args:
            template: The template record
            clipboard: Clipboard data dictionary
            status: Status string ('clipboard' or None)
        Returns:
            dict: PDF options dictionary
        """
        # Set default margins
        margins = {
            'margin-top': DEFAULT_MARGIN,
            'margin-bottom': DEFAULT_MARGIN,
            'margin-right': DEFAULT_MARGIN,
            'margin-left': DEFAULT_MARGIN
        }
        
        # If clipboard data exists and we're using clipboard status, use those settings
        if status == 'clipboard' and clipboard:
            page_size = clipboard.get('page_size', DEFAULT_PAGE_SIZE)
            orientation = clipboard.get('orientation', DEFAULT_ORIENTATION)
            
            # Update margins from clipboard if available
            for margin_type in ['top_margin', 'bottom_margin', 'right_margin', 'left_margin']:
                margin_key = f"margin-{margin_type.split('_')[0]}"
                if margin_type in clipboard:
                    margins[margin_key] = f"{clipboard[margin_type]}px"
        else:
            # Use template settings
            page_size = template.page_size or DEFAULT_PAGE_SIZE
            orientation = 'Portrait' if template.orientation == 'portrait' else 'Landscape'
            
            # Set margins from template or clipboard
            if clipboard:
                for margin_type in ['top_margin', 'bottom_margin', 'right_margin', 'left_margin']:
                    margin_key = f"margin-{margin_type.split('_')[0]}"
                    if margin_type in clipboard:
                        margins[margin_key] = f"{clipboard[margin_type]}px"
        
        # Construct options dictionary
        options = {
            'page-size': page_size,
            'orientation': orientation,
            'quiet': '',
            'dpi': 96,
            'encoding': "UTF-8",
            'lowquality': ''
        }
        
        # Add margins to options
        options.update(margins)
        
        return options
        
    def _get_template_content(self, template, shop, status=None):
        """
        Extract and process HTML content from template
        Args:
            template: Template record
            shop: Shop record
            status: Status string ('clipboard' or None)
        Returns:
            tuple: (html content, clipboard data)
        """
        # Get clipboard data if available
        clipboard = {}
        if template.clipboard and template.clipboard != '':
            try:
                clipboard = json.loads(template.clipboard)
            except json.JSONDecodeError:
                _logger.warning(f"Invalid JSON in template clipboard: {template.id}")
        
        # Get HTML content
        html = template.html
        if status == 'clipboard' and clipboard:
            html = clipboard.get('html', '')
        
        # Format HTML properly
        html = shop.html_well_format(html=html)
        html = shop.remove_style(html)
        
        return html, clipboard
    
    def _get_security_headers(self, shop_url):
        """
        Generate security headers for responses
        Args:
            shop_url: Shop URL string
        Returns:
            dict: Headers dictionary
        """
        csp = f"frame-ancestors https://{shop_url} https://admin.shopify.com https://{request.httprequest.host};"
        return {'Content-Security-Policy': csp}
    
    @http.route('/pdf/invoice/<int:id>/<string:action>/<string:status>', type='http', auth="public", save_session=False)
    def report_pdf(self, id=None, action=None, status=None):
        """
        Generate and serve PDF preview based on template
        Args:
            id: Encoded template ID
            action: Action to perform
            status: Status flag for clipboard usage
        Returns:
            Response: HTML or PDF response
        """
        try:
            ensure_login()
            if id is None:
                return self._handle_missing_template()
            
            # Get shop and decode template ID
            shop = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env).shop_model
            template_id = shop.decode(id)
            
            # Find template
            template = request.env['shopify.pdf.shop.template'].sudo().search([
                ('shop_id', '=', shop.id),
                ('id', '=', template_id)
            ])
            
            if not template:
                return self._handle_missing_template()
                
            # Get template content and clipboard data
            html, clipboard = self._get_template_content(template, shop, status)
            
            # Get creation date with proper format
            date_format = clipboard.get('date_format', template.date_format) if status == 'clipboard' else template.date_format
            create_at = datetime.now().strftime(date_format)
            
            # Prepare sample data
            data = self.SAMPLE_DATA()
            data.update({'{{create_at}}': create_at})
            data.update(self.SAMPLE_DATA()['items']['1'])
            
            # Replace placeholders in HTML
            for key, value in data.items():
                if key != 'items':
                    html = html.replace(key, value)
                    
            # Clean up HTML
            html = html.replace('&nbsp;', ' ')
            html = re.sub(r'(\{\{[^\{\}]*\}\})', '', html)
            
            # Get PDF options
            options = self._get_pdf_options(template, clipboard, status)
            
            # Set environment variable for headless PDF generation
            os.environ['QT_QPA_PLATFORM'] = 'offscreen'
            
            # Generate PDF
            pdf_content = pdfkit.from_string(html, False, options=options, css=PDF_FONTS_CSS_PATH)
            
            # Set headers
            headers = [
                ('Content-Type', PDF_CONTENT_TYPE),
                ('Content-Disposition', 'inline; filename=PDF_demo.pdf'),
            ]
            headers.append(tuple(self._get_security_headers(request.session['shop_url_pdf']).items())[0])
            
            # Create response
            response = request.make_response(pdf_content, headers=headers)
            return html  # Note: For debug purposes, returning HTML instead of PDF
            
        except Exception as e:
            return self._handle_exception(e)
            
    def _handle_missing_template(self):
        """
        Handle case when template is missing or invalid
        Returns:
            Response: Empty PDF response
        """
        # Create empty PDF
        pdf_content = pdfkit.from_string("", False)
        
        # Set headers
        headers = [
            ('Content-Type', PDF_CONTENT_TYPE),
            ('Content-Disposition', 'inline; filename=PDF_demo.pdf'),
        ]
        
        if 'shop_url_pdf' in request.session:
            headers.append(tuple(self._get_security_headers(request.session['shop_url_pdf']).items())[0])
        
        # Return empty PDF
        return pdf_content
        
    def _handle_exception(self, exception):
        """
        Handle exceptions during PDF generation
        Args:
            exception: Exception object
        Returns:
            Response: Error page
        """
        # Log the error
        self.create_shop_log(log=traceback.format_exc())
        _logger.error(f"PDF generation error: {str(exception)}")
        _logger.error(traceback.format_exc())
        
        # Create headers
        headers = {}
        if 'shop_url_pdf' in request.session:
            headers = {'Content-Security-Policy': f"frame-ancestors https://{request.session['shop_url_pdf']} https://admin.shopify.com;"}
        
        # Render error page
        return request.render('shopify_order_printer.404_not_found', headers=headers)

    def _get_embed_url_for_order(self, type, order_id, shop, is_draft_order=False):
        """
        Generate embed URL for a single order preview
        Args:
            type: PDF type (invoice, refund, packing)
            order_id: Order ID
            shop: Shop URL
            is_draft_order: Whether it's a draft order
        Returns:
            str: Embed URL
        """
        base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')
        url = f"{base_url}/pdf/single/print/{type}?id={order_id}&shop={shop}"
        
        if is_draft_order:
            url += "&orderType=draftOrder"
            
        return url
        
    def _get_embed_url_for_bulk(self, type, shop, ids, is_draft_order=False):
        """
        Generate embed URL for bulk order preview
        Args:
            type: PDF type (invoice, refund, packing)
            shop: Shop URL
            ids: Order IDs string
            is_draft_order: Whether these are draft orders
        Returns:
            str: Embed URL
        """
        base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')
        url = f"{base_url}/pdf/bulk/print/{type}?shop={shop}&url={ids}"
        
        if is_draft_order:
            url += f"&orderType=bulkDraftOrder"
            
        # Remove trailing comma if present
        return url[:-1] if url.endswith(',') else url
    
    def _extract_order_ids_from_url(self, url):
        """
        Extract order IDs from URL
        Args:
            url: URL string
        Returns:
            tuple: (ids string, count)
        """
        url_decode = urllib.parse.unquote(url)
        ids = ''
        count = 0
        
        for param in url_decode.split('&'):
            if 'ids[]' in param:
                count += 1
                ids += param + ','
                
        return ids, count
    
    def _check_template_availability(self, shop_model, preview_data):
        """
        Check if templates are available and update preview data
        Args:
            shop_model: Shop model record
            preview_data: Preview data dictionary to update
        """
        for template in shop_model.templates:
            if template.type == 'refund' and template.default:
                preview_data['refund'] = 1
            if template.type == 'packing' and template.default:
                preview_data['packing'] = 1
    
    @http.route('/pdf/preview/<string:action>', type='http', auth="public", save_session=False)
    def preview_pdf(self, action=None):
        """
        Render PDF preview page for orders
        Args:
            action: Action type (order, bulk, bulkDraftOrder, draftOrder)
        Returns:
            Response: Rendered preview template
        """
        try:
            # Store shop URL in session
            if 'shop' in request.params:
                request.session['shop_url_pdf'] = request.params['shop']
            else:
                # No shop parameter provided
                return self._handle_exception(ValueError("Missing shop parameter"))
            
            # Ensure user is logged in
            ensure_login()
            
            # Get request parameters
            params = request.params
            order_id = params.get('id', '')
            shop = params.get('shop', '')
            
            # Get shop model and API key
            shop_model = ShopifyHelper(shop_url=request.session['shop_url_pdf'], env=request.env).shop_model
            app_key = request.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_api_key')
            
            # Initialize preview data
            preview_data = {
                'refund': 0,
                'packing': 0,
                'embed': {}
            }
            
            # Initialize template data
            value = {
                'page': '',
                'info': {},
                'templates': {},
                'mode': '',
                'all_templates': [],
                'template_info': {},
                'shop': '',
                'preview': preview_data,
                'api_key': app_key,
                'shop_url': shop,
                'timeout': REQUEST_TIMEOUT
            }
            
            # Define PDF types
            types = ['invoice', 'refund', 'packing']
            
            # Set security headers
            headers = self._get_security_headers(request.session['shop_url_pdf'])
            
            # Check if backend access is allowed
            if not shop_model.allow_backend:
                return request.render('shopify_order_printer.turn_off', headers=headers)
            
            # Process based on action type
            embed = None
            
            # Check template availability for order or bulk actions
            if action in ('order', 'bulk'):
                self._check_template_availability(shop_model, preview_data)
            
            # Generate embed URLs based on action type
            if action == 'order':
                # Single order preview
                for pdf_type in types:
                    embed_url = self._get_embed_url_for_order(pdf_type, order_id, shop)
                    preview_data['embed'][pdf_type] = embed_url
                    embed = embed_url  # Store last embed URL
                    
            elif action == 'draftOrder':
                # Draft order preview
                for pdf_type in types:
                    embed_url = self._get_embed_url_for_order(pdf_type, order_id, shop, True)
                    preview_data['embed'][pdf_type] = embed_url
                    embed = embed_url  # Store last embed URL
                    
            elif action in ('bulk', 'bulkDraftOrder'):
                # Bulk orders preview
                is_draft = (action == 'bulkDraftOrder')
                ids, count = self._extract_order_ids_from_url(request.httprequest.url)
                
                for pdf_type in types:
                    embed_url = self._get_embed_url_for_bulk(pdf_type, shop, ids, is_draft)
                    preview_data['embed'][pdf_type] = embed_url
                    embed = embed_url  # Store last embed URL
            
            # Return appropriate template
            if embed is not None:
                return request.render('shopify_order_printer.preview', value, headers=headers)
            else:
                return request.render('shopify_order_printer.turn_off', headers=headers)
                
        except Exception as e:
            # Handle exceptions
            shop = request.params.get('shop', None)
            self.create_shop_log(log=traceback.format_exc(), shop=shop)
            _logger.error(f"Preview error: {str(e)}")
            _logger.error(traceback.format_exc())
            
            # Set security headers
            headers = {}
            if 'shop_url_pdf' in request.session:
                headers = {
                    'Content-Security-Policy': f"frame-ancestors https://{request.session['shop_url_pdf']} https://admin.shopify.com;"
                }
                
            # Render error page
            return request.render('shopify_order_printer.404_not_found', headers=headers)

    def _get_order_for_pdf(self, order_id, is_draft_order):
        """
        Fetch order object from Shopify API
        Args:
            order_id: Shopify order ID
            is_draft_order: Whether it's a draft order
        Returns:
            Shopify Order or DraftOrder object
        """
        if not is_draft_order:
            return shopify.Order.find(limit=10, id_=order_id)
        else:
            return shopify.DraftOrder.find(limit=10, id_=order_id)
            
    def _check_order_eligibility(self, order, pdf_type):
        """
        Check if order is eligible for the requested PDF type
        Args:
            order: Shopify order object
            pdf_type: PDF type (invoice, refund, packing)
        Returns:
            bool: True if eligible, False otherwise
        """
        if pdf_type == 'invoice':
            return True
            
        if pdf_type == 'refund':
            refunds = order.attributes.get('refunds', [])
            if not refunds or len(refunds) == 0:
                return False
                
            # Check if any refund has transactions
            for refund in refunds:
                if refund.attributes.get('transactions') and len(refund.attributes.get('transactions')) > 0:
                    return True
            return False
            
        if pdf_type == 'packing':
            fulfillments = order.attributes.get('fulfillments', [])
            return fulfillments and len(fulfillments) > 0
            
        # Unknown PDF type
        return False
        
    def _prepare_pdf_response(self, pdf_content, filename, shop_url):
        """
        Create HTTP response with PDF content
        Args:
            pdf_content: PDF binary content
            filename: PDF filename
            shop_url: Shop URL for CSP header
        Returns:
            Response: HTTP response with PDF
        """
        # Sanitize filename
        sanitized_filename = re.sub('[^A-Za-z0-9]+', '', filename)
        
        # Set headers
        headers = [
            ('Content-Type', PDF_CONTENT_TYPE),
            ('Content-Disposition', f'inline; filename={sanitized_filename}.pdf'),
        ]
        
        # Add CSP header
        if 'shop_url_pdf' in request.session:
            csp = f"frame-ancestors https://{request.session['shop_url_pdf']} https://admin.shopify.com https://{request.httprequest.host};"
            headers.append(('Content-Security-Policy', csp))
        
        # Create response
        return request.make_response(pdf_content, headers=headers)
    
    @http.route('/admin/pdf/single/print/<string:type>', type='http', auth="user")
    def admin_print_single_pdf(self, type=None):
        """
        Admin route to generate and serve PDF for a single order
        Args:
            type: PDF type (invoice, refund, packing)
        Returns:
            Response: PDF response or error page
        """
        try:
            # Get parameters
            params = request.params
            
            # Check if shop parameter is present
            if 'shop' not in params:
                return self._handle_exception(ValueError("Missing shop parameter"))
                
            # Start Shopify session
            session = self.start_shopify_session(shop=params['shop'])
            
            # Check if it's a draft order
            is_draft_order = 'orderType' in params and params['orderType'] == 'draftOrder'
            
            # Get security headers
            headers = self._get_security_headers(request.session['shop_url_pdf'])
            
            # Check if backend access is allowed
            if not session['shop'].allow_backend:
                return request.render('shopify_order_printer.turn_off', headers=headers)
                
            # Get order ID
            if 'id' not in params:
                return self._handle_exception(ValueError("Missing order ID"))
                
            order_id = params['id']
            
            # Fetch order from Shopify
            order = self._get_order_for_pdf(order_id, is_draft_order)
            
            # Check order eligibility for this PDF type
            if not self._check_order_eligibility(order, type):
                return request.render('shopify_order_printer.empty_state', headers=headers)
                
            # Create orders list
            orders = [order]
            
            # Get default template for this PDF type
            templates = session['shop'].templates.filtered(
                lambda template: template.default and template.type == type
            )
            
            # Check if template exists
            if not templates:
                return request.render('shopify_order_printer.empty_state', headers=headers)
                
            # Generate file name
            order_name = order.attributes.get('name', '') if hasattr(order, 'attributes') else ''
            file_name = f"Order_{order_name}"
            
            # Process order for PDF
            orders.reverse()  # Reverse order of orders (original code did this)
            
            # Get image data
            image_data = self.get_image_data(
                orders=orders,
                shop=session['shop'],
                template=templates
            )
            
            # Generate PDF
            merged_pdf = session['shop'].get_pdf(
                templates=templates,
                orders=orders,
                image_data=image_data,
                type=type,
                isDraftOrder=is_draft_order
            )
            
            # Return PDF response
            return self._prepare_pdf_response(
                pdf_content=merged_pdf,
                filename=file_name,
                shop_url=request.session['shop_url_pdf']
            )
            
        except Exception as e:
            # Log error
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(f"Error generating PDF: {str(e)}")
            _logger.error(traceback.format_exc())
            
            # Set security headers
            headers = {}
            if 'shop_url_pdf' in request.session:
                headers = {
                    'Content-Security-Policy': f"frame-ancestors https://{request.session['shop_url_pdf']} https://admin.shopify.com;"
                }
                
            # Return error page
            return request.render('shopify_order_printer.404_not_found', {'e': str(e)}, headers=headers)

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
                #         return request.render('shopify_order_printer.empty_state_limit_pdf_view', {
                #             'type': 'limit_view_draft_order',
                #         }, headers=headers)
                order_id = params['id']
                # check limit plan
                view_count = session['shop'].get_view_count()
                if session['shop'].get_current_plan().limit_pdf_view > 0:
                    if view_count > session['shop'].get_current_plan().limit_pdf_view:
                        return request.render('shopify_order_printer.empty_state_limit_pdf_view', {
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
                        return request.render('shopify_order_printer.empty_state', headers=headers)
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
                    return request.render('shopify_order_printer.turn_off', headers=headers)
            return request.render('shopify_order_printer.turn_off', headers=headers)
        except Exception as e:
            shop = None
            if 'shop' in request.params:
                shop = request.params['shop']
            self.create_shop_log(log=traceback.format_exc(), shop=shop)
            _logger.error(traceback.format_exc())
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_order_printer.404_not_found', {'e': str(e)}, headers=headers)

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
                    return request.render('shopify_order_printer.empty_state', headers=headers)
                orders.reverse()
                image_data = self.get_image_data(orders=orders, shop=session['shop'], template=templates)
                file_name = 'Order_'
                for order in orders:
                    file_name = re.sub('[^A-Za-z0-9]+', '', order.attributes.get('name') + '_')
                mode = 'inline'
                if len(templates) == 0:
                    return request.render('shopify_order_printer.empty_state', headers=headers)
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
            return request.render('shopify_order_printer.turn_off', headers=headers)
        except Exception as e:
            self.create_shop_log(log=traceback.format_exc())
            _logger.error(traceback.format_exc())
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_order_printer.404_not_found', {'e': str(e)}, headers=headers)

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
                #         return request.render('shopify_order_printer.empty_state_limit_pdf_view', {
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
                    return request.render('shopify_order_printer.empty_state_limit_bulk', {
                        'bulk_limit': session['shop'].plan.limit_bulk_print,
                        'plan_name': session['shop'].plan.name
                    }, headers=headers)
                # check limit plan
                view_count = session['shop'].get_view_count()
                if session['shop'].get_current_plan().limit_pdf_view > 0:
                    if view_count > session['shop'].get_current_plan().limit_pdf_view:
                        return request.render('shopify_order_printer.empty_state_limit_pdf_view', {
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
                    return request.render('shopify_order_printer.empty_state', headers=headers)
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
                    return request.render('shopify_order_printer.empty_state', headers=headers)
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
            return request.render('shopify_order_printer.turn_off', headers=headers)
        except Exception as e:
            shop = None
            if 'shop' in request.params:
                shop = request.params['shop']
            self.create_shop_log(log=traceback.format_exc(), shop=shop)
            _logger.error(traceback.format_exc())
            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_order_printer.404_not_found', {'e': str(e)}, headers=headers)

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

