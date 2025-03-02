import React from "react";
import {Button} from "@shopify/polaris";

let data = [
  {
    "title": "Store Information",
    "options": [
      {
        "value": "{{store_name}}",
        "label": <Button>Store Name</Button>,
        "string": "Store Name"
      },
      {
        "value": "{{store_phone}}",
        "label": <Button>Store Phone Number</Button>,
        "string": "Store Phone Number"
      },
      {
        "value": "{{store_address}}",
        "label": <Button>Store Address</Button>,
        "string": "Store Address"
      },
      {
        "value": "{{store_state}}",
        "label": <Button>Store State</Button>,
        "string": "Store State"
      },
      {
        "value": "{{store_city}}",
        "label": <Button>Store City</Button>,
        "string": "Store City"
      },
      {
        "value": "{{store_email}}",
        "label": <Button>Store Email</Button>,
        "string": "Store Email"
      },
      // {
      //   "value": "{{store_street_line1}}",
      //   "label": <Button>Street Address</Button>,
      //   "string": "Street Address"
      // },
      // {
      //   "value": "{{store_street_line2}}",
      //   "label": <Button>Street Address Line 2</Button>,
      //   "string": "Street Address Line 2"
      // },
      {
        "value": "{{store_postcode}}",
        "label": <Button>ZIP/Postal Code</Button>,
        "string": "ZIP/Postal Code"
      },
      // {
      //   "value": "{{store_country}}",
      //   "label": <Button>Country</Button>,
      //   "string": "Country"
      // },
      // {
      //   "value": "{{store_region}}",
      //   "label": <Button>Region/State</Button>,
      //   "string": "Region/State"
      // },
      {
        "value": "{{vat_number}}",
        "label": <Button>VAT Number</Button>,
        "string": "VAT Number"
      }
    ]
  },
  {
    "title": "Shipping Information",
    "options": [
      {
        "value": "{{shipping_method}}",
        "label": <Button>Shipping Method</Button>,
        "string": "Shipping Method"
      },
      {
        "value": "{{shipping_name}}",
        "label": <Button>Shipping Name</Button>,
        "string": "Shipping Name"
      },
      {
        "value": "{{shipping_first_name}}",
        "label": <Button>Customer First Name (shipping)</Button>,
        "string": "Customer First Name (shipping)"
      },
      {
        "value": "{{shipping_last_name}}",
        "label": <Button>Customer Last Name (shipping)</Button>,
        "string": "Customer Last Name (shipping)"
      },
      {
        "value": "{{shipping_street1}}",
        "label": <Button>Street (shipping)</Button>,
        "string": "Street (shipping)"
      },
      {
        "value": "{{shipping_street2}}",
        "label": <Button>Street line 2 (shipping)</Button>,
        "string": "Street line 2 (shipping)"
      },
      {
        "value": "{{shipping_company}}",
        "label": <Button>Company (shipping)</Button>,
        "string": "Company (shipping)"
      },
      {
        "value": "{{shipping_region}}",
        "label": <Button>Region (shipping)</Button>,
        "string": "Region (shipping)"
      },
      {
        "value": "{{shipping_phone_number}}",
        "label": <Button>Phone Number (shipping)</Button>,
        "string": "Phone Number (shipping)"
      },
      {
        "value": "{{shipping_post_code}}",
        "label": <Button>ZIP/Postal Code (shipping)</Button>,
        "string": "ZIP/Postal Code (shipping)"
      },
      {
        "value": "{{shipping_country}}",
        "label": <Button>Country (shipping)</Button>,
        "string": "Country (shipping)"
      },
      {
        "value": "{{tracking_company}}",
        "label": <Button>Tracking company</Button>,
        "string": "Tracking company"
      },
      {
        "value": "{{tracking_number}}",
        "label": <Button>Tracking number</Button>,
        "string": "Tracking number"
      },
      {
        "value": "{{fulfilled_date}}",
        "label": <Button>Shipping Date</Button>,
        "string": "Shipping Date"
      },
      {
        "value": "{{shipping_city}}",
        "label": <Button>City (shipping)</Button>,
        "string": "City (shipping)"
      }
    ]
  },
  {
    "title": "Billing Information",
    "options": [
      {
        "value": "{{billing_name}}",
        "label": <Button>Billing Name</Button>,
        "string": "Billing Name"
      },
      {
        "value": "{{billing_first_name}}",
        "label": <Button>Billing First Name</Button>,
        "string": "Billing First Name"
      },
      {
        "value": "{{billing_last_name}}",
        "label": <Button>Billing Last Name</Button>,
        "string": "Billing Last Name"
      },
      {
        "value": "{{billing_street1}}",
        "label": <Button>Street (billing)</Button>,
        "string": "Street (billing)"
      },
      {
        "value": "{{billing_street2}}",
        "label": <Button>Street line 2 (billing)</Button>,
        "string": "Street line 2 (billing)"
      },
      {
        "value": "{{billing_company}}",
        "label": <Button>Company</Button>,
        "string": "Company (billing)"
      },
      {
        "value": "{{billing_region}}",
        "label": <Button>Region/State</Button>,
        "string": "Region/State (billing)"
      },
      {
        "value": "{{billing_phone_number}}",
        "label": <Button>Phone Number</Button>,
        "string": "Phone Number (billing)"
      },
      {
        "value": "{{billing_post_code}}",
        "label": <Button>ZIP/Postal Code (billing)</Button>,
        "string": "ZIP/Postal Code (billing)"
      },
      {
        "value": "{{billing_country}}",
        "label": <Button>Country (billing)</Button>,
        "string": "Country (billing)"
      },
      {
        "value": "{{billing_city}}",
        "label": <Button>City (billing)</Button>,
        "string": "City (billing)"
      }
    ]
  },
  {
    "title": "Customer Information",
    "options": [
      {
        "value": "{{customer_email}}",
        "label": <Button>Customer Email</Button>,
        "string": "Customer Email"
      },
      {
        "value": "{{customer_first_name}}",
        "label": <Button>Customer First Name</Button>,
        "string": "Customer First Name"
      },
      {
        "value": "{{customer_last_name}}",
        "label": <Button>Customer Last Name</Button>,
        "string": "Customer Last Name"
      },
      {
        "value": "{{customer_phone}}",
        "label": <Button>Customer Phone</Button>,
        "string": "Customer Phone"
      },
      {
        "value": "{{customer_add_company}}",
        "label": <Button>Customer Company</Button>,
        "string": "Customer Company"
      },
      {
        "value": "{{customer_add_1}}",
        "label": <Button>Customer Address 1</Button>,
        "string": "Customer Address 1"
      },
      {
        "value": "{{customer_add_2}}",
        "label": <Button>Customer Address 2</Button>,
        "string": "Customer Address 2"
      },
      {
        "value": "{{customer_add_city}}",
        "label": <Button>Customer City</Button>,
        "string": "Customer City"
      },
      {
        "value": "{{customer_add_province}}",
        "label": <Button>Customer Province</Button>,
        "string": "Customer Province"
      },
      {
        "value": "{{customer_add_country}}",
        "label": <Button>Customer Country</Button>,
        "string": "Customer Country"
      },
      {
        "value": "{{customer_add_zip}}",
        "label": <Button>Customer Address Zip</Button>,
        "string": "Customer Address Zip"
      }
    ]
  },
  {
    "title": "Payment Information",
    "options": [
      {
        "value": "{{payment_method}}",
        "label": <Button>Payment Method</Button>,
        "string": "Payment Method"
      },
      {
        "value": "{{payment_card}}",
        "label": <Button>Payment Card</Button>,
        "string": "Payment Card"
      }
    ]
  },
  {
    "title": "Order Information",
    "options": [
      {
        "value": "{{order_id}}",
        "label": <Button>Order ID</Button>,
        "string": "Order ID"
      },
      {
        "value": "{{order_status}}",
        "label": <Button>Order Status</Button>,
        "string": "Order Status"
      },
      {
        "value": "{{order_name}}",
        "label": <Button>Order Name</Button>,
        "string": "Order Name"
      },
      {
        "value": "{{refund_name}}",
        "label": <Button>Refund Name</Button>,
        "string": "Refund Name"
      },
      {
        "value": "{{shipment_id}}",
        "label": <Button>Shipment ID</Button>,
        "string": "Shipment ID"
      },
      {
        "value": "{{shipment_name}}",
        "label": <Button>Shipment Name</Button>,
        "string": "Shipment Name"
      },
      {
        "value": "{{order_created_at}}",
        "label": <Button>Order created at</Button>,
        "string": "Order created at"

      },
      {
        "value": "{{order_note}}",
        "label": <Button>Order Note</Button>,
        "string": "Order Note"
      },
      {
        "value": "{{refund_note}}",
        "label": <Button>Refund Note</Button>,
        "string": "Refund Note"
      },
        {
        "value": "{{order_note_attribute}}",
        "label": <Button>Order Note Attribute</Button>,
        "string": "Order Note Attribute"
      }
    ]
  },
  {
    "title": "Items",
    "options": [
      {
        "value": "{{product_image}}",
        "label": <Button>Product Image</Button>,
        "string": "Product Image"
      },
      {
        "value": "{{product_name}}",
        "label": <Button>Product Name</Button>,
        "string": "Product Name"
      },
      {
        "value": "{{sku}}",
        "label": <Button>SKU</Button>,
        "string": "SKU"
      },
      {
        "value": "{{qty}}",
        "label": <Button>Quantity</Button>,
        "string": "Quantity"
      },
      {
        "value": "{{price}}",
        "label": <Button>Price</Button>,
        "string": "Price"
      },
      {
        "value": "{{tax_amount}}",
        "label": <Button>Tax Amount</Button>,
        "string": "Tax Amount"
      },
      {
        "value": "{{price_with_discount}}",
        "label": <Button>Price Discount Apply</Button>,
        "string": "Price Discount Apply"
      },
      {
        "value": "{{price_no_vat}}",
        "label": <Button>Price Without Vat</Button>,
        "string": "Price Without Vat"
      },
      {
        "value": "{{compare_price}}",
        "label": <Button>Compare At Price</Button>,
        "string": "Compare At Price"
      },
      {
        "value": "{{subtotal}}",
        "label": <Button>Subtotal</Button>,
        "string": "Subtotal"
      },
      {
        "value": "{{subtotal_no_vat}}",
        "label": <Button>Subtotal No Vat</Button>,
        "string": "Subtotal No Vat"
      },
      {
        "value": "{{discount_amount}}",
        "label": <Button>Total Item Discount</Button>,
        "string": "Total Item Discount"
      },
      {
        "value": "{{rowtotal}}",
        "label": <Button>Row Total</Button>,
        "string": "Row Total"
      },
      {
        "value": "{{tracking_number}}",
        "label": <Button>Tracking number</Button>,
        "string": "Tracking number"
      },
      {
        "value": "{{item_number}}",
        "label": <Button>Item number</Button>,
        "string": "Item number"
      },
      {
        "value": "{{product_description}}",
        "label": <Button>Product Description</Button>,
        "string": "Product Description"
      },
      {
        "value": "{{product_vendor}}",
        "label": <Button>Product Vendor</Button>,
        "string": "Product Vendor"
      },
      // {
      //   "value": "{{product_origin_country}}",
      //   "label": <Button>Country of Origin</Button>,
      //   "string": "Country of Origin"
      // },
      {
        "value": "{{discount_per_item}}",
        "label": <Button>Discount Per Item</Button>,
        "string": "Discount Per Item"
      },
      {
        "value": "{{presentment_price}}",
        "label": <Button>Presentment Price</Button>,
        "string": "Presentment Price"
      },
      {
        "value": "{{presentment_tax_amount}}",
        "label": <Button>Presentment Tax Amount</Button>,
        "string": "Presentment Tax Amount"
      },
      {
        "value": "{{presentment_price_with_discount}}",
        "label": <Button>Presentment Price Discount Apply</Button>,
        "string": "Presentment Price Discount Apply"
      },
      {
        "value": "{{presentment_price_no_vat}}",
        "label": <Button>Presentment Price Without Vat</Button>,
        "string": "Presentment Price Without Vat"
      },
      {
        "value": "{{presentment_subtotal_no_vat}}",
        "label": <Button>Presentment Subtotal No Vat</Button>,
        "string": "Presentment Subtotal No Vat"
      },
      {
        "value": "{{presentment_discount_amount}}",
        "label": <Button>Presentment Total Item Discount</Button>,
        "string": "Presentment Total Item Discount"
      },
      {
        "value": "{{presentment_subtotal}}",
        "label": <Button>Presentment Subtotal</Button>,
        "string": "Presentment Subtotal"
      },
      {
        "value": "{{product_hs_code}}",
        "label": <Button>HS Code</Button>,
        "string": "HS Code"
      },
      // {
      //   "value": "{{product_country_of_origin_code}}",
      //   "label": <Button>Country of Origin Code</Button>,
      //   "string": "Country of Origin Code"
      // },
      {
        "value": "{{cost_per_item}}",
        "label": <Button>Cost Per Item</Button>,
        "string": "Cost Per Item"
      }
    ]
  },
  {
    "title": "Totals",
    "options": [
      {
        "value": "{{order_subtotal}}",
        "label": <Button>Order Subtotal</Button>,
        "string": "Order Subtotal"
      },
      {
        "value": "{{order_subtotal_discount_apply}}",
        "label": <Button>Order Subtotal With Discount Apply</Button>,
        "string": "Order Subtotal With Discount Apply"
      },
      {
        "value": "{{order_subtotal_no_vat}}",
        "label": <Button>Order Subtotal No Vat</Button>,
        "string": "Order Subtotal No Vat"
      },
      {
        "value": "{{order_shippingAndHandling}}",
        "label": <Button>Shipping & Handling</Button>,
        "string": "Shipping & Handling"
      },
      {
        "value": "{{order_shippingAndHandling_no_vat}}",
        "label": <Button>Shipping & Handling No Vat</Button>,
        "string": "Shipping & Handling No Vat"
      },
      {
        "value": "{{order_tax}}",
        "label": <Button>Order Tax</Button>,
        "string": "Order Tax"
      },
      {
        "value": "{{order_tax_with_ship_tax}}",
        "label": <Button>Order Tax + Shipping Tax</Button>,
        "string": "Order Tax + Shipping Tax"
      },
      {
        "value": "{{detailed_tax_html}}",
        "label": <Button>Detailed Tax (Multi Tax Lines)</Button>,
        "string": "Detailed Tax (Multi Tax Lines)"
      },
      {
        "value": "{{order_grandtotal}}",
        "label": <Button>Order Grand Total</Button>,
        "string": "Order Grand Total"
      },
      {
        "value": "{{order_grandtotal_no_vat}}",
        "label": <Button>Order Grand Total No Vat</Button>,
        "string": "Order Grand Total No Vat"
      },
      {
        "value": "{{order_discount_amount}}",
        "label": <Button>Order Discount</Button>,
        "string": "Order Discount"
      },
      {
        "value": "{{order_discount_amount_no_vat}}",
        "label": <Button>Order Discount No Vat</Button>,
        "string": "Order Discount No Vat"
      },
      {
        "value": "{{order_total_discount_amount}}",
        "label": <Button>Order Discount Total</Button>,
        "string": "Order Discount Total"
      },
      {
        "value": "{{total_tip_received}}",
        "label": <Button>Total Tip Received</Button>,
        "string": "Total Tip Received"
      },
      {
        "value": "{{shipping_refund_amount}}",
        "label": <Button>Shipping Refund</Button>,
        "string": "Shipping Refund"
      },
      {
        "value": "{{refund_amount}}",
        "label": <Button>Refund Amount</Button>,
        "string": "Refund Amount"
      },
      {
        "value": "{{refund_amount_no_vat}}",
        "label": <Button>Refund Amount No Vat</Button>,
        "string": "Refund Amount No Vat"
      },
      {
        "value": "{{refund_vat}}",
        "label": <Button>Refund Vat Amount</Button>,
        "string": "Refund Vat Amount"
      },
      {
        "value": "{{packing_amount}}",
        "label": <Button>Packing Amount</Button>,
        "string": "Packing Amount"
      },
      {
        "value": "{{presentment_order_subtotal_discount_apply}}",
        "label": <Button>Presentment Subtotal With Discount Apply</Button>,
        "string": "Presentment Order Subtotal With Discount Apply"
      },
      {
        "value": "{{presentment_order_subtotal}}",
        "label": <Button>Presentment Order Subtotal</Button>,
        "string": "Presentment Order Subtotal"
      },
      {
        "value": "{{presentment_order_subtotal_no_vat}}",
        "label": <Button>Presentment Order Subtotal No Vat</Button>,
        "string": "Presentment Order Subtotal No Vat"
      },
      {
        "value": "{{presentment_order_shippingAndHandling}}",
        "label": <Button>Presentment Order Shipping & Handling</Button>,
        "string": "Presentment Order Shipping & Handling"
      },
      {
        "value": "{{presentment_order_shippingAndHandling_no_vat}}",
        "label": <Button>Presentment Order Shipping & Handling No Vat</Button>,
        "string": "Presentment Order Shipping & Handling No Vat"
      },
      {
        "value": "{{presentment_order_tax}}",
        "label": <Button>Presentment Order Tax</Button>,
        "string": "Presentment Order Tax"
      },
      {
        "value": "{{presentment_order_tax_with_ship_tax}}",
        "label": <Button>Presentment Order Tax + Shipping Tax</Button>,
        "string": "Presentment Order Tax + Shipping Tax"
      },
      {
        "value": "{{presentment_detailed_tax_html}}",
        "label": <Button>Presentment Detailed Tax (Multi Tax Lines)</Button>,
        "string": "Presentment Detailed Tax (Multi Tax Lines)"
      },
      {
        "value": "{{presentment_order_grandtotal}}",
        "label": <Button>Presentment Order Grand Total</Button>,
        "string": "Presentment Order Grand Total"
      },
      {
        "value": "{{presentment_order_grandtotal_no_vat}}",
        "label": <Button>Presentment Order Grand Total No Vat</Button>,
        "string": "Presentment Order Grand Total No Vat"
      },
      {
        "value": "{{presentment_order_discount_amount}}",
        "label": <Button>Presentment Order Discount</Button>,
        "string": "Presentment Order Discount"
      },
      {
        "value": "{{presentment_order_discount_amount_no_vat}}",
        "label": <Button>Presentment Order Discount No Vat</Button>,
        "string": "Presentment Order Discount No Vat"
      },
      {
        "value": "{{presentment_order_total_discount_amount}}",
        "label": <Button>Presentment All Discount Total</Button>,
        "string": "Presentment Order Discount Total"
      },
      {
        "value": "{{presentment_packing_amount}}",
        "label": <Button>Presentment Packing Amount</Button>,
        "string": "Presentment Packing Amount"
      }
    ]
  },
  {
    "title": "Others",
    "options": [
      {
        "value": "{{invoice_printing_date}}",
        "label": <Button>Invoice printing date</Button>,
        "string": "Invoice printing date"
      },
      {
        "value": "{{invoice_number}}",
        "label": <Button>Custom Invoice Number</Button>,
        "string": "Custom Invoice Number"
      }
    ]
  }
]
export {data};