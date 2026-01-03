import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../utils/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './Shop.css';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchProducts();
  }, [filters, pagination.page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 12,
        ...filters
      };

      const response = await productAPI.get('/', { params });
      const { products, totalPages, currentPage, total } = response.data.data;
      
      setProducts(products);
      setPagination(prev => ({
        ...prev,
        totalPages,
        currentPage,
        total
      }));
    } catch (error) {
      setError('Failed to fetch products');
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  // Generate placeholder images based on product category
  const getPlaceholderImage = (product) => {
    const category = product.category?.toLowerCase() || 'handicraft';
    const placeholders = {
      handicraft: 'https://via.placeholder.com/300x300/4A90E2/FFFFFF?text=Handicraft',
      clothing: 'https://via.placeholder.com/300x300/50E3C2/FFFFFF?text=Clothing',
      accessories: 'https://via.placeholder.com/300x300/B8E986/FFFFFF?text=Accessories',
      'home-decor': 'https://via.placeholder.com/300x300/BD10E0/FFFFFF?text=Home+Decor',
      art: 'https://via.placeholder.com/300x300/9013FE/FFFFFF?text=Art',
      other: 'https://via.placeholder.com/300x300/417505/FFFFFF?text=Product'
    };
    
    return placeholders[category] || placeholders.other;
  };

  const getProductImage = (product) => {
    if (!product.images || product.images.length === 0) {
      return (
        <img 
          src={getPlaceholderImage(product)} 
          alt={product.name}
          className="product-image-fallback"
        />
      );
    }

    const firstImage = product.images[0];
    
    // Try multiple URL patterns
    let imageUrl = '';
    
    if (typeof firstImage === 'object' && firstImage.filePath) {
      // Try different URL constructions
      const fileName = firstImage.filePath.split('\\').pop();
      imageUrl = `http://localhost:5000/uploads/products/${fileName}`;
    } else if (typeof firstImage === 'string') {
      imageUrl = `http://localhost:5000/uploads/products/${firstImage}`;
    }

    console.log('Attempting to load image from:', imageUrl);

    return (
      <img
        src={imageUrl}
        alt={product.name}
        className="product-image-img"
        onError={(e) => {
          console.log('Image failed to load, using placeholder');
          e.target.src = getPlaceholderImage(product);
        }}
        onLoad={() => {
          console.log('Image loaded successfully from:', imageUrl);
        }}
      />
    );
  };

  if (loading && products.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="shop-container">
      <div className="shop-header">
        <h1>Discover Handcrafted Products</h1>
        <p>Support specially challenged artisans by purchasing their unique creations</p>
      </div>

      {/* Debug Info */}
      

      {/* Filters */}
      <div className="shop-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
            id="shop-search-input"
          />
          <button type="submit" className="search-btn" id="shop-search-btn">Search</button>
        </form>

        <div className="filter-controls">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
            id="filter-category"
          >
            <option value="">All Categories</option>
            <option value="handicraft">Handicraft</option>
            <option value="clothing">Clothing</option>
            <option value="accessories">Accessories</option>
            <option value="home-decor">Home Decor</option>
            <option value="art">Art</option>
            <option value="other">Other</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="filter-select"
            id="filter-sort"
          >
            <option value="createdAt">Newest</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {error && <Message type="error" message={error} />}

      {/* Products Grid */}
      {products.length === 0 && !loading ? (
        <div className="no-products">
          <h3>No products found</h3>
          <p>Try adjusting your search filters</p>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {products.map((product,index) => (
              <div key={product._id} className="product-card">
                <Link to={`/product/${product._id}`} className="product-link" id={`product-card-${index + 1}`} >
                  <div className="product-image">
                    {getProductImage(product)}
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-seller">
                      By {product.seller?.personalDetails?.fullName || product.seller?.username || 'Unknown Seller'}
                    </p>
                    <p className="product-description">
                      {product.description && product.description.length > 100 
                        ? `${product.description.substring(0, 100)}...` 
                        : product.description || 'No description available'
                      }
                    </p>
                    <div className="product-meta">
                      <span className="product-price">₹{product.price}</span>
                      <span className={`product-stock ${product.quantity === 0 ? 'out-of-stock' : ''}`}>
                        {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="pagination-btn"
                id="shop-pagination-prev"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="pagination-btn"
                id="shop-pagination-next"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Shop;