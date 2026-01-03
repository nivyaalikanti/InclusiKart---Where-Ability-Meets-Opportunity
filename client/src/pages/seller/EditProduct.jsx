import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Message from '../../components/Common/Message';
import FileUpload from '../../components/Common/FileUpload';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import './ProductForm.css';

const EditProduct = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    materialsUsed: '',
    price: '',
    quantity: '',
    category: 'handicraft',
    tags: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'cm'
    },
    weight: {
      value: '',
      unit: 'grams'
    }
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.get(`/${id}`);
      const product = response.data.data.product;
      
      // Check if user owns this product
      if (product.seller._id !== user._id) {
        navigate('/seller/products');
        return;
      }

      setFormData({
        name: product.name,
        description: product.description,
        materialsUsed: product.materialsUsed?.join(', ') || '',
        price: product.price,
        quantity: product.quantity,
        category: product.category,
        tags: product.tags?.join(', ') || '',
        dimensions: product.dimensions || {
          length: '',
          width: '',
          height: '',
          unit: 'cm'
        },
        weight: product.weight || {
          value: '',
          unit: 'grams'
        }
      });

      setExistingImages(product.images || []);
    } catch (error) {
      setError('Failed to fetch product');
      console.error('Fetch product error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('dimensions.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [field]: value
        }
      }));
    } else if (name.startsWith('weight.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        weight: {
          ...prev.weight,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = (files) => {
    setNewImages(files);
  };

  const removeExistingImage = (imageIndex) => {
    setExistingImages(prev => prev.filter((_, index) => index !== imageIndex));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (user.profileStatus !== 'verified') {
      setError('Please complete your profile verification before editing products');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const submitData = new FormData();
      
      // Append basic fields
      Object.keys(formData).forEach(key => {
        if (key === 'dimensions' || key === 'weight') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === 'materialsUsed' || key === 'tags') {
          // Convert comma-separated strings to arrays
          submitData.append(key, formData[key]);
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Append new images
      newImages.forEach(image => {
        submitData.append('productImages', image);
      });

      await productAPI.put(`/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/seller/products', { 
        state: { message: 'Product updated successfully! Waiting for admin re-approval.' } 
      });
      
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update product');
      console.error('Update product error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { value: 'handicraft', label: 'Handicraft' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'home-decor', label: 'Home Decor' },
    { value: 'art', label: 'Art' },
    { value: 'other', label: 'Other' }
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="product-form-container">
      <div className="page-header">
        <h1>Edit Product</h1>
        <p>Update your product information</p>
      </div>

      {user.profileStatus !== 'verified' && (
        <Message 
          type="warning" 
          message="Your profile is not verified yet. Products will be listed after verification." 
        />
      )}

      {error && <Message type="error" message={error} />}

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter product name"
              maxLength="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe your product in detail..."
              rows="4"
              maxLength="1000"
            />
            <small>{formData.description.length}/1000 characters</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="price">Price (₹) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Product Details</h3>
          
          <div className="form-group">
            <label htmlFor="materialsUsed">Materials Used</label>
            <input
              type="text"
              id="materialsUsed"
              name="materialsUsed"
              value={formData.materialsUsed}
              onChange={handleChange}
              placeholder="Wood, Clay, Fabric... (comma separated)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="handmade, eco-friendly, traditional... (comma separated)"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Dimensions (Length)</label>
              <input
                type="number"
                name="dimensions.length"
                value={formData.dimensions.length}
                onChange={handleChange}
                placeholder="Length"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Width</label>
              <input
                type="number"
                name="dimensions.width"
                value={formData.dimensions.width}
                onChange={handleChange}
                placeholder="Width"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Height</label>
              <input
                type="number"
                name="dimensions.height"
                value={formData.dimensions.height}
                onChange={handleChange}
                placeholder="Height"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Unit</label>
              <select
                name="dimensions.unit"
                value={formData.dimensions.unit}
                onChange={handleChange}
              >
                <option value="cm">cm</option>
                <option value="inches">inches</option>
                <option value="mm">mm</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Weight</label>
              <input
                type="number"
                name="weight.value"
                value={formData.weight.value}
                onChange={handleChange}
                placeholder="Weight"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Unit</label>
              <select
                name="weight.unit"
                value={formData.weight.unit}
                onChange={handleChange}
              >
                <option value="grams">grams</option>
                <option value="kg">kg</option>
                <option value="pounds">pounds</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Product Images</h3>
          
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="existing-images">
              <h4>Current Images</h4>
              <div className="images-grid">
                {existingImages.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img 
                      src={`http://localhost:5000/${image.filePath}`}
                      alt={`Product ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="remove-image-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Images */}
          <div className="new-images">
            <h4>Add New Images</h4>
            <FileUpload
              onFilesChange={handleImageUpload}
              accept="image/*"
              multiple
              maxFiles={5}
            />
            <small>Upload up to 5 new images. First image will be used as main image.</small>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/seller/products')}
            className="btn secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || user.profileStatus !== 'verified'}
            className="btn primary"
          >
            {submitting ? 'Updating Product...' : 'Update Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;