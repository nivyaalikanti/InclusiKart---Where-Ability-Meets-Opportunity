import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderAPI, productAPI, requestAPI } from '../../utils/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalSales: 0,
    pendingRequests: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch products stats
      const productsRes = await productAPI.get('/seller/my-products?limit=5');
      const products = productsRes.data.data.products;
      
      // Fetch orders stats and recent orders
      const ordersRes = await orderAPI.get('/seller/my-orders?limit=5');
      const ordersData = ordersRes.data.data;
      
      // Fetch pending requests
      const requestsRes = await requestAPI.get('/seller/my-requests?status=pending&limit=5');
      const requests = requestsRes.data.data.requests;

      setStats({
        totalProducts: productsRes.data.data.total,
        pendingProducts: products.filter(p => p.status === 'pending').length,
        totalOrders: ordersData.total,
        pendingOrders: ordersData.orders.filter(o => o.status === 'pending').length,
        totalSales: ordersData.statistics?.totalSales || 0,
        pendingRequests: requestsRes.data.data.total
      });

      setRecentOrders(ordersData.orders.slice(0, 5));
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user.profileStatus !== 'verified') {
    return (
      <div className="seller-dashboard">
        <div className="verification-pending">
          <h2>Profile Verification Required</h2>
          <p>Your seller profile is pending verification. Please complete your profile and upload your disability certificate.</p>
          <Link to="/seller/profile-verification" className="btn primary" id="btn-complete-verification">
            Complete Verification
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <h1>Seller Dashboard</h1>
        <p>Welcome back, {user.personalDetails?.fullName || user.username}!</p>
      </div>

      {error && <Message type="error" message={error} />}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
          </div>
          <div className="stat-badge warning">{stats.pendingProducts} pending</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
          <div className="stat-badge warning">{stats.pendingOrders} pending</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>₹{stats.totalSales.toLocaleString()}</h3>
            <p>Total Sales</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📥</div>
          <div className="stat-info">
            <h3>{stats.pendingRequests}</h3>
            <p>Pending Requests</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/seller/products/add" className="action-card" id="action-add-product">
            <div className="action-icon">➕</div>
            <h3>Add New Product</h3>
            <p>List a new product for sale</p>
          </Link>

          <Link to="/seller/products" className="action-card" id="action-manage-products">
            <div className="action-icon">📋</div>
            <h3>Manage Products</h3>
            <p>View and edit your products</p>
          </Link>

          <Link to="/seller/stories/manage" className="action-card" id="action-manage-stories">
            <div className="action-icon">✏️</div>
            <h3>Manage Stories</h3>
            <p>Edit or resubmit your stories for approval</p>
          </Link>

          <Link to="/seller/orders" className="action-card" id="action-view-orders">
            <div className="action-icon">🛒</div>
            <h3>View Orders</h3>
            <p>Manage customer orders</p>
          </Link>

          <Link to="/seller/requests" className="action-card" id="action-customer-requests">
            <div className="action-icon">📥</div>
            <h3>Customer Requests</h3>
            <p>Respond to product requests</p>
          </Link>

          <Link to="/seller/stories/share" className="action-card" id="action-share-story">
            <div className="action-icon">📖</div>
            <h3>Share Story</h3>
            <p>Share your journey</p>
          </Link>

          <Link to="/seller/reports" className="action-card" id="action-sales-reports">
            <div className="action-icon">📊</div>
            <h3>Sales Reports</h3>
            <p>View sales analytics</p>
          </Link>
          <Link to="/seller/help-request" className="action-card" id="action-request-help">
              <div className="action-icon">🆘</div>
              <h3>Request Help</h3>
              <p>Get support from NGOs</p>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="recent-section">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <Link to="/seller/orders" className="view-all" id="link-view-all-orders">View All</Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <p className="no-data">No recent orders</p>
        ) : (
          <div className="orders-list">
            {recentOrders.map(order => (
              <div key={order._id} className="order-item">
                <div className="order-info">
                  <span className="order-id">Order #{order.orderNumber}</span>
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="order-details">
                  <span className="order-total">₹{order.totalAmount}</span>
                  <span className={`order-status ${order.status}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;