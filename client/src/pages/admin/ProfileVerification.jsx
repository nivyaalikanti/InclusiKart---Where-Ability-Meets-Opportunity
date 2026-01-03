import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './AdminVerification.css';

const ProfileVerification = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get('/verifications/pending');
      setSellers(response.data.data.sellers);
    } catch (error) {
      setError('Failed to fetch pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (sellerId, status) => {
    try {
      await adminAPI.patch(`/verifications/${sellerId}`, {
        status,
        adminNotes: verificationNotes
      });
      
      setSellers(sellers.filter(seller => seller._id !== sellerId));
      setSelectedSeller(null);
      setVerificationNotes('');
      
    } catch (error) {
      setError('Failed to update verification status');
    }
  };

  const openSellerDetails = (seller) => {
    setSelectedSeller(seller);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-verification">
      <div className="page-header">
        <h1>Seller Profile Verifications</h1>
        <p>Review and verify seller profiles</p>
      </div>

      {error && <Message type="error" message={error} />}

      {sellers.length === 0 ? (
        <div className="no-pending">
          <h3>No pending verifications</h3>
          <p>All seller profiles have been reviewed.</p>
        </div>
      ) : (
        <div className="verification-list">
          {sellers.map(seller => (
            <div key={seller._id} className="verification-card">
              <div className="seller-info">
                <h3>{seller.personalDetails?.fullName}</h3>
                <p>Username: {seller.username}</p>
                <p>Email: {seller.email}</p>
                <p>Disability: {seller.personalDetails?.disabilityType}</p>
                <p>Joined: {new Date(seller.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="verification-actions">
                <button
                  onClick={() => openSellerDetails(seller)}
                  className="btn secondary"
                >
                  View Details
                </button>
                
                
                <div className="action-buttons">
                  <button
                    onClick={() => handleVerification(seller._id, 'verified')}
                    className="btn success"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleVerification(seller._id, 'rejected')}
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

      {/* Seller Details Modal */}
      {selectedSeller && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Seller Details</h2>
              <button 
                onClick={() => setSelectedSeller(null)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="seller-details">
                <h3>Personal Information</h3>
                <p><strong>Full Name:</strong> {selectedSeller.personalDetails?.fullName}</p>
                <p><strong>Date of Birth:</strong> {new Date(selectedSeller.personalDetails?.dateOfBirth).toLocaleDateString()}</p>
                <p><strong>Disability Type:</strong> {selectedSeller.personalDetails?.disabilityType}</p>
                <p><strong>Phone:</strong> {selectedSeller.personalDetails?.phoneNumber || 'Not provided'}</p>
                <p><strong>Address:</strong> {selectedSeller.personalDetails?.address}</p>

                <h3>Disability Certificate</h3>
                {selectedSeller.disabilityCertificate ? (
                  <div className="certificate-preview">
                    <img 
                      src={`http://localhost:5000/${selectedSeller.disabilityCertificate.filePath}`}
                      alt="Disability Certificate"
                      className="certificate-image"
                    />
                    <a 
                      href={`http://localhost:5000/${selectedSeller.disabilityCertificate.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn secondary"
                    >
                      View Full Size
                    </a>
                    <a 
                      
                      className="btn secondary"
                    >
                      Validate
                    </a>
                  </div>
                ) : (
                  <p>No certificate uploaded</p>
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
                onClick={() => handleVerification(selectedSeller._id, 'verified')}
                className="btn success"
              >
                Approve Seller
              </button>
              <button
                onClick={() => handleVerification(selectedSeller._id, 'rejected')}
                className="btn danger"
              >
                Reject Seller
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileVerification;