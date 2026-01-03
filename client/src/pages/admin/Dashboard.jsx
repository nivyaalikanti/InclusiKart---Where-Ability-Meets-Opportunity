import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get('/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Admin dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!dashboardData) {
    return <Message type="error" message="Failed to load dashboard" />;
  }

  const { overview, pending, sales, recentActivities } = dashboardData;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and management</p>
      </div>

      {error && <Message type="error" message={error} />}

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card admin">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{overview.totalUsers}</h3>
            <p>Total Users</p>
          </div>
          <div className="stat-details">
            <span>{overview.totalSellers} Sellers</span>
            <span>{overview.totalBuyers} Buyers</span>
          </div>
        </div>

        <div className="stat-card admin">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{overview.totalProducts}</h3>
            <p>Total Products</p>
          </div>
          <div className="stat-badge warning">{pending.products} pending</div>
        </div>

        <div className="stat-card admin">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <h3>{overview.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="stat-card admin">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>₹{sales.total.toLocaleString()}</h3>
            <p>Total Sales</p>
          </div>
          <div className="stat-details">
            <span>{sales.orders} orders</span>
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      <div className="pending-actions">
        <h2>Pending Actions</h2>
        <div className="action-grid">
          <Link to="/admin/verifications" className="action-card admin">
            <div className="action-icon">✅</div>
            <div className="action-content">
              <h3>Seller Verifications</h3>
              <p>{pending.verifications} pending reviews</p>
            </div>
            <div className="action-badge">{pending.verifications}</div>
          </Link>

          <Link to="/admin/products" className="action-card admin">
            <div className="action-icon">📦</div>
            <div className="action-content">
              <h3>Product Approvals</h3>
              <p>{pending.products} pending reviews</p>
            </div>
            <div className="action-badge">{pending.products}</div>
          </Link>

          <Link to="/admin/stories" className="action-card admin">
            <div className="action-icon">📖</div>
            <div className="action-content">
              <h3>Story Approvals</h3>
              <p>{pending.stories} pending reviews</p>
            </div>
            <div className="action-badge">{pending.stories}</div>
          </Link>

          <div className="action-card admin">
            <div className="action-icon">🆘</div>
            <div className="action-content">
              <h3>Support Requests</h3>
              <p>{pending.support} pending requests</p>
            </div>
            <div className="action-badge">{pending.support}</div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="recent-activities">
        <div className="activities-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <Link to="/admin/orders" className="view-all">View All</Link>
          </div>
          
          {recentActivities.orders.length === 0 ? (
            <p className="no-data">No recent orders</p>
          ) : (
            <div className="activities-list">
              {recentActivities.orders.map(order => (
                <div key={order._id} className="activity-item">
                  <div className="activity-info">
                    <span className="activity-title">
                      Order #{order.orderNumber}
                    </span>
                    <span className="activity-desc">
                      {order.buyer?.personalDetails?.fullName} purchased from {order.seller?.personalDetails?.fullName}
                    </span>
                  </div>
                  <div className="activity-meta">
                    <span className="activity-amount">₹{order.totalAmount}</span>
                    <span className={`activity-status ${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="activities-section">
          <div className="section-header">
            <h2>Recent Users</h2>
            <Link to="/admin/users" className="view-all">View All</Link>
          </div>
          
          {recentActivities.users.length === 0 ? (
            <p className="no-data">No recent users</p>
          ) : (
            <div className="activities-list">
              {recentActivities.users.map(user => (
                <div key={user._id} className="activity-item">
                  <div className="activity-info">
                    <span className="activity-title">{user.username}</span>
                    <span className="activity-desc">
                      {user.role} • {user.email}
                    </span>
                  </div>
                  <div className="activity-meta">
                    <span className={`user-status ${user.profileStatus}`}>
                      {user.profileStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="quick-links">
        <h2>Quick Management</h2>
        <div className="links-grid">
          <Link to="/admin/users" className="link-card">
            <span>👥 User Management</span>
          </Link>
          <Link to="/admin/verifications" className="link-card">
            <span>✅ Seller Verifications</span>
          </Link>
          <Link to="/admin/products" className="link-card">
            <span>📦 Product Management</span>
          </Link>
          <Link to="/admin/stories" className="link-card">
            <span>📖 Story Management</span>
          </Link>
          <Link to="/admin/orders" className="link-card">
            <span>🛒 Order Management</span>
          </Link>
          <Link to="/admin/support" className="link-card">
            <span>🆘 Support Requests</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;