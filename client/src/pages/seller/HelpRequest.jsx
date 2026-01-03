import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HelpRequestForm from '../../components/Forms/HelpRequestForm';
import { helpRequestAPI } from '../../utils/api';

const SellerHelpRequest = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (tabValue === 1) {
      fetchMyRequests();
    }
  }, [tabValue]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await helpRequestAPI.getMyRequests();
      setRequests(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSuccess = (newRequest) => {
    setSuccess('Request submitted successfully!');
    setTabValue(1);
    if (newRequest) {
      setRequests(prev => [newRequest, ...prev]);
    }
  };

  // Status colors
  const getStatusColor = (status) => {
    if (status === 'fulfilled') return '#10b981';
    if (status === 'in_progress') return '#3b82f6';
    if (status === 'under_review') return '#8b5cf6';
    if (status === 'pending') return '#f59e0b';
    if (status === 'rejected') return '#ef4444';
    return '#6b7280';
  };

  // Urgency colors
  const getUrgencyColor = (urgency) => {
    if (urgency === 'critical') return '#dc2626';
    if (urgency === 'high') return '#ea580c';
    if (urgency === 'medium') return '#d97706';
    return '#16a34a'; // low
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="seller-help-request-container">
      {/* Header */}
      <div className="help-request-header">
        <h1 className="page-title">Request Help</h1>
        <p className="page-subtitle">
          Need assistance with raw materials, training, or other support? Submit a request here.
        </p>
      </div>

      {/* Tabs */}
      <div className="help-request-tabs">
        <div className="tabs-header">
          <button 
            className={`tab-button ${tabValue === 0 ? 'active' : ''}`}
            onClick={() => setTabValue(0)}
          >
            <span className="tab-icon">➕</span>
            <span className="tab-label">New Request</span>
          </button>
          <button 
            className={`tab-button ${tabValue === 1 ? 'active' : ''}`}
            onClick={() => setTabValue(1)}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-label">My Requests</span>
          </button>
        </div>

        <div className="tabs-content">
          {/* New Request Tab */}
          {tabValue === 0 && (
            <div className="tab-panel">
              {success && (
                <div className="alert success">
                  <span>✅</span>
                  <span>{success}</span>
                </div>
              )}
              <HelpRequestForm onSuccess={handleRequestSuccess} />
            </div>
          )}

          {/* My Requests Tab */}
          {tabValue === 1 && (
            <div className="tab-panel">
              {error && (
                <div className="alert error">
                  <span>❌</span>
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading your requests...</p>
                </div>
              ) : requests.length > 0 ? (
                <div className="requests-grid">
                  {requests.map((request) => (
                    <div className="request-card" key={request._id}>
                      <div className="request-card-header">
                        <div className="request-title-section">
                          <h3 className="request-title">{request.title}</h3>
                          <div className="request-tags">
                            <span 
                              className="status-tag"
                              style={{ backgroundColor: getStatusColor(request.status) }}
                            >
                              {request.status.replace('_', ' ')}
                            </span>
                            <span 
                              className="urgency-tag"
                              style={{ backgroundColor: getUrgencyColor(request.urgencyLevel) }}
                            >
                              {request.urgencyLevel}
                            </span>
                            <span className="type-tag">
                              {request.requestType.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <span className="request-date">
                          {formatDate(request.createdAt)}
                        </span>
                      </div>

                      <p className="request-description">{request.description}</p>

                      <div className="request-details-grid">
                        <div className="detail-item">
                          <span className="detail-label">Category</span>
                          <span className="detail-value">{request.category}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Quantity</span>
                          <span className="detail-value">
                            {request.quantity} {request.unit}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Estimated Value</span>
                          <span className="detail-value">
                            ₹{request.estimatedValue || 'N/A'}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Deadline</span>
                          <span className="detail-value">
                            {request.deadline ? formatDate(request.deadline) : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {request.ngoAssigned && (
                        <div className="ngo-assigned-section">
                          <div className="section-divider"></div>
                          <div className="assigned-ngo">
                            <span className="ngo-icon">🤝</span>
                            <div className="ngo-info">
                              <span className="ngo-label">Assigned NGO</span>
                              <span className="ngo-name">
                                {request.ngoAssigned.ngoName || request.ngoAssigned.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3 className="empty-title">No Requests Found</h3>
                  <p className="empty-description">
                    You haven't submitted any help requests yet.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setTabValue(0)}
                  >
                    <span className="button-icon">➕</span>
                    <span>Create Your First Request</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Back Button */}
      <div className="back-button-container">
        <button
          className="back-button"
          onClick={() => navigate('/seller/dashboard')}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Add CSS */}
      <style jsx>{`
        .seller-help-request-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }

        /* Header Styles */
        .help-request-header {
          margin-bottom: 32px;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .page-subtitle {
          font-size: 1.125rem;
          color: #6b7280;
          line-height: 1.6;
        }

        /* Tab Styles */
        .help-request-tabs {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-bottom: 24px;
        }

        .tabs-header {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 24px;
          border: none;
          background: transparent;
          font-size: 1rem;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-button:hover {
          background: #f3f4f6;
        }

        .tab-button.active {
          color: #2563eb;
          background: white;
          border-bottom: 2px solid #2563eb;
        }

        .tab-icon {
          font-size: 1.25rem;
        }

        .tab-label {
          margin-left: 8px;
        }

        .tabs-content {
          padding: 0;
        }

        .tab-panel {
          padding: 24px;
        }

        /* Alert Styles */
        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 0.875rem;
        }

        .alert.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .alert.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Loading State */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 24px;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #e5e7eb;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Request Cards - Fixed Horizontal Alignment */
        .requests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .request-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .request-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .request-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .request-title-section {
          flex: 1;
          min-width: 0; /* Prevents flex item from overflowing */
        }

        .request-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .request-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }

        .status-tag,
        .urgency-tag,
        .type-tag {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
          color: white;
          white-space: nowrap;
        }

        .type-tag {
          background: #6b7280;
          color: white;
        }

        .request-date {
          font-size: 0.75rem;
          color: #6b7280;
          white-space: nowrap;
          margin-left: 8px;
        }

        .request-description {
          color: #6b7280;
          line-height: 1.5;
          margin-bottom: 16px;
          flex-grow: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 0.875rem;
        }

        .request-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
        }

        .detail-label {
          font-size: 0.7rem;
          color: #6b7280;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-value {
          font-size: 0.85rem;
          color: #1f2937;
          font-weight: 500;
          word-break: break-word;
        }

        /* NGO Assigned Section */
        .ngo-assigned-section {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .assigned-ngo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ngo-icon {
          font-size: 1.25rem;
        }

        .ngo-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .ngo-label {
          font-size: 0.7rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ngo-name {
          font-size: 0.85rem;
          color: #1f2937;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 64px 24px;
          grid-column: 1 / -1;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 24px;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .empty-description {
          color: #6b7280;
          margin-bottom: 24px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Button Styles */
        .primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .primary-button:hover {
          background: #1d4ed8;
        }

        .button-icon {
          font-size: 1rem;
        }

        .back-button-container {
          margin-top: 24px;
          text-align: left;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-button:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .requests-grid {
            grid-template-columns: 1fr;
          }
          
          .seller-help-request-container {
            padding: 15px;
          }
          
          .tab-panel {
            padding: 16px;
          }
          
          .request-card {
            padding: 16px;
          }
          
          .request-details-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .tabs-header {
            flex-direction: column;
          }
          
          .tab-button {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default SellerHelpRequest;