import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, authAPI } from '../../utils/api';
import Message from '../../components/Common/Message';
import FileUpload from '../../components/Common/FileUpload';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import './ProfileVerification.css';

const ProfileVerification = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
  // Check what user endpoints work
  const testEndpoints = async () => {
    try {
      const response = await userAPI.get('');
      console.log('GET /api/users works:', response.data);
    } catch (err) {
      console.log('GET /api/users failed:', err.response?.status);
    }
  };
  testEndpoints();
}, []);
  const [formData, setFormData] = useState({
    personalDetails: {
      fullName: '',
      dateOfBirth: '',
      address: '',
      disabilityType: '',
      phoneNumber: ''
    },
    bankDetails: {
      accountNumber: '',
      accountHolderName: '',
      bankName: '',
      ifscCode: '',
      branch: ''
    }
  });
  const [certificateFile, setCertificateFile] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        personalDetails: {
          fullName: user.personalDetails?.fullName || '',
          dateOfBirth: user.personalDetails?.dateOfBirth ? new Date(user.personalDetails.dateOfBirth).toISOString().split('T')[0] : '',
          address: user.personalDetails?.address || '',
          disabilityType: user.personalDetails?.disabilityType || '',
          phoneNumber: user.personalDetails?.phoneNumber || ''
        },
        bankDetails: user.bankDetails || {
          accountNumber: '',
          accountHolderName: '',
          bankName: '',
          ifscCode: '',
          branch: ''
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('personalDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          [field]: value
        }
      }));
    } else if (name.startsWith('bankDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [field]: value
        }
      }));
    }
  };

  const handleCertificateUpload = (files) => {
    setCertificateFile(files[0] || null);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!certificateFile && !user.disabilityCertificate) {
    setError('Please upload your disability certificate');
    return;
  }

  try {
    setSubmitting(true);
    setError('');
    setSuccess('');

    const submitData = new FormData();
    
    // Append personal details
    Object.keys(formData.personalDetails).forEach(key => {
      if (formData.personalDetails[key]) {
        submitData.append(`personalDetails[${key}]`, formData.personalDetails[key]);
      }
    });

    // Append bank details
    Object.keys(formData.bankDetails).forEach(key => {
      if (formData.bankDetails[key]) {
        submitData.append(`bankDetails[${key}]`, formData.bankDetails[key]);
      }
    });

    // Append certificate if new one is uploaded
    if (certificateFile) {
      submitData.append('disabilityCertificate', certificateFile);
    }

    console.log('Submitting data...');
    
    const response = await authAPI.put('/profile', submitData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('Success:', response.data);
    setSuccess('Profile updated successfully! Your verification is pending admin approval.');
    
  } catch (error) {
    console.error('Full error:', error);
    console.error('Error response:', error.response);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    
    setError(error.response?.data?.message || 'Failed to update profile. Check console for details.');
  } finally {
    setSubmitting(false);
  }
};

  if (loading) return <LoadingSpinner />;

  return (
    <div className="profile-verification">
      <div className="page-header">
        <h1>Profile Verification</h1>
        <p>Complete your profile to start selling on InclusiKart</p>
      </div>

      {user?.profileStatus === 'verified' && (
        <Message 
          type="success" 
          message="Your profile is verified! You can now add products and start selling." 
        />
      )}

      {user?.profileStatus === 'pending' && (
        <Message 
          type="warning" 
          message="Your profile is pending verification. You'll be able to add products once verified." 
        />
      )}

      {error && <Message type="error" message={error} />}
      {success && <Message type="success" message={success} />}

      <form onSubmit={handleSubmit} className="verification-form">
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <div className="form-group">
            <label htmlFor="fullName">Full Name *</label>
            <input
              type="text"
              id="fullName"
              name="personalDetails.fullName"
              value={formData.personalDetails.fullName}
              onChange={handleChange}
              required
              placeholder="Your full legal name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                type="date"
                id="dateOfBirth"
                name="personalDetails.dateOfBirth"
                value={formData.personalDetails.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="personalDetails.phoneNumber"
                value={formData.personalDetails.phoneNumber}
                onChange={handleChange}
                placeholder="Your contact number"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="disabilityType">Disability Type *</label>
            <input
              type="text"
              id="disabilityType"
              name="personalDetails.disabilityType"
              value={formData.personalDetails.disabilityType}
              onChange={handleChange}
              required
              placeholder="Type of disability"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Complete Address *</label>
            <textarea
              id="address"
              name="personalDetails.address"
              value={formData.personalDetails.address}
              onChange={handleChange}
              required
              placeholder="Your complete residential address"
              rows="3"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Bank Details</h3>
          <p>For receiving payments from your sales</p>
          
          <div className="form-group">
            <label htmlFor="accountHolderName">Account Holder Name *</label>
            <input
              type="text"
              id="accountHolderName"
              name="bankDetails.accountHolderName"
              value={formData.bankDetails.accountHolderName}
              onChange={handleChange}
              required
              placeholder="Name as in bank account"
            />
          </div>

          <div className="form-group">
            <label htmlFor="accountNumber">Account Number *</label>
            <input
              type="text"
              id="accountNumber"
              name="bankDetails.accountNumber"
              value={formData.bankDetails.accountNumber}
              onChange={handleChange}
              required
              placeholder="Bank account number"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bankName">Bank Name *</label>
              <input
                type="text"
                id="bankName"
                name="bankDetails.bankName"
                value={formData.bankDetails.bankName}
                onChange={handleChange}
                required
                placeholder="Name of your bank"
              />
            </div>

            <div className="form-group">
              <label htmlFor="ifscCode">IFSC Code *</label>
              <input
                type="text"
                id="ifscCode"
                name="bankDetails.ifscCode"
                value={formData.bankDetails.ifscCode}
                onChange={handleChange}
                required
                placeholder="Bank IFSC code"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="branch">Branch</label>
            <input
              type="text"
              id="branch"
              name="bankDetails.branch"
              value={formData.bankDetails.branch}
              onChange={handleChange}
              placeholder="Bank branch name"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Disability Certificate</h3>
          <p>Upload your government-issued disability certificate for verification</p>
          
          {user?.disabilityCertificate ? (
            <div className="existing-certificate">
              <p><strong>Current Certificate:</strong> {user.disabilityCertificate.fileName}</p>
              <a 
                href={`http://localhost:5000/${user.disabilityCertificate.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn secondary" id= "btn-view-certificate"
              >
                View Current Certificate
              </a>
              <p className="note">Upload a new file only if you want to replace the current certificate.</p>
            </div>
          ) : null}

          <FileUpload
            onFilesChange={handleCertificateUpload}
            accept="image/*,.pdf"
            multiple={false}
            maxFiles={1}
          />
          <small>Accepted formats: JPG, PNG, PDF. Maximum file size: 10MB</small>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={submitting}
            className="btn primary large" id="btn-submit-verification"

          >
            {submitting ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </div>
      </form>

      <div className="verification-info">
        <h3>Verification Process</h3>
        <div className="process-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Submit Information</h4>
              <p>Fill out all required personal and bank details</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Upload Certificate</h4>
              <p>Provide your disability certificate for verification</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Admin Review</h4>
              <p>Our team will review your submission within 2-3 business days</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Start Selling</h4>
              <p>Once verified, you can add products and start selling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileVerification;