import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# import sendgrid
from python_http_client import HTTPError
# from sendgrid.helpers.mail import *
import logging, traceback
from odoo import models, fields, api
import base64
from email.mime.application import MIMEApplication

_logger = logging.getLogger(__name__)

EMAIL_TYPE = [('invoice', 'Invoice'), ('refund', 'Refund'), ('packing', 'Packing slip')]


class EmailAutomation(models.Model):
    _name = 'shopify.pdf.email.automation'

    type = fields.Selection(EMAIL_TYPE)
    shop_id = fields.Many2one('shopify.pdf.shop', string="Shop", index=True)

    enable_email_automation = fields.Boolean(default=False, index=True)
    send_email_when = fields.Char()
    email_reply_to = fields.Char()
    bcc_to = fields.Char()
    email_tags = fields.Char()
    email_file_name = fields.Char(default='{{order_name}}')
    email_subject = fields.Char(default='New Invoice from your purchase')
    custom_email_message = fields.Char(default='Thank you for purchasing! This is your invoice.')
    webhook_id = fields.Char(index=True)
    test_email = fields.Char()

    # to use test URL, change the path to full URL
    # E.g: 'invoice': {
    #             'name': 'orders/create',
    #             'path': 'https://ef62c3e9e669.ngrok.io/pdf/email/send/%(shop)s/invoice'
    #         },
    topic = {
        'invoice': {
            'name': 'orders/create',
            'path': '/pdf/email/send/%(shop)s/invoice'
        },
        'refund': {
            'name': 'refunds/create',
            'path': '/pdf/email/send/%(shop)s/refund'
        },
        'packing': {
            'name': 'orders/fulfilled',
            'path': '/pdf/email/send/%(shop)s/packing'
        }
    }

    @api.constrains('enable_email_automation')
    def register_webhook_constrain(self):
        if self.enable_email_automation and not self.webhook_id:
            topic = self.topic.get(self.type)
            if not topic:
                raise ValueError('Could not find a topic for ' + self.type + ' email type')
            webhook = self.register_webhook(topic)
            self.webhook_id = webhook.id

        if not self.enable_email_automation and self.webhook_id:
            self.deregister_webhook()
            self.webhook_id = None

    @api.constrains('email_tags')
    def check_email_tags_plan(self):
        if self.email_tags and not self.shop_id.get_current_plan().automation_email_with_tags:
            self.email_tags=False

    def register_webhook(self, topic):
        return self.shop_id.add_webhook_to_shop(topic['name'], topic['path'] % ({'shop': self.shop_id.name}))

    def deregister_webhook(self):
        self.shop_id.delete_webhook_from_shop(self.webhook_id)

    def get_email_tags_list(self):
        self.ensure_one()
        tags = []
        if self.email_tags:
            for tag in self.email_tags.split(','):
                if tag:
                    tags.append(tag)
        return tags


class EmailLog(models.Model):
    _name = 'shopify.pdf.email.log'

    STATUS_ADDED = 0
    STATUS_SUCCESS = 1
    STATUS_ERROR = 2
    STATUS_PROCESSED = 3

    shop_id = fields.Many2one('shopify.pdf.shop', string="Shop", index=True)
    shopify_object_id = fields.Char(index=True)
    type = fields.Selection(EMAIL_TYPE)
    status = fields.Integer(default=STATUS_ADDED, index=True)
    message = fields.Text()
    traceback = fields.Text()
    customer_email = fields.Char()
    request_data = fields.Text()

    def init(self):
        self._cr.execute("""SELECT indexname FROM pg_indexes WHERE indexname = 'shopify_pdf_email_log_shop_id_idx'""")
        if not self._cr.fetchone():
            self._cr.execute("""CREATE INDEX shopify_pdf_email_log_shop_id_idx ON shopify_pdf_email_log (shop_id, shopify_object_id)""")


