- PDF Invoice app for Shopify
- Module name : shopify_pdf_invoice
- run install requirements
  
  auto remove wkhtmltopdf 
  sudo apt install wkhtmltopdf
  set limit memory hard 2gb
  

-- Create Action
-- Cd module -> Run shopify app init
-> Cd tới thư mục app vừa tạo -> run shopify app generate extension --template admin_link --name admin-link-extension (thay đổi name)
- set target ->
 # Draft Order
#  - admin.draft-order-details.action.link -> Action details
#  - admin.draft-order-index.selection.action.link -> Bulk action
#
# Order
#  - admin.order-details.action.link -> Action details
#  - admin.order-index.selection.action.link -> Bulk actions