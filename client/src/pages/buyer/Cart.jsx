import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { orderAPI } from '../../utils/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './Cart.css';

const Cart = () => {
  const { user } = useAuth();
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [checkoutData, setCheckoutData] = useState({
  address: {
    houseNo: '',
    area: '',
    city: '',
    state: '',
    pincode: ''
  },
  paymentMethod: 'cod'
});

  const [locationLoading, setLocationLoading] = useState(false);


  const handleQuantityChange = (productId, newQuantity) => {
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
  };
  const useCurrentLocation = () => {
  if (!navigator.geolocation) {
    setError("Geolocation is not supported by your browser");
    return;
  }

  setLocationLoading(true);
  setError("");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
          {
            headers: {
              "User-Agent": "InclusiKart/1.0"
            }
          }
        );

        const data = await res.json();
        const addr = data.address || {};

        setCheckoutData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            area: addr.suburb || addr.neighbourhood || "",
            city: addr.city || addr.town || addr.village || "",
            state: addr.state || "",
            pincode: addr.postcode || ""
          }
        }));

      } catch (err) {
        setError("Failed to fetch address from location");
      } finally {
        setLocationLoading(false);
      }
    },
    () => {
      setError("Location permission denied");
      setLocationLoading(false);
    }
  );
};



  const handleCheckout = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!user) {
      navigate('/login');
      return;
    }

    const { houseNo, area, city, state, pincode } = checkoutData.address;

