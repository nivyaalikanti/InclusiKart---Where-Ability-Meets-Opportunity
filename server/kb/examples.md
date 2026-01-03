//Navigation Routes
User: open home
Action:
{
  "type": "navigate",
  "target": "/"
}

User: open shop
Action:
{
  "type": "navigate",
  "target": "/shop"
}

User: open stories
Action:
{
  "type": "navigate",
  "target": "/stories"
}

User: open support
Action:
{
  "type": "navigate",
  "target": "/support"
}

User: open login
Action:
{
  "type": "navigate",
  "target": "/login"
}

User: open register
Action:
{
  "type": "navigate",
  "target": "/register"
}




//NAVBAR & AUTH ACTIONS
User: click login
Action:
{
  "type": "click",
  "target": "nav-link-login"
}

User: click register
Action:
{
  "type": "click",
  "target": "nav-link-register"
}

User: logout
Action:
{
  "type": "auth",
  "target": "logout"
}

User: open menu
Action:
{
  "type": "click",
  "target": "nav-toggle"
}






//LOGIN PAGE
User: select buyer role
Action:
{
  "type": "click",
  "target": "role-selector-buyer"
}

User: select seller role
Action:
{
  "type": "click",
  "target": "role-selector-seller"
}

User: enter login email
Action:
{
  "type": "focus",
  "target": "email"
}

User: enter login password
Action:
{
  "type": "focus",
  "target": "password"
}

User: toggle password visibility
Action:
{
  "type": "click",
  "target": "password-toggle"
}

User: sign in
Action:
{
  "type": "click",
  "target": "submit-button"
}

User: forgot password
Action:
{
  "type": "click",
  "target": "forgot-password-link"
}





//REGISTER PAGE
User: enter username
Action:
{
  "type": "focus",
  "target": "username"
}

User: enter registration email
Action:
{
  "type": "focus",
  "target": "email"
}

User: enter registration password
Action:
{
  "type": "focus",
  "target": "password"
}

User: confirm password
Action:
{
  "type": "focus",
  "target": "confirmPassword"
}

User: create account
Action:
{
  "type": "click",
  "target": "submit-button"
}

User: sign in here
Action:
{
  "type": "click",
  "target": "submit-button"
}






//SELLER DASHBOARD NAVIGATION
User: manage products
Action:
{
  "type": "navigate",
  "target": "/seller/products"
}

User: view orders
Action:
{
  "type": "navigate",
  "target": "/seller/orders"
}

User: share story
Action:
{
  "type": "navigate",
  "target": "/seller/stories/share"
}

User: request help
Action:
{
  "type": "navigate",
  "target": "/seller/help-request"
}






//PRODUCT MANAGEMENT (SELLER)
User: add new product
Action:
{
  "type": "click",
  "target": "btn-add-new-product"
}

User: filter all products
Action:
{
  "type": "click",
  "target": "filter-all"
}

User: filter pending products
Action:
{
  "type": "click",
  "target": "filter-pending"
}

User: edit product one
Action:
{
  "type": "click",
  "target": "btn-edit-1"
}

User: delete product one
Action:
{
  "type": "click",
  "target": "btn-delete-1"
}

User: next products page
Action:
{
  "type": "click",
  "target": "pagination-next"
}

User: previous products page
Action:
{
  "type": "click",
  "target": "pagination-prev"
}






//SHOP PAGE (BUYER)

User: search products
Action:
{
  "type": "focus",
  "target": "shop-search-input"
}

User: search for handmade bags
Action:
{
  "type": "input",
  "target": "shop-search-input",
  "value": "handmade bags"
}

User: click search
Action:
{
  "type": "click",
  "target": "shop-search-btn"
}

User: open product one
Action:
{
  "type": "click",
  "target": "product-card-1"
}

User: next shop page
Action:
{
  "type": "click",
  "target": "shop-pagination-next"
}





//ORDER MANAGEMENT (SELLER)
User: filter pending orders
Action:
{
  "type": "click",
  "target": "order-filter-pending"
}

User: confirm order
Action:
{
  "type": "click",
  "target": "btn-confirm-order"
}

User: cancel order
Action:
{
  "type": "click",
  "target": "btn-cancel-order"
}

User: mark as shipped
Action:
{
  "type": "click",
  "target": "btn-mark-shipped"
}

User: mark as delivered
Action:
{
  "type": "click",
  "target": "btn-mark-delivered"
}





//GLOBAL UI ACTIONS
User: scroll down
Action:
{
  "type": "scroll",
  "value": "down"
}

User: scroll up
Action:
{
  "type": "scroll",
  "value": "up"
}

User: zoom in
Action:
{
  "type": "zoom",
  "value": "in"
}

User: zoom out
Action:
{
  "type": "zoom",
  "value": "out"
}

User: refresh page
Action:
{
  "type": "refresh"
}







