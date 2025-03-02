import pytz
import datetime
from odoo import models, fields, api
import logging
import traceback

_logger = logging.getLogger(__name__)


class ShopifyShop(models.Model):
    _inherit = 'shopify.pdf.shop'
    _description = 'Shopify Shop'

    last_cron = fields.Char()

    def schedule_sync(self):
        shops = self.search([('timezone', '!=', False), ('token', '!=', False)])
        for shop in shops:
            try:
                if shop._check_time():
                    templates = self.env['shopify.pdf.shop.template'].search([('virtual_rec', '=', True), ('shop_id', '=', shop.id)])
                    if templates:
                        templates.unlink()
                    shop.set_last_sync()
            except Exception as e:
                _logger.error(traceback.format_exc())
        _logger.info('Stop Shopify PDF Cron')

    def _check_time(self):
        if not self.timezone:
            raise Exception('Timezone not found')
        tz = pytz.timezone(self.timezone)
        now_in_shop_tz = datetime.datetime.now().astimezone(tz)
        start_mid_night = now_in_shop_tz.replace(hour=2, minute=0, second=0)
        end_mid_night = now_in_shop_tz.replace(hour=3, minute=0, second=0)
        today_sync = now_in_shop_tz.strftime('%Y-%m-%d') in [self.last_cron]
        # check in midnight
        if start_mid_night < now_in_shop_tz < end_mid_night and not today_sync:
            return True
        return False

    def set_last_sync(self):
        if not self.timezone:
            raise Exception('Timezone not found')
        tz = pytz.timezone(self.timezone)
        now_in_tz_to_string = datetime.datetime.now().astimezone(tz).strftime('%Y-%m-%d')
        self.sudo().write({
            'last_cron': now_in_tz_to_string
        })
