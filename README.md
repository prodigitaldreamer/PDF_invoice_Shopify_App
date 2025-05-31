- PDF Invoice app for Shopify
- Module name : shopify_order_printer
- run install requirements.txt trong module
  
  auto remove wkhtmltopdf 
  sudo apt install wkhtmltopdf
  set limit memory hard 2gb

  install brew install coreutils for macos
  

-- Create Action
-- Cd module -> Run shopify app init
-> Cd tới thư mục app vừa tạo -> run shopify app generate extension --template admin_link --name admin-link-extension (thay đổi key name trước khi generate extension tiếp theo)
- set target ->
# Draft Order
- admin.draft-order-details.action.link -> Action details url: app://pdf/preview/draftOrder
- admin.draft-order-index.selection-action.link -> Bulk action -> url: app:/pdf/preview/bulkDraftOrder

# Order
 - admin.order-details.action.link -> Action details -> url: app://pdf/preview/order
 - admin.order-index.selection-action.link -> Bulk actions -> url: app:/pdf/preview/bulk 
 
