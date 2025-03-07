interface VariableOption {
  value: string;
  string: string;
}

interface VariableCategory {
  title: string;
  options: VariableOption[];
}

export const data: VariableCategory[] = [
  {
    "title": "Store Information",
    "options": [
      { "value": "{{store_name}}", "string": "Store Name" },
      { "value": "{{store_phone}}", "string": "Store Phone Number" },
      { "value": "{{store_email}}", "string": "Store Email" },
      { "value": "{{store_address}}", "string": "Store Address" },
      { "value": "{{store_city}}", "string": "Store City" },
      { "value": "{{store_zip}}", "string": "Store Postal Code" },
      { "value": "{{store_country}}", "string": "Store Country" },
      { "value": "{{store_province}}", "string": "Store Province/State" },
      { "value": "{{store_url}}", "string": "Store URL" },
      { "value": "{{store_domain}}", "string": "Store Domain" },
      { "value": "{{store_logo}}", "string": "Store Logo" }
    ]
  },
  {
    "title": "Order Information",
    "options": [
      { "value": "{{order_number}}", "string": "Order Number" },
      { "value": "{{order_name}}", "string": "Order Name" },
      { "value": "{{order_status}}", "string": "Order Status" },
      { "value": "{{order_date}}", "string": "Order Date" },
      { "value": "{{order_processed_at}}", "string": "Order Processed Date" },
      { "value": "{{order_created_at}}", "string": "Order Creation Date" },
      { "value": "{{order_updated_at}}", "string": "Order Updated Date" },
      { "value": "{{order_cancelled_at}}", "string": "Order Cancelled Date" },
      { "value": "{{order_cancel_reason}}", "string": "Order Cancellation Reason" },
      { "value": "{{order_financial_status}}", "string": "Order Financial Status" },
      { "value": "{{order_fulfillment_status}}", "string": "Order Fulfillment Status" },
      { "value": "{{order_note}}", "string": "Order Note" },
      { "value": "{{order_tags}}", "string": "Order Tags" },
      { "value": "{{order_currency}}", "string": "Order Currency" },
      { "value": "{{order_reference}}", "string": "Order Reference" }
    ]
  },
  {
    "title": "Customer Information",
    "options": [
      { "value": "{{customer_name}}", "string": "Customer Name" },
      { "value": "{{customer_first_name}}", "string": "Customer First Name" },
      { "value": "{{customer_last_name}}", "string": "Customer Last Name" },
      { "value": "{{customer_email}}", "string": "Customer Email" },
      { "value": "{{customer_phone}}", "string": "Customer Phone" },
      { "value": "{{customer_default_address}}", "string": "Customer Default Address" },
      { "value": "{{customer_id}}", "string": "Customer ID" },
      { "value": "{{customer_note}}", "string": "Customer Note" },
      { "value": "{{customer_orders_count}}", "string": "Customer Orders Count" },
      { "value": "{{customer_tags}}", "string": "Customer Tags" },
      { "value": "{{customer_total_spent}}", "string": "Customer Total Spent" }
    ]
  },
  {
    "title": "Billing Information",
    "options": [
      { "value": "{{billing_name}}", "string": "Billing Name" },
      { "value": "{{billing_first_name}}", "string": "Billing First Name" },
      { "value": "{{billing_last_name}}", "string": "Billing Last Name" },
      { "value": "{{billing_company}}", "string": "Billing Company" },
      { "value": "{{billing_address1}}", "string": "Billing Address Line 1" },
      { "value": "{{billing_address2}}", "string": "Billing Address Line 2" },
      { "value": "{{billing_street}}", "string": "Billing Street" },
      { "value": "{{billing_city}}", "string": "Billing City" },
      { "value": "{{billing_zip}}", "string": "Billing Postal Code" },
      { "value": "{{billing_province}}", "string": "Billing Province/State" },
      { "value": "{{billing_province_code}}", "string": "Billing Province/State Code" },
      { "value": "{{billing_country}}", "string": "Billing Country" },
      { "value": "{{billing_country_code}}", "string": "Billing Country Code" },
      { "value": "{{billing_phone}}", "string": "Billing Phone" }
    ]
  },
  {
    "title": "Shipping Information",
    "options": [
      { "value": "{{shipping_name}}", "string": "Shipping Name" },
      { "value": "{{shipping_first_name}}", "string": "Shipping First Name" },
      { "value": "{{shipping_last_name}}", "string": "Shipping Last Name" },
      { "value": "{{shipping_company}}", "string": "Shipping Company" },
      { "value": "{{shipping_address1}}", "string": "Shipping Address Line 1" },
      { "value": "{{shipping_address2}}", "string": "Shipping Address Line 2" },
      { "value": "{{shipping_street}}", "string": "Shipping Street" },
      { "value": "{{shipping_city}}", "string": "Shipping City" },
      { "value": "{{shipping_zip}}", "string": "Shipping Postal Code" },
      { "value": "{{shipping_province}}", "string": "Shipping Province/State" },
      { "value": "{{shipping_province_code}}", "string": "Shipping Province/State Code" },
      { "value": "{{shipping_country}}", "string": "Shipping Country" },
      { "value": "{{shipping_country_code}}", "string": "Shipping Country Code" },
      { "value": "{{shipping_phone}}", "string": "Shipping Phone" }
    ]
  },
  {
    "title": "Line Items",
    "options": [
      { "value": "{{product_name}}", "string": "Product Name" },
      { "value": "{{product_title}}", "string": "Product Title" },
      { "value": "{{product_description}}", "string": "Product Description" },
      { "value": "{{product_image}}", "string": "Product Image" },
      { "value": "{{product_vendor}}", "string": "Product Vendor" },
      { "value": "{{product_type}}", "string": "Product Type" },
      { "value": "{{product_url}}", "string": "Product URL" },
      { "value": "{{sku}}", "string": "SKU" },
      { "value": "{{barcode}}", "string": "Barcode" },
      { "value": "{{variant_title}}", "string": "Variant Title" },
      { "value": "{{qty}}", "string": "Quantity" },
      { "value": "{{price}}", "string": "Price" },
      { "value": "{{price_no_vat}}", "string": "Price (No VAT)" },
      { "value": "{{subtotal}}", "string": "Subtotal" },
      { "value": "{{subtotal_no_vat}}", "string": "Subtotal (No VAT)" },
      { "value": "{{discount_amount}}", "string": "Discount Amount" },
      { "value": "{{item_number}}", "string": "Item Number" },
      { "value": "{{line_tax}}", "string": "Line Item Tax" },
      { "value": "{{line_tax_rate}}", "string": "Line Item Tax Rate" },
      { "value": "{{line_properties}}", "string": "Line Item Properties" }
    ]
  },
  {
    "title": "Order Totals",
    "options": [
      { "value": "{{subtotal_price}}", "string": "Subtotal Price" },
      { "value": "{{total_line_items_price}}", "string": "Total Line Items Price" },
      { "value": "{{total_price}}", "string": "Total Price" },
      { "value": "{{total_tax}}", "string": "Total Tax" },
      { "value": "{{total_discounts}}", "string": "Total Discounts" },
      { "value": "{{total_weight}}", "string": "Total Weight" },
      { "value": "{{total_shipping}}", "string": "Total Shipping" },
      { "value": "{{total_shipping_tax}}", "string": "Total Shipping Tax" },
      { "value": "{{cart_discount}}", "string": "Cart Discount" },
      { "value": "{{cart_discount_code}}", "string": "Cart Discount Code" }
    ]
  },
  {
    "title": "Payment & Fulfillment",
    "options": [
      { "value": "{{payment_method}}", "string": "Payment Method" },
      { "value": "{{payment_gateway}}", "string": "Payment Gateway" },
      { "value": "{{payment_date}}", "string": "Payment Date" },
      { "value": "{{payment_transaction_id}}", "string": "Payment Transaction ID" },
      { "value": "{{payment_status}}", "string": "Payment Status" },
      { "value": "{{fulfillment_status}}", "string": "Fulfillment Status" },
      { "value": "{{fulfillment_date}}", "string": "Fulfillment Date" },
      { "value": "{{tracking_number}}", "string": "Tracking Number" },
      { "value": "{{tracking_url}}", "string": "Tracking URL" },
      { "value": "{{shipping_method}}", "string": "Shipping Method" },
      { "value": "{{shipping_carrier}}", "string": "Shipping Carrier" }
    ]
  },
  {
    "title": "Date & Time Formats",
    "options": [
      { "value": "{{current_date}}", "string": "Current Date" },
      { "value": "{{current_date_short}}", "string": "Current Date (Short Format)" },
      { "value": "{{current_date_long}}", "string": "Current Date (Long Format)" },
      { "value": "{{current_time}}", "string": "Current Time" },
      { "value": "{{current_time_24h}}", "string": "Current Time (24h Format)" },
      { "value": "{{current_day}}", "string": "Current Day" },
      { "value": "{{current_month}}", "string": "Current Month" },
      { "value": "{{current_year}}", "string": "Current Year" }
    ]
  },
  {
    "title": "Miscellaneous",
    "options": [
      { "value": "{{barcode_order_number}}", "string": "Barcode (Order Number)" },
      { "value": "{{qrcode_order_number}}", "string": "QR Code (Order Number)" },
      { "value": "{{page_number}}", "string": "Page Number" },
      { "value": "{{total_pages}}", "string": "Total Pages" },
      { "value": "{{vat_number}}", "string": "VAT Number" },
      { "value": "{{tax_id}}", "string": "Tax ID" },
      { "value": "{{invoice_number}}", "string": "Invoice Number" },
      { "value": "{{invoice_date}}", "string": "Invoice Date" },
      { "value": "{{terms_conditions}}", "string": "Terms & Conditions" },
      { "value": "{{footer_text}}", "string": "Footer Text" }
    ]
  }
];