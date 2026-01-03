import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderAPI } from '../../utils/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './BuyerDashboard.css';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.get('/my-orders?limit=5');
      const ordersData = response.data.data;
      
      setOrders(ordersData.orders);
      setStats({
        totalOrders: ordersData.total,
        pendingOrders: ordersData.orders.filter(order => order.status === 'pending').length
      });
    } catch (error) {
      setError('Failed to load dashboard data');
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
    <div className="buyer-dashboard">
      <div className="dashboard-header">
        <h1>Buyer Dashboard</h1>
        <p>Welcome back, {user?.username}! Track your orders and shop more.</p>
      </div>

      {error && <Message type="error" message={error} />}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <h3>{stats.totalOrders || 0}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.pendingOrders || 0}</h3>
            <p>Pending Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h3>0</h3>
            <p>Reviews Given</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-info">
            <h3>0</h3>
            <p>Wishlist Items</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/shop" className="action-card">
            <div className="action-icon">🛍️</div>
            <h3>Continue Shopping</h3>
            <p>Discover more handmade products</p>
          </Link>

          <Link to="/buyer/orders" className="action-card">
            <div className="action-icon">📋</div>
            <h3>View All Orders</h3>
            <p>See your complete order history</p>
          </Link>

          <Link to="/buyer/cart" className="action-card">
            <div className="action-icon">🛒</div>
            <h3>View Cart</h3>
            <p>Check your shopping cart</p>
          </Link>

          <Link to="/stories" className="action-card">
            <div className="action-icon">📖</div>
            <h3>Read Stories</h3>
            <p>Discover inspiring seller stories</p>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="recent-section">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <Link to="/buyer/orders" className="view-all">View All</Link>
        </div>
        
        {orders.length === 0 ? (
          <div className="no-orders">
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here.</p>
            <Link to="/shop" className="btn primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-item">
                <div className="order-info">
                  <span className="order-id">Order #{order.orderNumber}</span>
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="order-details">
                  <span className="order-total">₹{order.totalAmount}</span>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;