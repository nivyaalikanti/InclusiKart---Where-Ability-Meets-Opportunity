import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storyAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Message from '../../components/Common/Message';
import FileUpload from '../../components/Common/FileUpload';
import './ShareStory.css';

const ShareStory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: ''
  });
  const [mediaFile, setMediaFile] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleMediaUpload = (files) => {
    setMediaFile(files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (user.profileStatus !== 'verified') {
      setError('Please complete your profile verification before sharing stories');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('tags', formData.tags);

      if (mediaFile) {
        submitData.append('storyMedia', mediaFile);
      }

      await storyAPI.post('/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/seller/dashboard', { 
        state: { message: 'Story shared successfully! Waiting for admin approval.' } 
      });
      
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to share story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="share-story-container">
      <div className="page-header">
        <h1>Share Your Story</h1>
        <p>Inspire others by sharing your journey and experiences</p>
      </div>

      {user.profileStatus !== 'verified' && (
        <Message 
          type="warning" 
          message="Your profile is not verified yet. Stories will be published after verification." 
        />
      )}

      {error && <Message type="error" message={error} />}

      <form onSubmit={handleSubmit} className="story-form">
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="title">Story Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Give your story a compelling title"
              maxLength="200"
            />
            <small>{formData.title.length}/200 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Your Story *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Share your journey, challenges, achievements, and inspiration..."
              rows="8"
              maxLength="5000"
            />
            <small>{formData.description.length}/5000 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="inspiration, journey, achievement, disability-awareness... (comma separated)"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Add Media (Optional)</h3>
          <p>Share a photo or video that represents your story</p>
          <FileUpload
            onFilesChange={handleMediaUpload}
            accept="image/*,video/*"
            multiple={false}
            maxFiles={1}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/seller/dashboard')}
            className="btn secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || user.profileStatus !== 'verified'}
            className="btn primary"
          >
            {loading ? 'Sharing Story...' : 'Share Story'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShareStory;