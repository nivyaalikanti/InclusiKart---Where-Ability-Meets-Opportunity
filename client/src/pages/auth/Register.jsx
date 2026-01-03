import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Message from '../../components/Common/Message';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
    personalDetails: {
      fullName: '',
      dateOfBirth: '',
      address: '',
      disabilityType: '',
      phoneNumber: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, error, setError } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Disability type options
  const disabilityTypes = [
    'Visual Impairment',
    'Hearing Impairment',
    'Mobility Impairment',
    'Cognitive Disability',
    'Speech & Language Disability',
    'Mental Health Condition',
    'Intellectual Disability',
    'Multiple Disabilities',
    'Not Specified'
  ];

  useEffect(() => {
    setError('');
  }, [setError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('personalDetails.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        personalDetails: {
          ...formData.personalDetails,
          [field]: value
        }
      });
      // clear field error
      setErrors((prev) => ({ ...prev, [field]: '' }));
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.username || formData.username.trim().length < 3) {
      errs.username = 'Username must be at least 3 characters';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errs.email = 'Enter a valid email address';
    }
    const pwd = formData.password || '';
    if (pwd.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    } else {
      // example strength: require a number
      const strongRegex = /(?=.*\d)/;
      if (!strongRegex.test(pwd)) {
        errs.password = 'Password should include at least one number';
      }
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'seller') {
      if (!formData.personalDetails.fullName) errs.fullName = 'Full name is required';
      if (!formData.personalDetails.phoneNumber) errs.phoneNumber = 'Phone is required';
      if (!formData.personalDetails.address) errs.address = 'Address is required';
      if (!formData.personalDetails.disabilityType) errs.disabilityType = 'Select a disability type';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError('Please fix the errors in the form');
      setLoading(false);
      return;
    }

    const submitData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      ...(formData.role === 'seller' && {
        personalDetails: formData.personalDetails
      })
    };

    const result = await register(submitData);
    
    if (result.success) {
      navigate('/');
    }
    
    setLoading(false);
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
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        overflow: 'hidden'
      }}>
        {/* Header Section */}
        <div style={{
          padding: '40px 40px 20px 40px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#3b82f6',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            
          </div>

          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            Join InclusiKart
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '14px',
            margin: 0
          }}>
            Create your account and start your journey
          </p>
        </div>

        {/* Form Section */}
        <div style={{
          padding: '0 40px 40px 40px'
        }}>
          {error && <Message type="error" message={error} />}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="username" style={{
                display: 'block',
                color: '#374151',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Choose a username"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              {errors.username && (
                <div style={{ color: '#b91c1c', fontSize: '13px', marginTop: '6px' }}>{errors.username}</div>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{
                display: 'block',
                color: '#374151',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
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
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              {errors.email && (
                <div style={{ color: '#b91c1c', fontSize: '13px', marginTop: '6px' }}>{errors.email}</div>
              )}
            </div>

            {/* Role Selection */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                color: '#374151',
                fontWeight: '500',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                I want to:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button" id="role-buyer"
                  onClick={() => setFormData({...formData, role: 'buyer'})}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: `1px solid ${formData.role === 'buyer' ? '#3b82f6' : '#d1d5db'}`,
                    backgroundColor: formData.role === 'buyer' ? '#eff6ff' : 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    color: formData.role === 'buyer' ? '#3b82f6' : '#4b5563',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  Shop and Buy
                </button>
                <button
                  type="button" id="role-seller"
                  onClick={() => setFormData({...formData, role: 'seller'})}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: `1px solid ${formData.role === 'seller' ? '#3b82f6' : '#d1d5db'}`,
                    backgroundColor: formData.role === 'seller' ? '#eff6ff' : 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    color: formData.role === 'seller' ? '#3b82f6' : '#4b5563',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  Sell Products
                </button>
              </div>
            </div>

            {/* Seller Information Section */}
            {formData.role === 'seller' && (
              <div style={{
                marginBottom: '30px',
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  Select Information
                </h4>

                {/* Full Name */}
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="fullName" style={{
                    display: 'block',
                    color: '#374151',
                    fontWeight: '500',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Your full name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="personalDetails.fullName"
                    value={formData.personalDetails.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                  {errors.fullName && (
                    <div style={{ color: '#b91c1c', fontSize: '13px', marginTop: '6px' }}>{errors.fullName}</div>
                  )}
                </div>

                {/* Date of Birth */}
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="dateOfBirth" style={{
                    display: 'block',
                    color: '#374151',
                    fontWeight: '500',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="personalDetails.dateOfBirth"
                    value={formData.personalDetails.dateOfBirth}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Disability Type Dropdown */}
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="disabilityType" style={{
                    display: 'block',
                    color: '#374151',
                    fontWeight: '500',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Disability Type
                  </label>
                  <select
                    id="disabilityType"
                    name="personalDetails.disabilityType"
                    value={formData.personalDetails.disabilityType}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select disability type</option>
                    {disabilityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.disabilityType && (
                    <div style={{ color: '#b91c1c', fontSize: '13px', marginTop: '6px' }}>{errors.disabilityType}</div>
                  )}
                </div>

                {/* Phone Number */}
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="phoneNumber" style={{
                    display: 'block',
                    color: '#374151',
                    fontWeight: '500',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="personalDetails.phoneNumber"
                    value={formData.personalDetails.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                  {errors.phoneNumber && (
                    <div style={{ color: '#b91c1c', fontSize: '13px', marginTop: '6px' }}>{errors.phoneNumber}</div>
                  )}
                </div>

                {/* Address */}
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="address" style={{
                    display: 'block',
                    color: '#374151',
                    fontWeight: '500',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="personalDetails.address"
                    value={formData.personalDetails.address}
                    onChange={handleChange}
                    required
                    placeholder="Your complete address"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                  {errors.address && (
                    <div style={{ color: '#b91c1c', fontSize: '13px', marginTop: '6px' }}>{errors.address}</div>
                  )}
                </div>
              </div>
            )}

            {/* Password */}
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="password" style={{
                display: 'block',
                color: '#374151',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
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
                  placeholder="Create a password"
                  minLength="6"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 12px',
                    border: `1px solid ${errors.password ? '#fca5a5' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
                <button
                  type="button" id="password-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-7 1.1-2.43 2.89-4.34 5.06-5.53"/><path d="M1 1l22 22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.05 12C2.73 7 7 4 12 4s9.27 3 10.95 8c-1.68 5-6.95 8-10.95 8s-9.27-3-10.95-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <div style={{ color: '#b91c1c', fontSize: '13px', marginTop: '6px' }}>{errors.password}</div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '30px' }}>
              <label htmlFor="confirmPassword" style={{
                display: 'block',
                color: '#374151',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                  minLength="6"
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 12px',
                    border: `1px solid ${errors.confirmPassword ? '#fca5a5' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
                <button
                  type="button" id="confirm-password-toggle"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer'
                  }}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-7 1.1-2.43 2.89-4.34 5.06-5.53"/><path d="M1 1l22 22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.05 12C2.73 7 7 4 12 4s9.27 3 10.95 8c-1.68 5-6.95 8-10.95 8s-9.27-3-10.95-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <div style={{ color: '#b91c1c', fontSize: '13px', marginTop: '6px' }}>{errors.confirmPassword}</div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" id="submit-button"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#3b82f6')}
            >
              {loading ? 'Creating Account...' : `Create Account as ${formData.role}`}
            </button>
          </form>

          {/* Footer Link */}
          <div style={{ 
            textAlign: 'center',
            marginTop: '25px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: 0
            }}>
              Already have an account?{' '}
              <Link to="/login"id="login-link" style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: '500'
              }}>
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;