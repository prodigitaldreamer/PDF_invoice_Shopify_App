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


class Shopify(models.Model):
    _name = 'shopify.pdf.shop'
    _description = 'Shopify Shop'

    name = fields.Char(string='Shop URL', index=True)
    token = fields.Char('Shopify token')
    timezone = fields.Char('Timezone')
    shop_name = fields.Char()
    shop_owner = fields.Char()
    email = fields.Char()
    country = fields.Char()
    install = fields.Boolean(default=True)
    data_fetched = fields.Boolean(default=False)
    status = fields.Boolean()
    image_128 = fields.Image("Image Logo")
    # shop setting
    shop_address = fields.Char()
    shop_state = fields.Char()
    shop_city = fields.Char()
    shop_postcode = fields.Char()
    shop_company_name = fields.Char()
    shop_vat = fields.Char()
    shop_zip = fields.Char()
    shop_qr_code = fields.Char()
    shop_phone = fields.Char()
    shop_email = fields.Char()
    allow_backend = fields.Boolean(default=False)
    allow_frontend = fields.Boolean()
    default_template = fields.Char()
    templates = fields.One2many('shopify.pdf.shop.template', 'shop_id', string='Templates')
    scrip_tag_id = fields.Char()
    close_congratulation = fields.Boolean(default=False)
    # launch
    launch_url = fields.Char()
    redirect_action = fields.Char()
    shopify_session = fields.Char()
    # email notify template
    email_notify_template = fields.Char()
    download_link_text = fields.Char(default='Download your PDF Invoice here')
    invoice_start_number = fields.Char()
    invoice_last_number = fields.Char()
    # rating
    rating = fields.Integer('Rate')
    review = fields.Char('Review')
    # force update
    force_update_scope = fields.Boolean('Force update scope', default=True)
    front_button_label = fields.Char(default='Print your invoice here')
    has_change_script = fields.Boolean(default=False)
    is_reload_session = fields.Boolean(default=False)
    email_send = fields.Integer()
    total_of_month = fields.Integer()
    is_allow_frontend = fields.Boolean(default=False)
    is_open_template_setting = fields.Boolean(default=False)
    is_open_setup_info = fields.Boolean(default=False)
    #Home Setup
    check_infor = fields.Boolean(default=False)
    check_print_button = fields.Boolean(default=False)
    check_insert_button = fields.Boolean(default=False)
    check_custom_invoice_number = fields.Boolean(default=False)
    check_custom_invoice_template = fields.Boolean(default=False)

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
                    if 's_shopify_pdf_invoice' in webhook.attributes['address']:
                        uninstall_wh = True
                        break
                        
            # Add uninstall webhook if not already present
            if not uninstall_wh:
                webhook_path = f"/shopify/webhook/{self.name}/s_shopify_pdf_invoice/app_uninstalled"
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
            'invoice': "/shopify_pdf_invoice/static/description/images/bill.png",
            'order': "/shopify_pdf_invoice/static/description/images/order.png",
            'packing': "/shopify_pdf_invoice/static/description/images/box.png",
            'refund': "/shopify_pdf_invoice/static/description/images/refund.png",
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
        script_src = base_url + '/shopify_pdf_invoice/static/src/js/pdf-invoice-frontend-button.js'

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


class ShopifyPdfTemplate(models.Model):
    _name = 'shopify.pdf.shop.template'

    name = fields.Char()
    shop_id = fields.Many2one('shopify.pdf.shop', string="Shop", index=True)
    html = fields.Text()
    json = fields.Text()
    type = fields.Selection([('order', 'Orders'), ('invoice', 'Invoice'), ('packing', 'Packing'), ('refund', 'Refund')],
                            string='Type')
    # setting
    page_size = fields.Selection([('a4', 'A4'), ('a5', 'A5'), ('a6', 'A6'),
                                  ('Letter', 'Letter'), ('Legal', 'Legal'), ('Tabloid', 'Tabloid')], string='Size')
    orientation = fields.Selection([('portrait', 'Portrait'), ('landscape', 'Landscape')], string='Orientation')
    font_size = fields.Float(default=16.0)
    font_family = fields.Char()
    top_margin = fields.Float()
    bottom_margin = fields.Float()
    left_margin = fields.Float()
    right_margin = fields.Float()
    default = fields.Boolean(default=False)
    available = fields.Boolean(default=False)
    clipboard = fields.Char("Clip Board")
    virtual_rec = fields.Boolean(default=False, index=True)
    date_format = fields.Selection([
        ('%d/%m/%Y', '%d/%m/%y'),
        ('%m/%d/%Y', '%m/%d/%y'),
        ('%Y/%m/%d', '%y/%m/%d'),
        ('%d-%m-%Y', '%d-%m-%y'),
        ('%m-%d-%Y', '%m-%d-%y'),
        ('%Y-%m-%d', '%y-%m-%d'),
        ('%d.%m.%Y', '%d.%m.%y'),
        ('%m.%d.%Y', '%m.%d.%y'),
        ('%Y.%m.%d', '%y.%m.%d'),
        ('%d %b %Y', '%d %b %Y'),
        ('%b %d %Y', '%b %d %Y'),
        ('%Y %b %d', '%Y %b %d')
    ], string='Date Format', default='%b %d %Y')

    # @api.constrains('page_size')
    # def check_page_size_plan(self):
    #     if self.page_size != 'a4' and not self.shop_id.get_current_plan().more_paper_size:
    #         self.page_size = 'a4'

    def get_merged_css(self):
        self.ensure_one()
        merged_css = self.css
        if self.font_size:
            merged_css += self.get_global_font_size_css()
            merged_css += self.get_global_font_family_css()
        return merged_css

    def get_global_font_size_css(self, font_size=None):
        return '*{font-size: %spx;}' % (self.font_size if not font_size else font_size)

    def get_global_font_family_css(self, font_family=None):
        return '*{font-family: %s;}' % (self.font_family if not font_family else font_family)
    def copy(self, default=None):
        default = dict(default or {})
        default["default"] = False
        return super(ShopifyPdfTemplate, self).copy(default)

class ShopifyPdfRequestForm(models.Model):
    _name = 'shopify.pdf.shop.request'

    name = fields.Char("Shop URL")
    shop_id = fields.Many2one('shopify.pdf.shop')
    email = fields.Char()
    template_type = fields.Char()
    description = fields.Char()
    status = fields.Char(default='pending')

    def schedule_sent_email_for_mkt(self):
        emails = self.search([('status', '=', 'pending')])
        for email in emails:
            email.force_sent()
        return True

    def force_sent(self):
        try:
            mkt_email = self.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_mkt_email')
            subject = "Hapoapps - PDF Invoice Request Customization - %s" % (self.name)
            content = "Shop: %s<br/>Email:%s<br/>Request customize type: %s<br/>%s" % (
                self.name, self.email, self.template_type, self.description)
            # sending email
            mail_client = self.env['shopify.pdf.mail']
            mail_client.send(to_email=mkt_email, subject=subject, content=content, reply_to=mkt_email)
            self.status = 'done'
        except Exception as e:
            _logger.error(traceback.format_exc())
