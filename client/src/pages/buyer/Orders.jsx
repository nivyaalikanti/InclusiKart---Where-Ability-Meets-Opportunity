import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './Orders.css';

const Orders = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // clear navigation state so message doesn't persist on refresh/back
      navigate(location.pathname, { replace: true, state: {} });
      // auto-hide after 4 seconds
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  }, [location, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.get('/my-orders', {
        params: { status: filter !== 'all' ? filter : undefined }
      });
      setOrders(response.data.data.orders);
    } catch (error) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'warning', text: 'Pending' },
      confirmed: { class: 'info', text: 'Confirmed' },
      processing: { class: 'info', text: 'Processing' },
      shipped: { class: 'success', text: 'Shipped' },
      delivered: { class: 'success', text: 'Delivered' },
      cancelled: { class: 'error', text: 'Cancelled' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>Track your purchases and order history</p>
      </div>

      {error && <Message type="error" message={error} />}
      {successMessage && <Message type="success" message={successMessage} />}

      <div className="orders-filters">
        {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.orderNumber}</h3>
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="order-status">
                  {getStatusBadge(order.status)}
                  <span className="order-total">₹{order.totalAmount}</span>
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-image">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img 
                          src={`http://localhost:5000/${item.product.images[0].filePath}`}
                          alt={item.product.name}
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>
                    <div className="item-details">
                      <h4>{item.product.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                      <p>Price: ₹{item.price} each</p>
                    </div>
                    <div className="item-total">
                      ₹{item.total}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="seller-info">
                  <strong>Seller:</strong> {order.seller?.personalDetails?.fullName}
                </div>
                {order.trackingNumber && (
                  <div className="tracking-info">
                    <strong>Tracking:</strong> {order.trackingNumber}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;