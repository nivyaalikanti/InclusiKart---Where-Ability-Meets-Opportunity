import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Message from '../../components/Common/Message';
import './Auth.css';

// Import Material UI icons - REMOVE ONE OF THESE IMPORTS
// KEEP THIS ONE - it's the correct import for Material UI icons
import { Visibility, VisibilityOff } from '@mui/icons-material';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { login, error, setError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState('buyer');

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    setError('');
    setValidationErrors({});
    setSubmitAttempted(false);
  }, [setError]);

  // Real-time validation
  useEffect(() => {
    if (submitAttempted) {
      validateForm();
    }
  }, [formData, submitAttempted]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Clear errors when role changes
    setError('');
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors = {};
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setError('');
    setValidationErrors({});
    
    // Client-side validation
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setLoading(true);

    const loginData = {
      ...formData,
      role: selectedRole
    };

    try {
      const result = await login(loginData.email, loginData.password, selectedRole);
      
      if (result.success) {
        // Redirect based on user role
        const userRole = result.user?.role || selectedRole;
        
        if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else if (userRole === 'seller') {
          navigate('/seller/dashboard');
        } else {
          navigate('/buyer/dashboard');
        }
      } else {
        // If login fails but no error message is set, set a generic one
        if (!error) {
          setError('Invalid credentials. Please check your email and password.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // Handle password visibility toggle - KEEP THIS ONE
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Prevent mouse down event from stealing focus - KEEP THIS ONE
  const handleMouseDownPassword = (e) => {
    e.preventDefault();
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '40px 20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
      }}>
        {/* Header Section */}
        <div style={{
          padding: '40px 40px 25px 40px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'white',
            margin: '0 0 8px 0'
          }}>
            Welcome Back
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            margin: 0
          }}>
            Sign in to your account
          </p>
        </div>

        {/* Form Section */}
        <div style={{
          padding: '30px 40px 40px 40px'
        }}>
          {/* Display error from AuthContext */}
          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33',
              fontSize: '15px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'shake 0.5s ease-in-out'
            }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Role Selection */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ 
              display: 'flex', 
              gap: '10px',
              marginBottom: '25px'
            }}>
              <button
                type="button"
                onClick={() => handleRoleSelect('buyer')} id="role-selector-buyer"
                style={{
                  flex: 1,
                  padding: '14px',
                  border: `2px solid ${selectedRole === 'buyer' ? '#3b82f6' : '#e5e7eb'}`,
                  backgroundColor: selectedRole === 'buyer' ? '#3b82f6' : 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: selectedRole === 'buyer' ? 'white' : '#6b7280',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedRole === 'buyer' ? '0 4px 6px rgba(59, 130, 246, 0.3)' : 'none'
                }}
                onMouseOver={(e) => selectedRole !== 'buyer' && (e.target.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => selectedRole !== 'buyer' && (e.target.style.backgroundColor = 'white')}
              >
                Buyer
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('seller')} id="role-selector-seller"
                style={{
                  flex: 1,
                  padding: '14px',
                  border: `2px solid ${selectedRole === 'seller' ? '#3b82f6' : '#e5e7eb'}`,
                  backgroundColor: selectedRole === 'seller' ? '#3b82f6' : 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: selectedRole === 'seller' ? 'white' : '#6b7280',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedRole === 'seller' ? '0 4px 6px rgba(59, 130, 246, 0.3)' : 'none'
                }}
                onMouseOver={(e) => selectedRole !== 'seller' && (e.target.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => selectedRole !== 'seller' && (e.target.style.backgroundColor = 'white')}
              >
                Seller
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')} id="role-selector-admin"
                style={{
                  flex: 1,
                  padding: '14px',
                  border: `2px solid ${selectedRole === 'admin' ? '#3b82f6' : '#e5e7eb'}`,
                  backgroundColor: selectedRole === 'admin' ? '#3b82f6' : 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: selectedRole === 'admin' ? 'white' : '#6b7280',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedRole === 'admin' ? '0 4px 6px rgba(59, 130, 246, 0.3)' : 'none'
                }}
                onMouseOver={(e) => selectedRole !== 'admin' && (e.target.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => selectedRole !== 'admin' && (e.target.style.backgroundColor = 'white')}
              >
                Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyPress={handleKeyPress}>
              {/* Email Field */}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="email" style={{
                  display: 'block',
                  color: '#374151',
                  fontWeight: '600',
                  marginBottom: '8px',
                  fontSize: '15px'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: `1px solid ${validationErrors.email ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border 0.3s ease',
                    backgroundColor: validationErrors.email ? '#fef2f2' : '#f9fafb'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = validationErrors.email ? '#ef4444' : '#d1d5db'}
                />
                {validationErrors.email && (
                  <p style={{
                    color: '#ef4444',
                    fontSize: '13px',
                    marginTop: '5px',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span>⚠</span> {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field - FIXED: Only ONE toggle button now */}
              <div style={{ marginBottom: '30px', position: 'relative' }}>
                <label htmlFor="password" style={{
                  display: 'block',
                  color: '#374151',
                  fontWeight: '600',
                  marginBottom: '8px',
                  fontSize: '15px'
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      padding: '14px 45px 14px 14px', // Right padding for the icon
                      border: `1px solid ${validationErrors.password ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '15px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border 0.3s ease',
                      backgroundColor: validationErrors.password ? '#fef2f2' : '#f9fafb'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = validationErrors.password ? '#ef4444' : '#d1d5db'}
                  />
                  {/* ONLY ONE TOGGLE BUTTON - USING Material UI Icons */}
                  <button
                    type="button"
                    onClick={handleClickShowPassword} id="password-toggle"
                    onMouseDown={handleMouseDownPassword}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      fontSize: '18px',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '30px',
                      height: '30px',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    tabIndex="-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {/* Using Material UI icons - not emoji */}
                    
                  </button>
                </div>
                {validationErrors.password && (
                  <p style={{
                    color: '#ef4444',
                    fontSize: '13px',
                    marginTop: '5px',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span>⚠</span> {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                id="submit-button"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#60A5FA',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 10px rgba(59, 130, 246, 0.12)',
                  position: 'relative'
                }}
                onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.backgroundColor = '#3B82F6')}
                onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)', e.target.style.backgroundColor = '#60A5FA')}
              >
                {loading ? (
                  <>
                    <span style={{ marginRight: '8px' }}>⏳</span>
                    Signing In...
                  </>
                ) : `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
              </button>

              {/* Forgot Password Link */}
              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <Link to="/forgot-password" id="forgot-password-link" style={{
                  color: '#3B82F6',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Forgot Password?
                </Link>
              </div>
            </form>
          </div>

          {/* Role Description */}
            <div style={{ 
            textAlign: 'center',
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#DBEAFE',
            borderRadius: '8px',
            border: '1px solid #BFDBFE'
          }}>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: 0,
              fontWeight: '500'
            }}>
              {selectedRole === 'buyer' && '👤 Browse and purchase products from talented artisans'}
              {selectedRole === 'seller' && '🛍️ Manage your products, orders, and grow your business'}
              {selectedRole === 'admin' && '⚙️ Manage platform users, verify profiles and products'}
            </p>
          </div>

          {/* Footer Link */}
          <div style={{ 
            textAlign: 'center',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '15px',
              margin: 0
            }}>
              Don't have an account?{' '}
                <Link to="/register" id="create-account-link" style={{
                color: '#3B82F6',
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Add CSS for shake animation */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          
          input:focus {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
          }
          
          input.error {
            animation: shake 0.5s ease-in-out;
          }
        `}
      </style>
    </div>
  );
};

export default Login;