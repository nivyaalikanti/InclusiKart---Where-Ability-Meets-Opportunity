const express = require('express');
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getSellerOrders,
  getBuyerOrders,
  cancelOrder
} = require('../controllers/orderController');
const { auth, sellerAuth, buyerAuth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Error handling middleware
const handleAsyncErrors = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Buyer routes
router.post('/', auth, buyerAuth, handleAsyncErrors(createOrder));
router.get('/my-orders', auth, buyerAuth, handleAsyncErrors(getBuyerOrders));
router.get('/buyer/:id', auth, buyerAuth, handleAsyncErrors(getOrder));
router.patch('/buyer/:id/cancel', auth, buyerAuth, handleAsyncErrors(cancelOrder));

// Seller routes
router.get('/seller/my-orders', auth, sellerAuth, handleAsyncErrors(getSellerOrders));
router.get('/seller/:id', auth, sellerAuth, handleAsyncErrors(getOrder));
router.patch('/seller/:id/status', auth, sellerAuth, handleAsyncErrors(updateOrderStatus));

// Admin routes
router.get('/', auth, adminAuth, handleAsyncErrors(getOrders));
router.get('/admin/:id', auth, adminAuth, handleAsyncErrors(getOrder));
router.patch('/admin/:id/status', auth, adminAuth, handleAsyncErrors(updateOrderStatus));

// Error handling for the router
router.use((err, req, res, next) => {
  console.error('Order Route Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

module.exports = router;