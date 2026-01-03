const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');

// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Create order
const createOrder = async (req, res) => {
  console.log('=== CREATING ORDER ===');
  console.log('User ID:', req.user._id);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { items, deliveryAddress, paymentMethod } = req.body;
    const buyerId = req.user._id;

    // Validation
    if (!items || !items.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Order must contain at least one item'
      });
    }

    // Accept deliveryAddress as either a string or an object from frontend
    if (!deliveryAddress || (typeof deliveryAddress === 'string' && !deliveryAddress.trim()) ) {
      return res.status(400).json({
        status: 'error',
        message: 'Delivery address is required'
      });
    }

    let totalAmount = 0;
    const orderItems = [];
    let sellerId = null;
    const processedProducts = [];

    // STEP 1: Validate all products first
    console.log('Validating products...');
    for (const item of items) {
      console.log('Processing item:', item);
      
      // Use correct field name - server expects 'product' as ObjectId string
      const productId = item.product || item.productId;
      
      if (!productId) {
        return res.status(400).json({
          status: 'error',
          message: 'Product ID is required for each item'
        });
      }

      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: `Product not found: ${productId}`
        });
      }

      if (product.status !== 'approved') {
        return res.status(400).json({
          status: 'error',
          message: `Product "${product.name}" is not available for purchase (Status: ${product.status})`
        });
      }

      if (product.quantity < (item.quantity || 1)) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient quantity for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity || 1}`
        });
      }

      // Check if all products are from same seller
      if (sellerId === null) {
        sellerId = product.seller.toString();
      } else if (product.seller.toString() !== sellerId) {
        return res.status(400).json({
          status: 'error',
          message: 'All products must be from the same seller'
        });
      }

      const itemQuantity = item.quantity || 1;
      const itemTotal = product.price * itemQuantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: itemQuantity,
        price: product.price,
        total: itemTotal
      });

      processedProducts.push({
        productId: product._id,
        quantity: itemQuantity,
        originalQuantity: product.quantity
      });
    }

    console.log('Total amount:', totalAmount);
    console.log('Seller ID:', sellerId);
    console.log('Processed products:', processedProducts);

    // STEP 2: Generate order number FIRST
    const orderNumber = generateOrderNumber();
    console.log('Generated order number:', orderNumber);

    // STEP 3: Create order with proper deliveryAddress object
    console.log('Creating order...');
    // Normalize deliveryAddress into the shape expected by Order model
    let normalizedAddress = {};
    if (typeof deliveryAddress === 'string') {
      normalizedAddress = {
        fullName: req.user.personalDetails?.fullName || req.user.username || 'Customer',
        street: deliveryAddress,
        city: req.user.personalDetails?.city || '',
        state: req.user.personalDetails?.state || '',
        zipCode: req.user.personalDetails?.zipCode || '',
        country: req.user.personalDetails?.country || 'India',
        phoneNumber: req.user.personalDetails?.phoneNumber || ''
      };
    } else if (typeof deliveryAddress === 'object') {
      // Frontend sends structured address like { houseNo, area, city, state, pincode }
      const { houseNo, area, city, state, pincode, fullName, phoneNumber } = deliveryAddress;
      const streetParts = [];
      if (houseNo) streetParts.push(houseNo);
      if (area) streetParts.push(area);
      const street = streetParts.join(', ');

      normalizedAddress = {
        fullName: fullName || req.user.personalDetails?.fullName || req.user.username || 'Customer',
        street: street || '',
        city: city || req.user.personalDetails?.city || '',
        state: state || req.user.personalDetails?.state || '',
        zipCode: pincode || req.user.personalDetails?.zipCode || '',
        country: req.user.personalDetails?.country || 'India',
        phoneNumber: phoneNumber || req.user.personalDetails?.phoneNumber || ''
      };
    }

    const orderPayload = {
      orderNumber: orderNumber, // ADD THIS - it's required
      buyer: buyerId,
      seller: sellerId,
      items: orderItems,
      totalAmount,
      deliveryAddress: normalizedAddress,
      paymentMethod: paymentMethod || 'cod',
      status: 'pending',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed'
    };

    console.log('Order payload:', orderPayload);

    // Create the order
    const order = new Order(orderPayload);
    await order.save(); // Use save() instead of create() to trigger pre-save hooks
    
    console.log('Order created:', order._id);

    // STEP 4: Update product quantities
    console.log('Updating product quantities...');
    for (const item of processedProducts) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { 
            quantity: -item.quantity,
            salesCount: item.quantity 
          }
        }
      );
      console.log(`Updated product ${item.productId}: -${item.quantity} quantity`);
    }

    // STEP 5: Clear user's cart
    console.log('Clearing cart...');
    await Cart.findOneAndUpdate(
      { user: buyerId },
      { 
        items: [], 
        totalItems: 0, 
        totalPrice: 0,
        lastUpdated: Date.now()
      }
    );

    // STEP 6: Populate and return order
    console.log('Populating order details...');
    const populatedOrder = await Order.findById(order._id)
      .populate('buyer', 'username personalDetails.fullName email')
      .populate('seller', 'username personalDetails.fullName email')
      .populate('items.product', 'name images price');

    console.log('Order populated:', populatedOrder.orderNumber);

    // STEP 7: Create notifications
    try {
      const notifications = [];
      
      // Seller notification
      if (populatedOrder.seller) {
        notifications.push({
          user: populatedOrder.seller._id,
          type: 'order',
          title: 'New Order Received',
          message: `You have received a new order ${populatedOrder.orderNumber} from ${populatedOrder.buyer?.username || populatedOrder.buyer?.personalDetails?.fullName || 'a customer'}`,
          meta: { 
            orderId: populatedOrder._id, 
            orderNumber: populatedOrder.orderNumber 
          }
        });
      }

      // Buyer notification
      if (populatedOrder.buyer) {
        notifications.push({
          user: populatedOrder.buyer._id,
          type: 'order',
          title: 'Order Placed Successfully',
          message: `Your order ${populatedOrder.orderNumber} has been placed successfully. Total: ₹${populatedOrder.totalAmount}`,
          meta: { 
            orderId: populatedOrder._id, 
            orderNumber: populatedOrder.orderNumber 
          }
        });
      }

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log('Notifications created successfully');
      }
    } catch (notifErr) {
      console.warn('Failed to create notifications (order still successful):', notifErr.message);
      // Don't fail the order if notifications fail
    }

    console.log('=== ORDER CREATED SUCCESSFULLY ===');
    console.log('Order Number:', populatedOrder.orderNumber);
    console.log('Total:', populatedOrder.totalAmount);

    res.status(201).json({
      status: 'success',
      message: 'Order placed successfully!',
      data: {
        order: populatedOrder
      }
    });

  } catch (error) {
    console.error('=== ORDER CREATION FAILED ===');
    console.error('Error:', error.message);
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    
    // Handle specific errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', errors);
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Duplicate order detected. Please try again.'
      });
    }
    
    // Generic server error
    res.status(500).json({
      status: 'error',
      message: 'Failed to create order. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Keep all other functions the same...
// [REST OF THE CODE REMAINS UNCHANGED]

// Get orders (admin) - KEEP EXISTING
const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, seller, buyer } = req.query;
    
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (seller) filter.seller = seller;
    if (buyer) filter.buyer = buyer;

    const orders = await Order.find(filter)
      .populate('buyer', 'username personalDetails.fullName email')
      .populate('seller', 'username personalDetails.fullName email')
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        orders,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders'
    });
  }
};

// Get single order - KEEP EXISTING
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'username personalDetails.fullName email')
      .populate('seller', 'username personalDetails.fullName email')
      .populate('items.product', 'name images price description');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check access rights
    if (req.user.role === 'buyer' && order.buyer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this order'
      });
    }

    if (req.user.role === 'seller' && order.seller._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this order'
      });
    }

    res.json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order'
    });
  }
};

// Update order status - KEEP EXISTING
const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, shippingCarrier, notes } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if seller owns this order
    if (req.user.role === 'seller' && order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this order'
      });
    }

    // Update order
    const updateData = { status };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (shippingCarrier) updateData.shippingCarrier = shippingCarrier;
    if (notes) updateData.notes = notes;
    
    if (status === 'delivered') {
      updateData.actualDelivery = new Date();
      updateData.paymentStatus = 'completed';
    }
    
    if (status === 'cancelled') {
      updateData.cancellationDate = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    .populate('buyer', 'username personalDetails.fullName email')
    .populate('seller', 'username personalDetails.fullName email')
    .populate('items.product', 'name images price');

    res.json({
      status: 'success',
      message: `Order status updated to ${status}`,
      data: {
        order: updatedOrder
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order status'
    });
  }
};

// Get seller orders - KEEP EXISTING
const getSellerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { seller: req.user._id };
    if (status && status !== 'all') filter.status = status;

    const orders = await Order.find(filter)
      .populate('buyer', 'username personalDetails.fullName email')
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(filter);

    // Calculate sales statistics
    const totalSales = await Order.aggregate([
      { $match: { seller: req.user._id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      status: 'success',
      data: {
        orders,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        statistics: {
          totalSales: totalSales[0]?.total || 0,
          totalOrders: total,
          pendingOrders: await Order.countDocuments({ 
            seller: req.user._id, 
            status: 'pending' 
          })
        }
      }
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch seller orders'
    });
  }
};

// Get buyer orders - KEEP EXISTING
const getBuyerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { buyer: req.user._id };
    if (status && status !== 'all') filter.status = status;

    const orders = await Order.find(filter)
      .populate('seller', 'username personalDetails.fullName email')
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        orders,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get buyer orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch buyer orders'
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getSellerOrders,
  getBuyerOrders
};