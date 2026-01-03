import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../utils/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './Reports.css';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.get('/seller/my-orders');
      const orders = response.data.data.orders;
      
      // Calculate report data
      const totalSales = orders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + order.totalAmount, 0);

      const totalOrders = orders.length;
      const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
      
      // Calculate monthly sales
      const monthlySales = calculateMonthlySales(orders);
      
      // Calculate popular products
      const popularProducts = calculatePopularProducts(orders);

      setReportData({
        totalSales,
        totalOrders,
        deliveredOrders,
        monthlySales,
        popularProducts
      });
    } catch (error) {
      setError('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlySales = (orders) => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      const monthSales = orders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === date.getMonth() && 
                 orderDate.getFullYear() === date.getFullYear() &&
                 order.status === 'delivered';
        })
        .reduce((sum, order) => sum + order.totalAmount, 0);
      
      months.push({
        name: `${monthName} ${year}`,
        sales: monthSales
      });
    }
    
    return months;
  };

  const calculatePopularProducts = (orders) => {
    const productSales = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.product._id]) {
          productSales[item.product._id] = {
            product: item.product,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.product._id].quantity += item.quantity;
        productSales[item.product._id].revenue += item.total;
      });
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Sales Reports</h1>
        <div className="time-filter">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="filter-select"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {error && <Message type="error" message={error} />}

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h3>₹{reportData.totalSales.toLocaleString()}</h3>
                <p>Total Sales</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="card-icon">📦</div>
              <div className="card-content">
                <h3>{reportData.totalOrders}</h3>
                <p>Total Orders</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <h3>{reportData.deliveredOrders}</h3>
                <p>Delivered Orders</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <h3>
                  {reportData.totalOrders > 0 
                    ? Math.round((reportData.deliveredOrders / reportData.totalOrders) * 100)
                    : 0
                  }%
                </h3>
                <p>Completion Rate</p>
              </div>
            </div>
          </div>

          {/* Monthly Sales Chart */}
          <div className="chart-section">
            <h2>Monthly Sales</h2>
            <div className="sales-chart">
              {reportData.monthlySales.map((month, index) => (
                <div key={index} className="chart-bar">
                  <div 
                    className="bar-fill"
                    style={{ 
                      height: `${Math.max((month.sales / Math.max(...reportData.monthlySales.map(m => m.sales))) * 100, 5)}%` 
                    }}
                  ></div>
                  <span className="bar-label">₹{month.sales}</span>
                  <span className="bar-month">{month.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Products */}
          <div className="popular-products">
            <h2>Top Selling Products</h2>
            {reportData.popularProducts.length === 0 ? (
              <p className="no-data">No sales data available</p>
            ) : (
              <div className="products-list">
                {reportData.popularProducts.map((item, index) => (
                  <div key={item.product._id} className="product-item">
                    <div className="product-rank">#{index + 1}</div>
                    <div className="product-image">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img 
                          src={`http://localhost:5000/${item.product.images[0].filePath}`}
                          alt={item.product.name}
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>
                    <div className="product-info">
                      <h4>{item.product.name}</h4>
                      <p>Sold: {item.quantity} units</p>
                    </div>
                    <div className="product-revenue">
                      <strong>₹{item.revenue}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;