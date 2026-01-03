import React, { useState, useEffect } from 'react';
import { adminAPI, productAPI } from '../../utils/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './AdminVerification.css';

const ProductVerification = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get('/products/pending');
      setProducts(response.data.data.products);
    } catch (error) {
      setError('Failed to fetch pending products');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (productId, status) => {
    try {
      await productAPI.patch(`/${productId}/status`, {
        status,
        adminNotes: verificationNotes
      });
      
      setProducts(products.filter(product => product._id !== productId));
      setSelectedProduct(null);
      setVerificationNotes('');
      
    } catch (error) {
      setError('Failed to update product status');
    }
  };

  const openProductDetails = (product) => {
    setSelectedProduct(product);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-verification">
      <div className="page-header">
        <h1>Product Verifications</h1>
        <p>Review and approve product listings</p>
      </div>

      {error && <Message type="error" message={error} />}

      {products.length === 0 ? (
        <div className="no-pending">
          <h3>No pending products</h3>
          <p>All products have been reviewed.</p>
        </div>
      ) : (
        <div className="verification-list">
          {products.map(product => (
            <div key={product._id} className="verification-card">
              <div className="seller-info">
                <h3>{product.name}</h3>
                <p>Seller: {product.seller?.personalDetails?.fullName}</p>
                <p>Category: {product.category}</p>
                <p>Price: ₹{product.price}</p>
                <p>Submitted: {new Date(product.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="verification-actions">
                <button
                  onClick={() => openProductDetails(product)}
                  className="btn secondary"
                >
                  View Details
                </button>
                
                <div className="action-buttons">
                  <button
                    onClick={() => handleVerification(product._id, 'approved')}
                    className="btn success"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleVerification(product._id, 'rejected')}
                    className="btn danger"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Product Details</h2>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="seller-details">
                <h3>Product Information</h3>
                <p><strong>Name:</strong> {selectedProduct.name}</p>
                <p><strong>Description:</strong> {selectedProduct.description}</p>
                <p><strong>Price:</strong> ₹{selectedProduct.price}</p>
                <p><strong>Quantity:</strong> {selectedProduct.quantity}</p>
                <p><strong>Category:</strong> {selectedProduct.category}</p>
                <p><strong>Materials:</strong> {selectedProduct.materialsUsed?.join(', ') || 'Not specified'}</p>
                
                <h3>Seller Information</h3>
                <p><strong>Name:</strong> {selectedProduct.seller?.personalDetails?.fullName}</p>
                <p><strong>Username:</strong> {selectedProduct.seller?.username}</p>
                <p><strong>Email:</strong> {selectedProduct.seller?.email}</p>

                <h3>Product Images</h3>
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <div className="certificate-preview">
                    {selectedProduct.images.map((image, index) => (
                      <img 
                        key={index}
                        src={`http://localhost:5000/${image.filePath}`}
                        alt={`Product ${index + 1}`}
                        className="certificate-image"
                      />
                    ))}
                  </div>
                ) : (
                  <p>No images uploaded</p>
                )}

                <div className="verification-notes">
                  <label>Verification Notes:</label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add notes about this verification..."
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => handleVerification(selectedProduct._id, 'approved')}
                className="btn success"
              >
                Approve Product
              </button>
              <button
                onClick={() => handleVerification(selectedProduct._id, 'rejected')}
                className="btn danger"
              >
                Reject Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVerification;