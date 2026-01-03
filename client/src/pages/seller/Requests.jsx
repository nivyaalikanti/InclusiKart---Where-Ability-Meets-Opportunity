import React, { useState, useEffect } from 'react';
import { requestAPI } from '../../utils/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './SellerRequests.css';

const SellerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await requestAPI.get('/seller/my-requests', {
        params: { status: filter !== 'all' ? filter : undefined }
      });
      setRequests(response.data.data.requests);
    } catch (error) {
      setError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async (requestId, status, responseMessage = '') => {
    try {
      await requestAPI.patch(`/seller/${requestId}/status`, {
        status,
        responseMessage
      });
      fetchRequests(); // Refresh the list
    } catch (error) {
      setError('Failed to update request status');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="seller-requests">
      <div className="page-header">
        <h1>Customer Requests</h1>
        <p>Manage product requests from customers</p>
      </div>

      {error && <Message type="error" message={error} />}

      <div className="requests-filters">
        {['all', 'pending', 'accepted', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="no-requests">
          <h3>No requests found</h3>
          <p>You don't have any requests matching this filter.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map(request => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div className="request-info">
                  <h3>{request.product?.name}</h3>
                  <p>Requested by: {request.buyer?.personalDetails?.fullName}</p>
                  <p>Quantity: {request.requestedQuantity}</p>
                  <p>Date: {new Date(request.createdAt).toLocaleDateString()}</p>
                  {request.message && (
                    <p className="request-message">Message: "{request.message}"</p>
                  )}
                </div>
                <div className="request-status">
                  <span className={`status-badge ${request.status}`}>
                    {request.status}
                  </span>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button
                    onClick={() => handleRequestResponse(request._id, 'accepted', 'Request accepted! We will update the product quantity.')}
                    className="btn success"
                  >
                    Accept Request
                  </button>
                  <button
                    onClick={() => handleRequestResponse(request._id, 'rejected', 'Sorry, we cannot fulfill this request at the moment.')}
                    className="btn danger"
                  >
                    Reject Request
                  </button>
                </div>
              )}

              {request.responseMessage && (
                <div className="response-message">
                  <strong>Your Response:</strong> {request.responseMessage}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerRequests;