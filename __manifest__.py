# -*- coding: utf-8 -*-
{
    'name': "shopify_order_printer",
    'license': 'LGPL-3',
    'summary': """
        Shopify PDF invoices""",
    'description': """
        Long description of module's purpose
    """,
    'application': True,
    'installable': True,
    'auto_install': False,

    'author': "Pullush",
    # for the full list
    'category': 'Web App',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'base_setup'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/res_config_setting.xml',
        'views/order_printer_template.xml',
        'views/shopify_shop.xml',
        'views/shop_log.xml',   
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
    'assets': {
        'shopify_order_printer.pdf_js_package_assets': [
            '/shopify_order_printer/static/src/js/package.js',
        ],
    }
}