class Shop(models.Model):
    _inherit = 'shopify.pdf.shop'
    email_automations = fields.One2many('shopify.pdf.email.automation', 'shop_id')

    def check_email_limits(self):
        email_limits = self.get_current_plan().automation_email_limits
        # free plan, immediately return False
        if email_limits == 0:
            return False
        # unlimited plan, immediately return True
        if email_limits == -1:
            return True
        # check limits vs. current month
        return self.get_email_counts_current_month() < email_limits

    def get_email_counts_current_month(self):
        self.ensure_one()
        first_of_month = fields.Datetime.today().replace(day=1)
        count = self.env['shopify.pdf.email.log'].search([
            ('shop_id', '=', self.id),
            ('create_date', '>=', first_of_month),
            ('status', '=', EmailLog.STATUS_SUCCESS)
        ], count=True)
        return count

    def get_email_automation_setting(self, id=None):
        if not id:
            return False
        email = self.env['shopify.pdf.email.automation'].search([
            ('shop_id', '=', self.id), ('id', '=', id)
        ])
        return email.read([
            'type',
            'enable_email_automation',
            'send_email_when',
            'email_reply_to',
            'bcc_to',
            'email_tags',
            'email_file_name',
            'email_subject',
            'custom_email_message',
            'test_email'
        ])[0]

    def get_email_automation_settings(self):
        self.ensure_one()
        emails = []
        for (email_type, label) in EMAIL_TYPE:
            email = self.env['shopify.pdf.email.automation'].search([
                ('shop_id', '=', self.id), ('type', '=', email_type)
            ])
            if not email:
                send_email_when = {
                    'invoice': 'order_created',
                    'refund': 'refund_created',
                    'packing': 'order_fulfilled'
                }
                email = self.env['shopify.pdf.email.automation'].create({
                    'type': email_type,
                    'shop_id': self.id,
                    'send_email_when': send_email_when.get(email_type)
                })
            emails.append(email.read([
                    'type',
                    'enable_email_automation',
                    'send_email_when',
                    'email_reply_to',
                    'bcc_to',
                    'email_tags',
                    'email_file_name',
                    'email_subject',
                    'custom_email_message',
                    'test_email'
            ])[0])
        return emails

    def check_webhooks(self):
        if self.get_current_plan().automation_email:
            return
        email_automations = self.email_automations
        for email in email_automations:
            if email.webhook_id:
                email.deregister_webhook()


class Sendgrid(models.Model):
    _name = 'shopify.pdf.mail'

    client = fields.Char("Client")
    from_email = fields.Char("Client")

    def get_from_email(self, name=None):
        from_email = self.env['ir.config_parameter'].sudo().get_param('shopify_pdf.send_from_email')

        if not from_email:
            raise ValueError('Source Email not found')
        if name:
            from_email = (from_email, name)
        return from_email

    def set_from_email(self, from_email):
        self.from_email = from_email

    def send(self, to_email, subject, content, pdf_content=None, file_name=None, bcc=None, reply_to=None, name=None):
        from_email = self.env['ir.config_parameter'].sudo().get_param('shopify_pdf.send_from_email')
        smtp_user = self.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_pdf_smtp_user')
        smtp_pass = self.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_pdf_smtp_pass')
        smtp_host = self.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_pdf_smtp_host')
        smtp_port = self.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_pdf_smtp_port')
        # The HTML body of the email.
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['To'] = to_email
        msg.attach(MIMEText(content, 'html'))
        try:
            if not from_email:
                raise ValueError('Send From Email not found')
            elif not smtp_user:
                raise ValueError('SMTP Username not found')
            elif not smtp_pass:
                raise ValueError('SMTP Password not found')
            elif not smtp_host:
                raise ValueError('SMTP Host not found')
            elif not smtp_port:
                raise ValueError('SMTP Port not found')
            else:
                server = smtplib.SMTP(smtp_host, smtp_port)
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, smtp_pass)
                rcpt = [to_email]
                if bcc:
                    rcpt.extend(bcc.split(",", maxsplit=5))
                if reply_to:
                    rcpt.append(reply_to)
                if pdf_content:
                    file = MIMEApplication(pdf_content, "pdf")
                    file.add_header('content-disposition', 'attachment', filename=file_name)
                    msg.attach(file)
                server.sendmail(from_email, rcpt, msg.as_string())

        except HTTPError as e:
            _logger.error('Error sending mail: ' + str(e.status_code) + "\n" + str(e.headers)
                          + "\n" + str(e.body))
            raise ValueError(str(e.body)) from e
        except Exception as e:
            _logger.error('Exception sending mail: ' + traceback.format_exc())
            raise

    def prep_attachment(self, file_content=None, file_name=None, file_type=None, disposition=None, content_id=None):
        """
        file_content can be encoded in base64 or not

        :param file_content:
        :param file_name:
        :param file_type:
        :param disposition:
        :param content_id:
        :return:
        """

        # encode file_content if file_content was not encoded
        try:
            base64.b64decode(file_content, altchars=None, validate=True)
            if isinstance(file_content, bytes):
                file_content.decode('utf-8')
        except Exception:
            file_content = base64.b64encode(file_content).decode('utf-8')

        return Attachment(file_content, file_name, file_type, disposition, content_id)
