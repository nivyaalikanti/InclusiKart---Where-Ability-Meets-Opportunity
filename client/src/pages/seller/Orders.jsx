import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderAPI } from '../../utils/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './SellerOrders.css';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const location = useLocation();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  }, [location, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.get('/seller/my-orders', {
        params: { status: filter !== 'all' ? filter : undefined }
      });
      setOrders(response.data.data.orders);
      setStats(response.data.data.statistics || {});
    } catch (error) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.patch(`/seller/${orderId}/status`, { status: newStatus });
      fetchOrders(); // Refresh orders
    } catch (error) {
      setError('Failed to update order status');
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
    <div className="seller-orders">
      <div className="page-header">
        <h1>Order Management</h1>
        <div className="order-stats">
          <div className="stat">
            <span className="stat-value">{stats.totalOrders || 0}</span>
            <span className="stat-label">Total Orders</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.pendingOrders || 0}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat">
            <span className="stat-value">₹{stats.totalSales || 0}</span>
            <span className="stat-label">Total Sales</span>
          </div>
        </div>
      </div>

      {error && <Message type="error" message={error} />}
      {successMessage && <Message type="success" message={successMessage} />}

      <div className="orders-filters">
        {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            id={`order-filter-${status}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <h3>No orders found</h3>
          <p>You don't have any orders matching this filter.</p>
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
                  <span className="buyer-info">
                    Customer: {order.buyer?.personalDetails?.fullName}
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

              <div className="order-actions">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order._id, 'confirmed')}
                      className="btn primary small"
                      id="btn-confirm-order"
                    >
                      Confirm Order
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order._id, 'cancelled')}
                      className="btn danger small"
                      id="btn-cancel-order"
                    >
                      Cancel Order
                    </button>
                  </>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'shipped')}
                    className="btn primary small"
                    id="btn-mark-shipped"
                  >
                    Mark as Shipped
                  </button>
                )}
                {order.status === 'shipped' && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'delivered')}
                    className="btn success small"
                    id="btn-mark-delivered"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>

              {order.trackingNumber && (
                <div className="tracking-info">
                  <strong>Tracking Number:</strong> {order.trackingNumber}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;