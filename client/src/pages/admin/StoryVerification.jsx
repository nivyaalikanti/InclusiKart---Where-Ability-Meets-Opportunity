import React, { useState, useEffect } from 'react';
import { adminAPI, storyAPI } from '../../utils/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './AdminVerification.css';

const StoryVerification = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStory, setSelectedStory] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  useEffect(() => {
    fetchPendingStories();
  }, []);

  const fetchPendingStories = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get('/stories/pending');
      setStories(response.data.data.stories);
    } catch (error) {
      setError('Failed to fetch pending stories');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (storyId, status) => {
    try {
      await storyAPI.patch(`/${storyId}/status`, {
        status,
        adminNotes: verificationNotes
      });
      
      setStories(stories.filter(story => story._id !== storyId));
      setSelectedStory(null);
      setVerificationNotes('');
      
    } catch (error) {
      setError('Failed to update story status');
    }
  };

  const openStoryDetails = (story) => {
    setSelectedStory(story);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-verification">
      <div className="page-header">
        <h1>Story Verifications</h1>
        <p>Review and approve community stories</p>
      </div>

      {error && <Message type="error" message={error} />}

      {stories.length === 0 ? (
        <div className="no-pending">
          <h3>No pending stories</h3>
          <p>All stories have been reviewed.</p>
        </div>
      ) : (
        <div className="verification-list">
          {stories.map(story => (
            <div key={story._id} className="verification-card">
              <div className="seller-info">
                <h3>{story.title}</h3>
                <p>Author: {story.author?.personalDetails?.fullName}</p>
                <p>Disability: {story.author?.personalDetails?.disabilityType}</p>
                <p>Submitted: {new Date(story.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="verification-actions">
                <button
                  onClick={() => openStoryDetails(story)}
                  className="btn secondary"
                >
                  View Details
                </button>
                
                <div className="action-buttons">
                  <button
                    onClick={() => handleVerification(story._id, 'approved')}
                    className="btn success"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleVerification(story._id, 'rejected')}
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

      {/* Story Details Modal */}
      {selectedStory && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Story Details</h2>
              <button 
                onClick={() => setSelectedStory(null)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="seller-details">
                <h3>Story Information</h3>
                <p><strong>Title:</strong> {selectedStory.title}</p>
                <p><strong>Description:</strong> {selectedStory.description}</p>
                <p><strong>Tags:</strong> {selectedStory.tags?.join(', ') || 'None'}</p>
                
                <h3>Author Information</h3>
                <p><strong>Name:</strong> {selectedStory.author?.personalDetails?.fullName}</p>
                <p><strong>Username:</strong> {selectedStory.author?.username}</p>
                <p><strong>Email:</strong> {selectedStory.author?.email}</p>
                <p><strong>Disability:</strong> {selectedStory.author?.personalDetails?.disabilityType}</p>

                {selectedStory.media && (
                  <>
                    <h3>Story Media</h3>
                    <div className="certificate-preview">
                      {selectedStory.mediaType === 'video' ? (
                        <video controls className="certificate-image">
                          <source src={`http://localhost:5000/${selectedStory.media}`} />
                        </video>
                      ) : (
                        <img 
                          src={`http://localhost:5000/${selectedStory.media}`}
                          alt="Story media"
                          className="certificate-image"
                        />
                      )}
                    </div>
                  </>
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
                onClick={() => handleVerification(selectedStory._id, 'approved')}
                className="btn success"
              >
                Approve Story
              </button>
              <button
                onClick={() => handleVerification(selectedStory._id, 'rejected')}
                className="btn danger"
              >
                Reject Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryVerification;