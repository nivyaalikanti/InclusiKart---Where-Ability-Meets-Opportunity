const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name images price quantity');

    if (!cart) {
      return res.json({
        status: 'success',
        data: {
          cart: {
            items: [],
            totalItems: 0,
            totalPrice: 0
          }
        }
      });
    }

    // Filter out products that are no longer available
    const validItems = cart.items.filter(item => 
      item.product && item.product.quantity > 0
    );

    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.json({
      status: 'success',
      data: { cart }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching cart'
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findOne({
      _id: productId,
      status: 'approved',
      quantity: { $gt: 0 }
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not available'
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: []
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (newQuantity > product.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Only ${product.quantity} items available`
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      if (quantity > product.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Only ${product.quantity} items available`
        });
      }

      cart.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name images price quantity');

    res.json({
      status: 'success',
      message: 'Item added to cart',
      data: { cart }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while adding to cart'
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const product = await Product.findOne({
      _id: productId,
      status: 'approved'
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not available'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found in cart'
      });
    }

    if (quantity > product.quantity) {
      return res.status(400).json({
        status: 'error',
        message: `Only ${product.quantity} items available`
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product', 'name images price quantity');

    res.json({
      status: 'success',
      message: 'Cart updated',
      data: { cart }
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating cart'
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.product', 'name images price quantity');

    res.json({
      status: 'success',
      message: 'Item removed from cart',
      data: { cart }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while removing from cart'
    });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      status: 'success',
      message: 'Cart cleared',
      data: { cart }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while clearing cart'
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};