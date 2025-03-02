from datetime import datetime
from odoo import models, fields
import shopify
import logging, traceback

_logger = logging.getLogger(__name__)


class ShopifyPDFPlan(models.Model):
    _name = 'shopify.pdf.plan'

    name = fields.Char('Plan Name', required=True)
    price = fields.Float('Price', required=True, default=0.0)
    automation_email = fields.Boolean(default=False)
    automation_email_limits = fields.Integer(default=0)
    limit_bulk_print = fields.Integer(default=5)
    automation_email_with_tags = fields.Boolean(default=False)
    custom_invoice_number = fields.Boolean(default=False)
    more_paper_size = fields.Boolean(default=False)
    more_product_info = fields.Boolean(default=False)

    live_support = fields.Boolean()
    limit_pdf_view = fields.Integer(default=100)

    def get_plan_by_name(self, name):
        if isinstance(name, str):
            return self.env['shopify.pdf.plan'].search([('name', '=', name)], limit=1)
        return self.get_free_plan()

    def get_plan_by_price(self, price):
        return self.env['shopify.pdf.plan'].search([('price', '=', price)], limit=1)

    def get_free_plan(self):
        return self.search([('price', '=', 0.0)], limit=1)

    def get_all_plans_data(self):
        plans = self.search([]).with_prefetch()
        return plans.read([
            'name',
            'price',
            'automation_email',
            'automation_email_limits',
            'automation_email_with_tags',
            'custom_invoice_number',
            'more_paper_size',
            'live_support'
        ])

    def get_trials_day_left(self, shop_model):
        trial_days = 7
        try:
            plan_history = self.env['shopify.pdf.registry'].sudo().search([('shop_id', '=', shop_model.id), ('plan_id', '=', self.id)], limit=1)
            if plan_history:
                day_use = (fields.datetime.now() - plan_history.create_date).days
                if day_use < 0:
                    day_use = 7
                trial_days = trial_days - day_use
                if trial_days < 0:
                    trial_days = 0
        except Exception as e:
            _logger.error(traceback.format_exc())
        return trial_days

    def get_charge_url(self, shop_model):
        return_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url') + '/pdf/plan/accept'
        test_env = self.env['ir.config_parameter'].sudo().get_param('shopify_pdf.shopify_environment') == 'sandbox' \
                   or shop_model.force_sandbox_env
        trial_days = self.get_trials_day_left(shop_model)
        data_charge = {
            'name': self.name,
            'price': self.price,
            'return_url': return_url,
            'test': test_env,
            'trial_days': trial_days,
        }
        charge = shopify.RecurringApplicationCharge.create(data_charge)
        return charge.confirmation_url

    def activate_plan(self, charge_id):
        charge = shopify.RecurringApplicationCharge.find(charge_id)
        charge.activate()
        if charge.status != 'active':
            raise Exception('Could not activate your plan. Please try again!')
        return charge

    def deactivate_plan(self, charge_id):
        charge = shopify.RecurringApplicationCharge.find(charge_id)
        charge.destroy()
        return charge

    def set_shop_plan_status(self, trial_ends_on=False, shop=None):
        if self.id == self.get_free_plan().id:
            if shop.plan_status != 'free':
                shop.plan_status = 'free'
            return True
        trials_end = False
        if trial_ends_on:
            now = datetime.now().date()
            date = datetime.strptime(str(trial_ends_on), '%Y-%m-%d').date()
            trials_end = now > date
        if not trials_end:
            if shop.plan_status != 'trial_' + shop.plan.name.lower():
                shop.plan_status = 'trial_' + shop.plan.name.lower() if shop.plan else 'trial'
        else:
            if shop.plan_status != 'paid_' + shop.plan.name.lower():
                shop.plan_status = 'paid_' + shop.plan.name.lower() if shop.plan else 'paid'
        return True


class Shop(models.Model):
    _inherit = 'shopify.pdf.shop'

    plan = fields.Many2one('shopify.pdf.plan', string='Plan', index=True)
    charge_id = fields.Char()
    force_sandbox_env = fields.Boolean(default=False)
    plan_status = fields.Char(default='free')

    def get_current_plan(self):
        if not self.plan:
            free_plan = self.env['shopify.pdf.plan'].get_free_plan()
            self.plan = free_plan.id

        return self.plan

    def get_current_plan_data(self):
        plan_data = self.get_current_plan().read([
            'name',
            'price',
            'automation_email',
            'automation_email_limits',
            'automation_email_with_tags',
            'custom_invoice_number',
            'more_paper_size',
            'live_support'
        ])[0]
        plan_data['charge_id'] = self.charge_id
        # plan_data['plan_status'] = 1 if self.plan_status and 'trial' not in self.plan_status else 0
        return plan_data

    def save_current_plan(self, charge):
        plan = self.env['shopify.pdf.plan'].get_plan_by_price(charge.price)
        if not plan:
            raise Exception('Plan not found')
        self.plan = plan.id
        self.charge_id = charge.id
        plan.set_shop_plan_status(trial_ends_on=charge.trial_ends_on, shop=self)
        # create plan history
        plan_history = self.env['shopify.pdf.registry'].sudo().search([('shop_id', '=', self.id), ('plan_id', '=', plan.id)], limit=1)
        if not plan_history:
            self.env['shopify.pdf.registry'].sudo().create({
                'shop_id': self.id,
                'plan_id': plan.id,
                'name': self.name
            })

    def schedule_check_plan(self):
        free_plan = self.env['shopify.pdf.plan'].get_free_plan()
        shops = self.env['shopify.pdf.shop'].sudo().search([('install', '=', True)])
        for shop in shops:
            try:
                if shop.token:
                    if shop.get_current_plan().id and shop.get_current_plan().id != free_plan.id:
                        shop.start_shopify_session()
                        shop.sudo().check_current_plan()
                    else:
                        shop.sudo().check_webhooks()
            except Exception as e:
                _logger.error(traceback.format_exc())

            shopify.ShopifyResource.clear_session()

    def check_current_plan(self):
        free_plan = self.env['shopify.pdf.plan'].sudo().get_free_plan()
        current_plan = shopify.RecurringApplicationCharge.current()
        if not current_plan:
            self.plan = free_plan.id
            free_plan.set_shop_plan_status(trial_ends_on=False, shop=self)
            return
        plan = self.env['shopify.pdf.plan'].sudo().get_plan_by_price(current_plan.price)
        if not plan:
            plan = self.env['shopify.pdf.plan'].sudo().get_plan_by_name(current_plan.name)
        if plan:
            plan.set_shop_plan_status(trial_ends_on=current_plan.trial_ends_on, shop=self)
            # if (float(current_plan.price) != self.get_current_plan().price) or (current_plan.id and not self.plan):
            if current_plan.id and not self.plan:
                self.plan = plan.id
            if self.plan and current_plan.name != self.plan.name:
                self.plan = plan.id
        else:
            raise ValueError('Could not find subscription plan with price: ' + current_plan.price)


class ShopifyPDFPlanRegistry(models.Model):
    _name = 'shopify.pdf.registry'

    name = fields.Char()
    shop_id = fields.Many2one('shopify.pdf.shop', index=True)
    plan_id = fields.Many2one('shopify.pdf.plan', index=True)