if (!houseNo || !city || !state || !pincode) {
  setError("Please complete the delivery address");
  return;
}


    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      console.log('=== STARTING CHECKOUT ===');
      
      // Prepare order items in CORRECT format
      const orderItems = cartItems.map(item => {
        // Make sure we have product ID
        if (!item.product || !item.product._id) {
          throw new Error('Invalid product in cart');
        }
        
        return {
          product: item.product._id,  // MUST be product ID string
          quantity: item.quantity || 1
        };
      });

      console.log('Order items:', orderItems);

      const orderData = {
        items: orderItems,
      deliveryAddress: checkoutData.address,
        paymentMethod: checkoutData.paymentMethod
      };

      console.log('Sending order data:', orderData);

      // Make API call
      const response = await orderAPI.post('/', orderData);
      
      console.log('✅ Order API Response:', response.data);

      if (response.data.status === 'success') {
        // 1. Show success message
        setSuccessMessage(`🎉 Order placed successfully! Order #${response.data.data.order.orderNumber}`);
        
        // 2. Clear cart
        clearCart();
        
        // 3. Reset form
        setCheckoutData({
          deliveryAddress: '',
          paymentMethod: 'cod'
        });
        
        // 4. Redirect after 3 seconds
        setTimeout(() => {
          navigate('/buyer/orders', {
            state: {
              message: 'Order placed successfully!',
              orderNumber: response.data.data.order.orderNumber,
              success: true
            }
          });
        }, 3000);
        
      } else {
        setError(response.data.message || 'Failed to place order');
      }
      
    } catch (error) {
      console.error('❌ Order placement error:', error);
      
      // Show user-friendly error message
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setError(errorData.errors[0]);
        } else if (errorData.message) {
          setError(errorData.message);
        } else {
          setError('Failed to place order. Please try again.');
        }
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="cart-container">
        <div className="login-required">
          <h2>Please Login</h2>
          <p>You need to be logged in to view your cart.</p>
          <Link to="/login" className="btn primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  // Show empty cart
  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <h2>Your Cart is Empty</h2>
          <p>Discover amazing products from specially challenged artisans.</p>
          <Link to="/shop" className="btn primary">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>🛒 Shopping Cart</h1>
        <p>{cartItems.length} items in your cart</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message-alert">
          <div className="success-icon">✓</div>
          <div className="success-content">
            <strong>Success!</strong>
            <p>{successMessage}</p>
            <small>Redirecting to orders page...</small>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message-alert">
          <div className="error-icon">✗</div>
          <div className="error-content">
            <strong>Error!</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="cart-content">
        {/* Cart Items */}
        <div className="cart-items-section">
          <div className="cart-items-header">
            <h3>Items in Cart</h3>
            <span className="items-count">{cartItems.length} items</span>
          </div>

          <div className="cart-items-list">
            {cartItems.map((item, index) => (
              <div key={`${item.product._id}-${index}`} className="cart-item">
                <div className="item-image">
                  {item.product.images && item.product.images.length > 0 ? (
                    <img 
                      src={`http://localhost:5000/${item.product.images[0].filePath}`}
                      alt={item.product.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/100x100?text=Product+Image';
                      }}
                    />
                  ) : (
                    <div className="no-image-placeholder">
                      <span>No Image</span>
                    </div>
                  )}
                </div>

                <div className="item-details">
                  <h4 className="item-name">{item.product.name}</h4>
                  <p className="item-seller">
                    By {item.product.seller?.personalDetails?.fullName || item.product.seller?.username || 'Unknown Seller'}
                  </p>
                  <p className="item-price">₹{item.product.price}</p>
                  <p className="item-stock">
                    {item.product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </p>
                </div>

                <div className="item-controls">
                  <div className="quantity-selector">
                    <button
                      type="button"
                      className="quantity-btn minus"
                      onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button
                      type="button"
                      className="quantity-btn plus"
                      onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <div className="item-total-price">
                    ₹{item.product.price * item.quantity}
                  </div>

                  <button
                    type="button"
                    className="remove-item-btn"
                    onClick={() => handleRemoveItem(item.product._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary-section">
          <div className="summary-card">
            <h3>Order Summary</h3>
            
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{cartTotal}</span>
              </div>
              
              <div className="summary-row">
                <span>Shipping</span>
                <span className="free-shipping">FREE</span>
              </div>
              
              <div className="summary-row">
                <span>Tax</span>
                <span>₹0</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total-row">
                <span><strong>Total Amount</strong></span>
                <span className="total-amount">₹{cartTotal}</span>
              </div>
            </div>

            {/* Checkout Form */}
            <form className="checkout-form" onSubmit={handleCheckout}>
              <div className="form-group">
  <label><strong>Delivery Address *</strong></label>

  <button
    type="button"
    onClick={useCurrentLocation}
    className="use-location-btn"
    disabled={locationLoading || loading}
    style={{ marginBottom: "10px" }}
  >
    📍 {locationLoading ? "Fetching location..." : "Use Current Location"}
  </button>

  <input
    type="text"
    placeholder="House No / Flat / Landmark *"
    value={checkoutData.address.houseNo}
    onChange={(e) =>
      setCheckoutData(prev => ({
        ...prev,
        address: { ...prev.address, houseNo: e.target.value }
      }))
    }
    required
  />

  <input
    type="text"
    placeholder="Area / Locality"
    value={checkoutData.address.area}
    onChange={(e) =>
      setCheckoutData(prev => ({
        ...prev,
        address: { ...prev.address, area: e.target.value }
      }))
    }
  />

  <input
    type="text"
    placeholder="City"
    value={checkoutData.address.city}
    readOnly
  />

  <input
    type="text"
    placeholder="State"
    value={checkoutData.address.state}
    readOnly
  />

  <input
    type="text"
    placeholder="Pincode"
    value={checkoutData.address.pincode}
    readOnly
  />

  <small className="form-help">
    You can edit house number and area if needed
  </small>
</div>



              <div className="form-group">
                <label htmlFor="paymentMethod">
                  <strong>Payment Method</strong>
                </label>
                <select
                  id="paymentMethod"
                  value={checkoutData.paymentMethod}
                  onChange={(e) => setCheckoutData(prev => ({
                    ...prev,
                    paymentMethod: e.target.value
                  }))}
                  className="payment-select"
                  disabled={loading}
                >
                  <option value="cod">💰 Cash on Delivery (COD)</option>
                  <option value="card">💳 Credit/Debit Card</option>
                  <option value="upi">📱 UPI</option>
                  <option value="netbanking">🏦 Net Banking</option>
                </select>
              </div>

              <button
                type="submit"
                className="place-order-btn"
                disabled={loading || cartItems.length === 0}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <span className="order-text">Place Your Order</span>
                    <span className="order-total">₹{cartTotal}</span>
                  </>
                )}
              </button>

              <div className="order-terms">
                <p>By placing your order, you agree to our Terms & Conditions and Privacy Policy.</p>
              </div>
            </form>

            {/* Clear Cart Button */}
            <button
              type="button"
              className="clear-cart-btn"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your cart?')) {
                  clearCart();
                  setSuccessMessage('Cart cleared successfully!');
                  setTimeout(() => setSuccessMessage(''), 3000);
                }
              }}
              disabled={loading}
            >
              🗑️ Clear Cart
            </button>

            {/* Continue Shopping */}
            <div className="continue-shopping">
              <Link to="/shop" className="continue-link">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;