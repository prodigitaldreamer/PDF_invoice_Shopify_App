# -*- coding: utf-8 -*-
import base64
import json
import traceback
from datetime import datetime
import shopify
from odoo import models, fields, api
from odoo.modules import get_module_resource
from ..oauth2.auth import ShopifyHelper
import logging 

_logger = logging.getLogger(__name__)


class ShopifyShop(models.Model):
    """
    Represents a Shopify store integrated with the PDF Invoice application.
    
    This model stores all shop-related information, including authentication details,
    shop settings, template preferences, and usage statistics. It also provides
    methods to interact with the Shopify API, manage webhooks, and handle 
    PDF template initialization.
    """
    _name = 'shopify.pdf.shop'
    _description = 'Shopify Shop Integration'

    # Shop identification and authentication
    name = fields.Char(string='Shop URL', index=True, required=True,
                      help="Shopify store URL (e.g., mystore.myshopify.com)")
    token = fields.Char(string='Shopify API Token',
                       help="OAuth token for accessing Shopify API")
    shopify_session = fields.Char(string='Session Data',
                                 help="Serialized session information for Shopify API")
    
    # Basic shop information
    shop_name = fields.Char(string='Shop Name',
                           help="Display name of the Shopify shop")
    shop_owner = fields.Char(string='Shop Owner',
                            help="Name of the shop owner")
    email = fields.Char(string='Primary Email',
                       help="Primary email address for the shop")
    timezone = fields.Char(string='Timezone',
                          help="Shop's timezone setting from Shopify")
    country = fields.Char(string='Country',
                         help="Country where the shop is registered")
    image_128 = fields.Image(string="Shop Logo",
                            help="Shop logo image")
    
    # Shop status flags
    install = fields.Boolean(string='Is Installed', default=True,
                            help="Whether the app is installed on this shop")
    data_fetched = fields.Boolean(string='Data Fetched', default=False,
                                 help="Whether shop data has been fetched from Shopify")
    status = fields.Boolean(string='Active Status',
                           help="Whether the shop is active")
    
    # Shop contact information
    shop_address = fields.Char(string='Address',
                              help="Street address of the shop")
    shop_state = fields.Char(string='State/Province',
                            help="State or province of the shop")
    shop_city = fields.Char(string='City',
                           help="City of the shop")
    shop_postcode = fields.Char(string='Postal Code',
                               help="Postal code of the shop")
    shop_zip = fields.Char(string='ZIP Code',
                          help="ZIP code for US addresses")
    shop_company_name = fields.Char(string='Company Name',
                                   help="Legal company name of the shop")
    shop_vat = fields.Char(string='VAT Number',
                          help="VAT or tax identification number")
    shop_qr_code = fields.Char(string='QR Code Data',
                              help="Data for generating QR code on invoices")
    shop_phone = fields.Char(string='Phone Number',
                            help="Contact phone number for the shop")
    shop_email = fields.Char(string='Contact Email',
                            help="Contact email for the shop (may differ from primary)")
    
    # Template settings
    default_template = fields.Char(string='Default Template ID',
                                  help="Encoded ID of the default template")
    email_notify_template = fields.Char(string='Email Notification Template ID',
                                       help="Encoded ID of the template used for email notifications")
    templates = fields.One2many('shopify.pdf.shop.template', 'shop_id', string='Templates',
                               help="PDF templates associated with this shop")
    
    # Feature access controls
    allow_backend = fields.Boolean(string='Allow Backend Access', default=False,
                                  help="Whether to allow access to admin backend features")
    allow_frontend = fields.Boolean(string='Allow Frontend Access',
                                   help="Whether to allow frontend customer-facing features")
    is_allow_frontend = fields.Boolean(string='Frontend Status Flag', default=False,
                                      help="UI flag for frontend access status")
    
    # UI state tracking
    is_open_template_setting = fields.Boolean(string='Template Settings Open', default=False,
                                             help="UI state for template settings panel")
    is_open_setup_info = fields.Boolean(string='Setup Info Open', default=False,
                                       help="UI state for setup information panel")
    close_congratulation = fields.Boolean(string='Hide Congratulation', default=False,
                                         help="Whether to hide the congratulation message")
    
    # Shopify script integration
    scrip_tag_id = fields.Char(string='Script Tag ID',
                              help="ID of the script tag installed on the Shopify store")
    has_change_script = fields.Boolean(string='Script Updated', default=False,
                                      help="Whether the script tag has been updated")
    
    # URL and redirect settings
    launch_url = fields.Char(string='Launch URL',
                            help="URL to launch the app from Shopify admin")
    redirect_action = fields.Char(string='Redirect Action',
                                 help="Action to redirect to after authentication")
    
    # Invoice and email settings
    download_link_text = fields.Char(string='Download Link Text', 
                                    default='Download your PDF Invoice here',
                                    help="Text to display for PDF download links in emails")
    invoice_start_number = fields.Char(string='Starting Invoice Number',
                                      help="First number to use in invoice sequence")
    invoice_last_number = fields.Char(string='Last Invoice Number',
                                     help="Last used invoice number")
    front_button_label = fields.Char(string='Frontend Button Label', 
                                    default='Print your invoice here',
                                    help="Text to display on invoice print buttons")
    
    # Usage statistics
    email_send = fields.Integer(string='Emails Sent',
                               help="Count of emails sent in the current period")
    total_of_month = fields.Integer(string='Monthly Total',
                                   help="Total usage count for the current month")
    
    # User rating and feedback
    rating = fields.Integer(string='User Rating',
                           help="Rating provided by the shop owner (1-5)")
    review = fields.Char(string='User Review',
                        help="Review text provided by the shop owner")
    
    # System settings
    force_update_scope = fields.Boolean(string='Force Update Scope', default=True,
                                       help="Whether to force update of API scopes on next auth")
    is_reload_session = fields.Boolean(string='Reload Session', default=False,
                                      help="Whether to reload the Shopify session on next request")
    
    # Setup completion tracking
    check_infor = fields.Boolean(string='Info Setup Complete', default=False,
                                help="Whether shop information setup is complete")
    check_print_button = fields.Boolean(string='Print Button Setup Complete', default=False,
                                       help="Whether print button setup is complete")
    check_insert_button = fields.Boolean(string='Insert Button Setup Complete', default=False,
                                        help="Whether insert button setup is complete")
    check_custom_invoice_number = fields.Boolean(string='Custom Invoice Number Setup Complete', default=False,
                                               help="Whether custom invoice number setup is complete")
    check_custom_invoice_template = fields.Boolean(string='Custom Template Setup Complete', default=False,
                                                 help="Whether custom template setup is complete")

    def get_data(self):
        """
        Fetch shop data from Shopify and configure webhooks
        Returns: True if data fetched successfully, False otherwise
        """
        uninstall_wh = False
        try:
            if not self.token:
                self.install = False
                uninstall_wh = True
                return False
                
            # Start Shopify session and get shop data
            self.start_shopify_session()
            shop = shopify.Shop.current()
            
            # Update shop information if not already set
            if not self.email:
                self.email = shop.attributes.get('email')
            if not self.country:
                self.country = shop.attributes.get('country_name')
                
            # Check for existing webhooks
            existing_webhooks = shopify.Webhook.find()
            if existing_webhooks:
                for webhook in existing_webhooks:
                    if 's_shopify_order_printer' in webhook.attributes['address']:
                        uninstall_wh = True
                        break
                        
            # Add uninstall webhook if not already present
            if not uninstall_wh:
                webhook_path = f"/shopify/webhook/{self.name}/s_shopify_order_printer/app_uninstalled"
                self.add_webhook_to_shop(topic='app/uninstalled', path=webhook_path)
                
            # Mark data as fetched if all required data is present
            if self.email and self.country and self.shop_owner and uninstall_wh:
                self.data_fetched = True
                
            return True
        except shopify.ShopifyException as e:
            _logger.error(f"Shopify API error: {str(e)}")
            self.data_fetched = False
            return False
        except Exception as e:
            _logger.error(f"Error fetching shop data: {str(e)}")
            self.data_fetched = False
            return False
        finally:
            shopify.ShopifyResource.clear_session()

    def schedule_update_shop_data(self):
        """
        Placeholder for scheduled shop data updates
        This method is currently disabled but kept for potential future use
        """
        return True

    def delete_webhook_from_shop(self, webhook_id):
        """
        Delete a specific webhook from the shop
        Args:
            webhook_id: The ID of the webhook to delete
        Returns:
            bool: True if deletion was successful, False otherwise
        """
        try:
            self.start_shopify_session()
            hook = shopify.Webhook()
            hook.id = webhook_id
            result = hook.destroy()
            return True
        except shopify.ShopifyException as e:
            _logger.error(f"Shopify API error deleting webhook: {str(e)}")
            return False
        except Exception as e:
            _logger.error(f"Error deleting webhook: {str(e)}")
            return False

    def add_webhook_to_shop(self, topic, path):
        """
        Add a webhook to the shop
        Args:
            topic: The webhook topic/event to subscribe to
            path: The path to receive webhook notifications
        Returns:
            hook: The created webhook object if successful, None otherwise
        """
        try:
            self.start_shopify_session()
            
            # Ensure the path has proper URL format
            if 'http' not in path:
                base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
                address = base_url + path
            else:
                address = path
                
            # Create and save the webhook
            hook = shopify.Webhook()
            hook.topic = topic
            hook.address = address
            hook.format = 'json'
            if hook.save():
                return hook
            else:
                _logger.error(f"Failed to save webhook for topic {topic}")
                return None
                
        except shopify.ShopifyException as e:
            _logger.error(f"Shopify API error adding webhook: {str(e)}")
            return None
        except Exception as e:
            _logger.error(f"Error adding webhook: {str(e)}")
            return None

    def init_default_template(self):
        """
        Initialize default templates for the shop if none are available
        Returns:
            bool: True if initialization is successful
        """
        # Check if shop already has any available templates
        has_available_template = any(template.available for template in self.templates)
        
        if not has_available_template:
            # Get default templates from the system
            template_defaults = self.env['shopify.pdf.template.default'].sudo().search([])
            
            # Create templates for this shop based on defaults
            for template in template_defaults:
                self.env['shopify.pdf.shop.template'].sudo().create({
                    'shop_id': self.id,
                    'name': template.name,
                    'html': template.html,
                    'json': template.json,
                    'type': template.type,
                    'page_size': 'a4',
                    'orientation': 'portrait',
                    'font_size': 16,
                    'top_margin': 40,
                    'bottom_margin': 16,
                    'left_margin': 16,
                    'right_margin': 16,
                    'default': template.default,
                    'available': True,
                })
                
        return True

    def get_shop_template(self):
        templates = []
        for t in self.templates:
            if not t.virtual_rec:
                templates.append({
                    'label': t.name,
                    'value': int(self.encode(key=t.id)),
                    'type': {
                        'key': t.type,
                        'value': dict(t._fields['type'].selection).get(t.type)
                    },
                    'status': t.default
                })
        return templates

    def get_resource_url(self, type):
        """Get the URL for resource icons based on template type"""
        switcher = {
            'invoice': "/shopify_order_printer/static/description/images/bill.png",
            'order': "/shopify_order_printer/static/description/images/order.png",
            'packing': "/shopify_order_printer/static/description/images/box.png",
            'refund': "/shopify_order_printer/static/description/images/refund.png",
        }
        return switcher.get(type, "/")
        
    def get_all_shop_template(self):
        """Get all available templates for the shop with metadata"""
        templates = []
        for tem in self.templates:
            if not tem.virtual_rec:
                templates.append({
                    'id': self.encode(key=tem.id),
                    'url': '/pdf/templates/' + str(self.encode(tem.id)) + '/edit',
                    'avatarSource': self.get_resource_url(tem.type),
                    'type': tem.type,
                    'title': tem.name,
                    'shortcut': 1,
                    'default_set': True if tem.default else False,
                    'available_set': True if tem.available else False
                })
        return templates
    
    def encode(self, key):
        """Encode a key by multiplying it with the shop id"""
        key_int = int(key)
        return key_int * self.id

    def decode(self, key):
        """Decode an encoded key by dividing it with the shop id"""
        key_int = int(key)
        return key_int // self.id

    def get_shop_settings_info(self):
        """
        Get shop settings information formatted for the frontend
        Returns:
            dict: Dictionary of shop settings for frontend display
        """
        # Get template IDs for validation
        template_ids = [t.id for t in self.templates]
        
        # Validate templates
        default_template = ''
        email_notify_template = ''
        
        if self.default_template and self.default_template != '':
            if self.decode(int(self.default_template)) in template_ids:
                default_template = self.default_template
                
        if self.email_notify_template and self.email_notify_template != '':
            if self.decode(int(self.email_notify_template)) in template_ids:
                email_notify_template = self.email_notify_template
        
        # Helper function to get value or default
        def get_value(value, default=''):
            return value if value else default
            
        # Build settings info dictionary
        info = {
            # Shop contact information
            'address': get_value(self.shop_address),
            'state': get_value(self.shop_state),
            'city': get_value(self.shop_city),
            'postcode': get_value(self.shop_postcode),
            'name': get_value(self.shop_company_name),
            'vat': get_value(self.shop_vat),
            'phone': get_value(self.shop_phone),
            'zip': get_value(self.shop_zip),
            'qrcode': get_value(self.shop_qr_code),
            'email': get_value(self.shop_email),
            
            # Feature flags
            'allow_backend': bool(self.allow_backend),
            'allow_frontend': bool(self.allow_frontend),
            'setup_status': {
                'is_open_setup_info': bool(self.is_open_setup_info),
                'is_allow_frontend': bool(self.is_allow_frontend),
                'is_open_template_setting': bool(self.is_open_template_setting),
            },

            # Shop identity
            'default_template': default_template,
            'shop': get_value(self.name, 'Hapoapps'),
            'shop_name': get_value(self.shop_name, 'Hapoapps'),
            'shop_owner': get_value(self.shop_owner, 'Hapoapps'),
            
            # Templating info
            'email_notify_template': email_notify_template,
            'download_link_text': self.download_link_text,
            'invoice_start_number': get_value(self.invoice_start_number),
            'rate': 5 if self.rating == 5 else 0,
            'front_button_label': get_value(self.front_button_label),
            'close_congratulation': bool(self.close_congratulation)
        }
        
        return info

    def schedule_change_script(self):
        """
        Schedule script updates for shops that need it
        Find shops that have frontend enabled but haven't had their scripts updated
        """
        shops = self.sudo().search([
            ('allow_frontend', '=', True),
            ('token', '!=', False),
            ('has_change_script', '=', False)
        ])
        
        for shop in shops:
            shop.force_change_script()
        
        return True

    def force_change_script_shop(self, model):
        """
        Force script update for all shops in the provided model
        Args:
            model: Collection of shop records to update
        Returns:
            bool: True if successful
        """
        if not model:
            return False
            
        for shop in model:
            shop.force_change_script()
            
        return True

    def force_change_script(self):
        """
        Update the Shopify script tags for this shop
        Removes existing PDF script tags and adds the current one
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.allow_frontend:
            return False
            
        try:
            # Start Shopify session
            self.start_shopify_session()
            
            # Remove existing PDF script tags
            existed_script_tags = shopify.ScriptTag.find()
            for script in existed_script_tags:
                src = script.attributes.get('src', '')
                if 'pdf' in src:
                    shopify.ScriptTag.find(script.id).destroy()

            # Add new script tag
            script_src = self.env['ir.config_parameter'].sudo().get_param(
                'shopify_pdf.shopify_script_front')
                
            if not script_src:
                _logger.error(f"Missing configuration: shopify_pdf.shopify_script_front")
                return False
                
            script_tag = shopify.ScriptTag.create({
                "event": "onload",
                "display_scope": "all",
                "src": script_src
            })
            
            # Update shop record
            self.scrip_tag_id = script_tag.id
            self.has_change_script = True
            
            return True
            
        except shopify.ShopifyException as e:
            _logger.error(f"Shopify API error updating script: {str(e)}")
            return False
        except Exception as e:
            _logger.error(f"Error updating script: {str(e)}")
            return False

    def script_tag_action(self, action=None):
        session = self.start_shopify_session()
        base_url = self.env['ir.config_parameter'].sudo().get_param(
            'web.base.url')
        # script_src = self.env['ir.config_parameter'].sudo().get_param(
        #     'shopify_pdf.shopify_script_front')
        script_src = base_url + '/shopify_order_printer/static/src/js/pdf-invoice-frontend-button.js'

        existedScriptTags = shopify.ScriptTag.find(src=script_src)

        if action == 'add':
            try:
                themes = shopify.Theme.find(limit=200)
                for them in themes:
                    if them.attributes.get('role') == 'main':
                        filters = {
                            'theme_id': them.attributes.get('id'),
                            'key': 'templates/customers/order.liquid'
                        }
                        asset = shopify.Asset.find(**filters)
                        if asset and 'order.id | times: 77' not in asset.attributes.get('value'):
                            html = asset.attributes.get('value')
                            script = '<script>\n' + 'window.object = "{{ order.id | times: 77}}"\n' + '</script>'
                            asset.attributes.update({
                                'value': html + script
                            })
                            # asset.attributes.value = html + script
                            asset.save()
                        break
            except Exception as e:
                _logger.error(traceback.format_exc())
            if existedScriptTags:
                if not self.scrip_tag_id:
                    self.scrip_tag_id = existedScriptTags[0].id
                if not self.has_change_script:
                    self.has_change_script = True
            else:
                scriptTag = shopify.ScriptTag.create({
                    "event": "onload",
                    "display_scope": "all",
                    "src": script_src
                })
                self.scrip_tag_id = scriptTag.id
                self.has_change_script = True
        if action == 'remove':
            if existedScriptTags:
                shopify.ScriptTag.delete(existedScriptTags[0].id)
            self.scrip_tag_id = False
            self.default_template = False

        return True

    def start_shopify_session(self):
        if not self.shopify_session:
            token = self.token
            self.shopify_session = ShopifyHelper(shop_url=self.name, token=token, env=self.env).auth()
        return self.shopify_session

    def get_related_apps(self):
        """
        Get list of related apps to display in the dashboard
        Returns:
            dict: Dictionary with two lists - regular apps and partner apps
        """
        hapo_apps = []
        partner_apps = []
        
        try:
            # Get all related apps except the current one (pdf)
            apps = self.env['shopify.related.apps'].sudo().search([('key', '!=', 'pdf')])
            
            # Process each app and categorize by type
            for app in apps:
                app_data = {
                    'title': app.name,
                    'url': app.url,
                    'media_url': app.media_url,
                    'caption': app.caption,
                    'rate': app.rate,
                    'rate_count': app.rate_count,
                    'plan': app.plan,
                    'owner': app.owner,
                }
                
                # Add to appropriate list based on partner status
                if not app.is_partner:
                    app_data['quick_install_link'] = app.quick_install_link
                    hapo_apps.append(app_data)
                else:
                    partner_apps.append(app_data)
                    
        except Exception as e:
            _logger.error(f"Error retrieving related apps: {str(e)}")
            
        return {
            'apps': hapo_apps,
            'partner_apps': partner_apps
        }

    def force_update_id_template_setting(self):
        """
        Mass update template IDs to ensure correct encoding format
        This fixes legacy template ID storage issues
        Returns:
            bool: True if successful
        """
        for rec in self:
            # Process default template
            if rec.default_template:
                try:
                    # Try both decoding methods
                    template_ids = []
                    
                    # First method: subtract 2020 and divide by shop ID
                    try:
                        template_id1 = int((int(rec.default_template) - 2020) / rec.id)
                        template_ids.append(template_id1)
                    except Exception:
                        pass
                        
                    # Second method: subtract 2021 and divide by shop ID
                    try:
                        template_id2 = int((int(rec.default_template) - 2021) / rec.id)
                        template_ids.append(template_id2)
                    except Exception:
                        pass
                    
                    # Find matching template
                    for template_id in template_ids:
                        for t in rec.templates:
                            if t.id == template_id:
                                rec.sudo().write({
                                    'default_template': str(rec.encode(t.id))
                                })
                                break
                except Exception as e:
                    _logger.error(f"Error updating default template ID: {str(e)}")
            
            # Process email notification template
            if rec.email_notify_template:
                try:
                    # Try both decoding methods
                    template_ids = []
                    
                    # First method: subtract 2020 and divide by shop ID
                    try:
                        template_id1 = int((int(rec.email_notify_template) - 2020) / rec.id)
                        template_ids.append(template_id1)
                    except Exception:
                        pass
                        
                    # Second method: subtract 2021 and divide by shop ID
                    try:
                        template_id2 = int((int(rec.email_notify_template) - 2021) / rec.id)
                        template_ids.append(template_id2)
                    except Exception:
                        pass
                    
                    # Find matching template
                    for template_id in template_ids:
                        for t in rec.templates:
                            if t.id == template_id:
                                rec.sudo().write({
                                    'email_notify_template': str(rec.encode(t.id))
                                })
                                break
                except Exception as e:
                    _logger.error(f"Error updating email template ID: {str(e)}")

        return True

    def get_limit_request_status(self):
        """
        Check if the shop has reached the daily request limit
        Returns:
            bool: True if the limit has been reached, False otherwise
        """
        # Define request limit constant
        DAILY_REQUEST_LIMIT = 2
        
        try:
            # Get today's date range (start of day to end of day)
            today = datetime.now().strftime('%Y-%m-%d')
            start_of_day = f"{today} 00:00:00"
            end_of_day = f"{today} 23:59:59"
            
            # Count today's requests for this shop
            request_count = self.env['shopify.pdf.shop.request'].sudo().search_count([
                ('create_date', '>=', start_of_day),
                ('create_date', '<=', end_of_day),
                ('shop_id', '=', self.id)
            ])
            
            # Check if limit reached
            return request_count >= DAILY_REQUEST_LIMIT
            
        except Exception as e:
            _logger.error(f"Error checking request limit: {str(e)}")
            # Return False on error to prevent blocking users unnecessarily
            return False

    def get_view_count(self):
        """
        Get total view count for the shop since the beginning of the month
        or since the shop was created (if more recent)
        Returns:
            int: Total view count
        """
        try:
            # Determine start date (first of month or shop creation date, whichever is later)
            first_of_month = datetime.today().replace(day=1)
            start_date = max(first_of_month, self.create_date)
            
            # Get view records
            records = self.env['shopify.pdf.view.log'].sudo().search([
                ('shop_id', '=', self.id),
                ('create_date', '>=', start_date)
            ])
            
            # Use mapping and sum for more efficient calculation
            return sum(record.view_count for record in records)
            
        except Exception as e:
            _logger.error(f"Error getting view count: {str(e)}")
            return 0


class ShopPdfTemplate(models.Model):
    """
    Represents a PDF template assigned to a specific Shopify shop.
    
    Each shop can have multiple templates for different purposes (invoices,
    packing slips, etc.) with customized formatting settings. Templates contain
    HTML content that can be rendered with order data to generate PDFs.
    """
    _name = 'shopify.pdf.shop.template'
    _description = 'Shop-specific PDF Template'

    name = fields.Char(string="Template Name", required=True, help="Descriptive name for this template")
    shop_id = fields.Many2one('shopify.pdf.shop', string="Shop", index=True, required=True, 
                             help="The shop this template belongs to")
    html = fields.Text(string="HTML Content", help="HTML structure of the template")
    json = fields.Text(string="JSON Configuration", help="Template configuration in JSON format")
    type = fields.Selection([
        ('order', 'Orders'), 
        ('invoice', 'Invoice'), 
        ('packing', 'Packing'), 
        ('refund', 'Refund')
    ], string='Document Type', required=True, help="The type of document this template generates")
    
    # Layout settings
    page_size = fields.Selection([
        ('a4', 'A4'), 
        ('a5', 'A5'), 
        ('a6', 'A6'),
        ('Letter', 'Letter'), 
        ('Legal', 'Legal'), 
        ('Tabloid', 'Tabloid')
    ], string='Page Size', default='a4', help="Physical dimensions of the PDF page")
    
    orientation = fields.Selection([
        ('portrait', 'Portrait'), 
        ('landscape', 'Landscape')
    ], string='Page Orientation', default='portrait', help="Orientation of the PDF page")
    
    font_size = fields.Float(string="Base Font Size", default=16.0, 
                            help="Default font size in pixels for the PDF")
    font_family = fields.Char(string="Font Family", help="Font family to use in the PDF")
    
    # Margin settings
    top_margin = fields.Float(string="Top Margin", help="Top margin in pixels")
    bottom_margin = fields.Float(string="Bottom Margin", help="Bottom margin in pixels")
    left_margin = fields.Float(string="Left Margin", help="Left margin in pixels")
    right_margin = fields.Float(string="Right Margin", help="Right margin in pixels")
    
    # Status flags
    default = fields.Boolean(string="Is Default", default=False, 
                            help="Whether this template is the default for its type")
    available = fields.Boolean(string="Is Available", default=False,
                              help="Whether this template is available for use")
    virtual_rec = fields.Boolean(string="Is Virtual", default=False, index=True,
                                help="Whether this is a virtual template (not stored permanently)")
    
    # Additional settings
    clipboard = fields.Char(string="Clipboard Data", help="Temporary storage for template editing")
    date_format = fields.Selection([
        ('%d/%m/%Y', 'DD/MM/YYYY (31/12/2023)'),
        ('%m/%d/%Y', 'MM/DD/YYYY (12/31/2023)'),
        ('%Y/%m/%d', 'YYYY/MM/DD (2023/12/31)'),
        ('%d-%m-%Y', 'DD-MM-YYYY (31-12-2023)'),
        ('%m-%d-%Y', 'MM-DD-YYYY (12-31-2023)'),
        ('%Y-%m-%d', 'YYYY-MM-DD (2023-12-31)'),
        ('%d.%m.%Y', 'DD.MM.YYYY (31.12.2023)'),
        ('%m.%d.%Y', 'MM.DD.YYYY (12.31.2023)'),
        ('%Y.%m.%d', 'YYYY.MM.DD (2023.12.31)'),
        ('%d %b %Y', 'DD MMM YYYY (31 Dec 2023)'),
        ('%b %d %Y', 'MMM DD YYYY (Dec 31 2023)'),
        ('%Y %b %d', 'YYYY MMM DD (2023 Dec 31)')
    ], string='Date Format', default='%b %d %Y', 
       help="Format for displaying dates in the generated PDF")

    def get_merged_css(self):
        """
        Get combined CSS including font settings.
        
        Returns:
            str: Merged CSS string with global font settings
        """
        self.ensure_one()
        # This line might be an error in the original code, as 'css' field doesn't exist
        # Keeping it for backward compatibility but adding a try/except
        try:
            merged_css = self.css
        except:
            merged_css = ""
            
        if self.font_size:
            merged_css += self.get_global_font_size_css()
            merged_css += self.get_global_font_family_css()
        return merged_css

    def get_global_font_size_css(self, font_size=None):
        """
        Generate CSS for global font size.
        
        Args:
            font_size (float, optional): Override font size. If not provided, uses template's setting.
            
        Returns:
            str: CSS rule for global font size
        """
        return '*{font-size: %spx;}' % (self.font_size if not font_size else font_size)

    def get_global_font_family_css(self, font_family=None):
        """
        Generate CSS for global font family.
        
        Args:
            font_family (str, optional): Override font family. If not provided, uses template's setting.
            
        Returns:
            str: CSS rule for global font family
        """
        return '*{font-family: %s;}' % (self.font_family if not font_family else font_family)
        
    def copy(self, default=None):
        """
        Override copy method to ensure default flag is reset on duplicated templates.
        
        Args:
            default (dict, optional): Default values for the new record
            
        Returns:
            ShopPdfTemplate: The copied template record
        """
        default = dict(default or {})
        default["default"] = False
        return super(ShopPdfTemplate, self).copy(default)

class ShopCustomizationRequest(models.Model):
    """
    Stores customization requests from shop owners for PDF templates.
    
    This model tracks requests for template customizations, including the
    shop details, requested customization type, and description. Requests
    are processed by the marketing team via email notifications.
    """
    _name = 'shopify.pdf.shop.request'
    _description = 'PDF Template Customization Request'

    name = fields.Char(string="Shop URL", required=True, 
                      help="URL of the Shopify shop making the request")
    shop_id = fields.Many2one('shopify.pdf.shop', string="Shop Reference", 
                             help="Reference to the shop record in the system")
    email = fields.Char(string="Contact Email", 
                       help="Email address for communication about this request")
    template_type = fields.Char(string="Template Type", 
                               help="Type of template customization being requested")
    description = fields.Char(string="Request Description", 
                             help="Detailed description of the customization request")
    status = fields.Char(string="Request Status", default='pending',
                        help="Current status of the request (pending or done)")

    def schedule_sent_email_for_mkt(self):
        """
        Schedule emails for all pending customization requests.
        
        This method finds all pending requests and triggers email sending
        for each one. It's typically called by a scheduled action/cron job.
        
        Returns:
            bool: True if processing completed
        """
        pending_requests = self.search([('status', '=', 'pending')])
        for request in pending_requests:
            request.send_notification_email()
        return True

    def send_notification_email(self):
        """
        Send customization request notification to the marketing team.
        
        Formats the request details and sends them via email to the
        configured marketing email address.
        
        Returns:
            bool: True if email sent successfully, False on error
        """
        try:
            # Get marketing email from system parameters
            mkt_email = self.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_mkt_email')
            
            # Format email subject and content
            subject = f"Hapoapps - PDF Invoice Request Customization - {self.name}"
            content = f"""
                Shop: {self.name}<br/>
                Email: {self.email}<br/>
                Request customize type: {self.template_type}<br/>
                {self.description}
            """
            
            # Send email via mail client
            mail_client = self.env['shopify.pdf.mail']
            mail_client.send(
                to_email=mkt_email, 
                subject=subject, 
                content=content, 
                reply_to=mkt_email
            )
            
            # Update request status
            self.status = 'done'
            return True
            
        except Exception as e:
            _logger.error(f"Failed to send customization request email: {str(e)}")
            _logger.error(traceback.format_exc())
            return False
            
        except Exception as e:
            _logger.error(f"Failed to send customization request email: {str(e)}")
            _logger.error(traceback.format_exc())
            return False
