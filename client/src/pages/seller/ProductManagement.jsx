import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../utils/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './ProductManagement.css';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchProducts();
  }, [filter, pagination.page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.get('/seller/my-products', {
        params: {
          page: pagination.page,
          limit: 10,
          status: filter !== 'all' ? filter : undefined
        }
      });

      const { products, totalPages, currentPage, total } = response.data.data;
      setProducts(products);
      setPagination({
        page: currentPage,
        totalPages,
        total
      });
    } catch (error) {
      setError('Failed to fetch products');
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status) => {
    setFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productAPI.delete(`/${productId}`);
      setProducts(products.filter(p => p._id !== productId));
      // Show success message
    } catch (error) {
      setError('Failed to delete product');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'warning', text: 'Pending Review' },
      approved: { class: 'success', text: 'Approved' },
      rejected: { class: 'error', text: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  if (loading && products.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="product-management">
      <div className="page-header">
        <h1>My Products</h1>
        <Link to="/seller/products/add" className="btn primary" id="btn-add-new-product">
          Add New Product
        </Link>
      </div>

      {error && <Message type="error" message={error} />}

      {/* Filters */}
      <div className="filters">
        <button
          onClick={() => handleStatusFilter('all')}
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          id="filter-all"
        >
          All ({pagination.total})
        </button>
        <button
          onClick={() => handleStatusFilter('pending')}
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          id="filter-pending"
        >
          Pending
        </button>
        <button
          onClick={() => handleStatusFilter('approved')}
          className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
          id="filter-approved"
        >
          Approved
        </button>
        <button
          onClick={() => handleStatusFilter('rejected')}
          className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
          id="filter-rejected"
        >
          Rejected
        </button>
      </div>

      {/* Products Table */}
      {products.length === 0 ? (
        <div className="no-products">
          <h3>No products found</h3>
          <p>
            {filter === 'all' 
              ? "You haven't added any products yet."
              : `No products with ${filter} status.`
            }
          </p>
          <Link to="/seller/products/add" className="btn primary" id="btn-add-first-product">
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Sales</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product,index) => (
                <tr key={product._id}>
                  <td>
                    <div className="product-cell">
                      {product.images && product.images.length > 0 && (
                        <img 
                          src={`http://localhost:5000/${product.images[0].filePath}`} 
                          alt={product.name}
                          className="product-thumb"
                        />
                      )}
                      <div className="product-info">
                        <h4>{product.name}</h4>
                        <p className="product-category">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td>₹{product.price}</td>
                  <td>{product.quantity}</td>
                  <td>{getStatusBadge(product.status)}</td>
                  <td>{product.salesCount || 0}</td>
                  <td>
                    <div className="action-buttons">
                      <Link 
                        to={`/seller/products/edit/${product._id}`}
                        className="btn small secondary"
                        id={`btn-edit-${index + 1}`}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="btn small danger"
                        id={`btn-delete-${index + 1}`}
                        disabled={product.status === 'approved' && product.salesCount > 0}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="pagination-btn"
            id="pagination-prev"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-btn"
            id="pagination-next"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;