import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storyAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Message from '../../components/Common/Message';
import FileUpload from '../../components/Common/FileUpload';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import './ShareStory.css';

const EditStory = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ title: '', description: '', tags: '' });
  const [mediaFile, setMediaFile] = useState(null);

  useEffect(() => {
    fetchStory();
  }, []);

  const fetchStory = async () => {
    try {
      setLoading(true);
      const res = await storyAPI.get(`/${id}`);
      const story = res.data.data.story;

      if (story.author?._id !== user._id) {
        setError('Access denied');
        return;
      }

      setFormData({
        title: story.title || '',
        description: story.description || '',
        tags: (story.tags || []).join(', ')
      });
    } catch (err) {
      console.error('Fetch story error:', err);
      setError('Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMediaUpload = (files) => {
    setMediaFile(files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');

      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('tags', formData.tags);
      if (mediaFile) submitData.append('storyMedia', mediaFile);

      await storyAPI.put(`/${id}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate('/seller/stories/manage', { state: { message: 'Story updated and resubmitted for approval' } });
    } catch (err) {
      console.error('Update story error:', err);
      setError(err.response?.data?.message || 'Failed to update story');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="share-story-container">
      <div className="page-header">
        <h1>Edit Story</h1>
        <p>Edit your story. After editing it will be resubmitted for admin approval.</p>
      </div>

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
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Replace Media (Optional)</h3>
          <FileUpload onFilesChange={handleMediaUpload} accept="image/*,video/*" multiple={false} maxFiles={1} />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/seller/stories/manage')} className="btn secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn primary">{saving ? 'Saving...' : 'Save & Resubmit'}</button>
        </div>
      </form>
    </div>
  );
};

export default EditStory;
