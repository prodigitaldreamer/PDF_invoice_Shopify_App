import traceback
from urllib.parse import urlencode
from odoo import http, fields
import logging
from werkzeug.utils import redirect
from odoo.http import request
from ..oauth2.auth import ShopifyHelper
from ..oauth2.decorator import ensure_login
import json
from ..app import CUSTOM_FONTS
from .pdf import PdfReportController

_logger = logging.getLogger(__name__)


class Plan(PdfReportController):

    @http.route('/pdf/plan/charge', type='http', auth='public', methods=['POST'], csrf=False, save_session=False)
    def plan_charge(self):
        try:
            ensure_login()
            if 'plan' not in request.params:
                raise Exception('Missing plan parameter. Please try again!')
            plan = request.env['shopify.pdf.plan'].sudo().get_plan_by_name(request.params['plan'])
            if not plan:
                raise Exception('Could not find the plan you were looking for. Please try again!')

            session = self.start_shopify_session(shop=request.session['shop_url_pdf'])
            shop = session['shop']
            charge_url = plan.get_charge_url(shop)

            headers = {'Content-Security-Policy': "frame-ancestors https://" + request.session[
                'shop_url_pdf'] + " https://admin.shopify.com;"}
            return request.render('shopify_pdf_invoice.redirect', {
                'url': charge_url
            }, headers=headers)
        except Exception as e:
            _logger.error(traceback.format_exc())
            return redirect('/pdf/main?' + urlencode({'message': str(e)}))

    @http.route('/pdf/plan/accept', type='http', auth='public', save_session=False)
    def plan_accept(self):
        try:
            ensure_login()
            if not 'charge_id' in request.params:
                raise Exception('Missing charge ID. Please try again')
            session = self.start_shopify_session(shop=request.session['shop_url_pdf'])
            shop = session['shop']
            plan = request.env['shopify.pdf.plan']
            charge = plan.activate_plan(request.params['charge_id'])
            shop.sudo().save_current_plan(charge)

            return redirect('/pdf/accounts?' + urlencode({'message': 'You have successfully subscribed to a new plan.'}))
        except Exception as e:
            _logger.error(traceback.format_exc())
            return redirect('/pdf/accounts?' + urlencode({'message': str(e)}))

    @http.route('/pdf/downgrades/plan/free', type='json', auth='public', methods=['POST'], csrf=False, save_session=False)
    def plan_downgrades_to_free(self):
        try:
            ensure_login()
            session = self.start_shopify_session(shop=request.session['shop_url_pdf'])
            shop = session['shop']
            shop.get_current_plan().deactivate_plan(shop.charge_id)
            shop.charge_id = False
            free_plan = shop.get_current_plan().get_free_plan()
            if free_plan:
                # shop.plan = free_plan.id
                free_plan.set_shop_plan_status(trial_ends_on=False, shop=shop)
            return {'message': 'You have successfully canceled the paid plan.'}
        except Exception as e:
            _logger.error(traceback.format_exc())
            return {'message': str(e)}

