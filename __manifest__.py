# -*- coding: utf-8 -*-
{
    'name': "shopify_pdf",

    'summary': """
        Shopify PDF invoices""",

    'description': """
        Long description of module's purpose
    """,

    'author': "Magenest",
    'website': "https://store.magenest.com/",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/13.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Web App',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'base_setup'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/res_config_setting.xml',
        'views/templates.xml',
        # 'views/views.xml',
        'views/shop.xml',
        'views/shop_log.xml',
        'views/mail.xml',
        'data/data.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
    'assets': {
        'shopify_pdf_invoice.pdf_js_package_assets': [
            '/shopify_pdf_invoice/static/src/js/package.js',
            # '/shopify_pdf_invoice/static/src/js/pdf-invoice-frontend-button.js',
        ],
    }
}
