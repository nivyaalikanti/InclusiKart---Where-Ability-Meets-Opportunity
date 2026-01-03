import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storyAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import './ManageStories.css';

const ManageStories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyStories();
  }, []);

  const fetchMyStories = async () => {
    try {
      setLoading(true);
      const response = await storyAPI.get('/', {
        params: { author: user._id, status: 'all' }
      });
      setStories(response.data.data.stories || []);
    } catch (err) {
      console.error('Fetch my stories error:', err);
      setError('Failed to load your stories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="manage-stories">
      <div className="page-header">
        <h1>My Stories</h1>
        <p>Manage your submitted stories and edit to resubmit for approval</p>
      </div>

      {error && <Message type="error" message={error} />}

      {stories.length === 0 ? (
        <div className="no-stories">
          <h3>You haven't shared any stories yet</h3>
          <Link to="/seller/stories/share" className="btn primary">Share Your Story</Link>
        </div>
      ) : (
        <div className="stories-table">
          {stories.map(story => (
            <div key={story._id} className="story-row">
              <div className="story-info">
                <h3>{story.title}</h3>
                <p>Status: <strong>{story.status}</strong></p>
                <p>Submitted: {new Date(story.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="story-actions">
                <Link to={`/seller/stories/edit/${story._id}`} className="btn secondary">Edit</Link>
                <Link to={`/story/${story._id}`} className="btn">View</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageStories;
