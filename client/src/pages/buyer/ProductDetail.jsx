import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, requestAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({
    requestedQuantity: 1,
    message: ''
  });
  const [requestLoading, setRequestLoading] = useState(false);
  
  // Add state for current main image
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.get(`/${id}`);
      setProduct(response.data.data.product);
      setCurrentImageIndex(0); // Reset to first image when product changes
    } catch (error) {
      setError('Product not found');
      console.error('Fetch product error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle thumbnail click
  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    addToCart(product, quantity);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setRequestLoading(true);
      await requestAPI.post('/', {
        productId: product._id,
        ...requestData
      });
      
      setShowRequestModal(false);
      setRequestData({ requestedQuantity: 1, message: '' });
      // Show success message
    } catch (error) {
      setError('Failed to send request');
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Message type="error" message={error} />;
  if (!product) return <Message type="error" message="Product not found" />;

  // Get current main image
  const currentImage = product.images && product.images[currentImageIndex];

  return (
    <div className="product-detail">
      <div className="product-container">
        {/* Product Images */}
        <div className="product-gallery">
          {product.images && product.images.length > 0 ? (
            <div className="main-image">
              <img 
                src={`http://localhost:5000/${currentImage.filePath}`} 
                alt={product.name}
              />
            </div>
          ) : (
            <div className="no-image">No Image Available</div>
          )}
          
          {product.images && product.images.length > 1 && (
            <div className="image-thumbnails">
              {product.images.map((image, index) => (
                <img
                  key={index}
                  src={`http://localhost:5000/${image.filePath}`}
                  alt={`${product.name} ${index + 1}`}
                  className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => handleThumbnailClick(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>
          
          <div className="seller-info">
            <span className="seller-label">Sold by:</span>
            <span className="seller-name">
              {product.seller?.personalDetails?.fullName || product.seller?.username}
            </span>
            {product.seller?.profileStatus === 'verified' && (
              <span className="verified-badge">✓ Verified Seller</span>
            )}
          </div>

          <div className="product-price">₹{product.price}</div>

          <div className="product-meta">
            <div className="meta-item">
              <span className="meta-label">Category:</span>
              <span className="meta-value">{product.category}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Stock:</span>
              <span className={`meta-value ${product.quantity === 0 ? 'out-of-stock' : ''}`}>
                {product.quantity > 0 ? `${product.quantity} available` : 'Out of stock'}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Sales:</span>
              <span className="meta-value">{product.salesCount || 0} sold</span>
            </div>
          </div>

          {product.materialsUsed && product.materialsUsed.length > 0 && (
            <div className="materials-section">
              <h4>Materials Used</h4>
              <div className="materials-list">
                {product.materialsUsed.map((material, index) => (
                  <span key={index} className="material-tag">{material}</span>
                ))}
              </div>
            </div>
          )}

          <div className="product-description">
            <h4>Description</h4>
            <p>{product.description}</p>
          </div>

          {/* Action Buttons */}
          {user && user.role === 'buyer' && (
            <div className="product-actions">
              {product.quantity > 0 ? (
                <>
                  <div className="quantity-selector">
                    <label>Quantity:</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                    >
                      {[...Array(Math.min(product.quantity, 10))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button onClick={handleAddToCart} className="btn primary large">
                    Add to Cart - ₹{product.price * quantity}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowRequestModal(true)}
                  className="btn secondary large"
                >
                  Request This Product
                </button>
              )}
            </div>
          )}

          {!user && (
            <div className="login-prompt">
              <p>Please login to purchase or request this product</p>
              <button 
                onClick={() => navigate('/login')}
                className="btn primary"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Request Product</h3>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleRequestSubmit} className="modal-form">
              <div className="form-group">
                <label>Requested Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={requestData.requestedQuantity}
                  onChange={(e) => setRequestData(prev => ({
                    ...prev,
                    requestedQuantity: parseInt(e.target.value)
                  }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Message to Seller (Optional)</label>
                <textarea
                  value={requestData.message}
                  onChange={(e) => setRequestData(prev => ({
                    ...prev,
                    message: e.target.value
                  }))}
                  placeholder="Tell the seller why you're interested in this product..."
                  rows="4"
                  maxLength="500"
                />
              </div>
              
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="btn secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestLoading}
                  className="btn primary"
                >
                  {requestLoading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;