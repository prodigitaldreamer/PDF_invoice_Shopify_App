import datetime
import json
import traceback

import shopify
import logging


_logger = logging.getLogger(__name__)


class ShopifyAuth(shopify.Session):
    def __init__(self, shop_url, env, version=None, token=None):
        if version is None:
            version = env['ir.config_parameter'].sudo().get_param('shopify_order_printer.shopify_api_version')
        super(ShopifyAuth, self).__init__(shop_url, version, token)
        shopify.Session.setup(
            api_key=env['ir.config_parameter'].sudo().get_param('shopify_order_printer.shopify_api_key'),
            secret=env['ir.config_parameter'].sudo().get_param('shopify_order_printer.shopify_api_secret')
        )


class ShopifyHelper:
    shop_url = None
    shop_model = None
    token = None
    env = None
    session = None

    def __init__(self, shop_url=None, token=None, env=None, *args, **kwargs):
        if env is not None:
            self.env = env
        if shop_url is not None:
            self.shop_url = shop_url
        if shop_url is not None and env is not None:
            self.shop_model = env['shopify.pdf.shop'].sudo().search([('name', '=', shop_url)])
        if token is not None:
            self.token = token

    def get_shop_model(self):
        return self.shop_model

    def auth(self):
        version = self.env['ir.config_parameter'].sudo().get_param('shopify_order_printer.shopify_api_version')
        self.session = shopify.Session(version=version, token=self.token, shop_url=self.shop_url)
        shopify.ShopifyResource.activate_session(self.session)
        return self.session

    def set_shop_info(self):
        self.auth()
        if self.shop_model:
            shop = shopify.Shop.current()
            self.shop_model.timezone = shop.attributes['iana_timezone']
            self.shop_model.shop_name = shop.attributes['name']
            self.shop_model.shop_owner = shop.attributes['shop_owner']
            self.shop_model.email = shop.attributes['email']
            self.shop_model.country = shop.attributes['country_name']
            launch_query = shopify.GraphQL().execute("{ appInstallation { launchUrl } }")
            launch_query = json.loads(launch_query)
            launch = False
            if 'data' in launch_query:
                launch = launch_query['data']['appInstallation']['launchUrl']
            self.shop_model.launch_url = launch

    def check_access(self):
        try:
            self.auth()
            shopify.Shop.current()
            return True
        except Exception:
            self.reset()
            return False

    def reset(self):
        model = self.env['shopify.pdf.shop'].sudo().search([('name', '=', self.shop_url)])
        if model:
            model.token = False





