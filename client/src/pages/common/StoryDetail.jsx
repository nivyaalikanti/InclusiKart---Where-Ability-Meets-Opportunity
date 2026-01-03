import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storyAPI } from '../../utils/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import { useAuth } from '../../context/AuthContext';
import './StoryDetail.css';
import CommentModal from '../../components/Common/CommentModal';
 

const StoryDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      const res = await storyAPI.get(`/${id}`);
      setStory(res.data.data.story);
    } catch (err) {
      console.error('Failed to load story:', err);
      setError('Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) return <Message type="error" message={error} />;

  if (!story) return <Message type="warning" message="Story not found" />;

  const authorName = story.author?.personalDetails?.fullName || story.author?.username || 'Unknown';
  const initials = authorName.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();

  return (
    <div className="story-detail">
      <div className="hero story-title">
        <div className="hero-overlay" />
        <div className="hero-content ">
          <h1 className="hero-title ">{story.title}</h1>
          <p className="hero-sub">By {authorName} • {new Date(story.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="story-card">
        <div className="story-header">
          <div className="author-card">
            <div className="avatar">{initials}</div>
            <div className="author-info">
              <div className="author-name">{authorName}</div>
              <div className="author-meta">{story.author?.profileStatus === 'verified' ? 'Verified Seller' : 'Seller'}</div>
            </div>
          </div>

          <div className="story-stats-inline">
            <div className="stat">❤️ {story.likesCount}</div>
            <div className="stat">💬 {story.commentsCount}</div>
            <div className="stat">👁️ {story.views}</div>
          </div>
        </div>

        {story.media && (
          <div className="story-media featured-media">
            {story.mediaType === 'video' ? (
              <video controls>
                <source src={`http://localhost:5000/${story.media}`} />
              </video>
            ) : (
              <img src={`http://localhost:5000/${story.media}`} alt={story.title} />
            )}
          </div>
        )}

        <div className="story-body">
          <p className="story-full-description">{story.description}</p>

          {story.tags?.length > 0 && (
            <div className="story-tags">
              {story.tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
            </div>
          )}

          <div className="story-actions">
            {user && user._id === story.author?._id && (
              <Link to={`/seller/stories/edit/${story._id}`} className="btn secondary">Edit Story</Link>
            )}
            <button className="btn primary-outline">Share</button>
            <button className="btn" onClick={() => setCommenting(true)}>Add Comment</button>
            <button className="btn secondary" onClick={() => setShowComments(s => !s)}>{showComments ? 'Hide Comments' : 'View Comments'}</button>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="comments-section">
          <h3>Comments ({story.commentsCount})</h3>
          {(!story.comments || story.comments.length === 0) ? (
            <p>No comments yet. Be the first to comment.</p>
          ) : (
            <div className="comments-list">
              {story.comments.map(c => (
                <div key={c._id || c.createdAt} className="comment-item">
                  <div className="comment-author">{c.user?.personalDetails?.fullName || c.user?.username || 'User'}</div>
                  <div className="comment-text">{c.comment}</div>
                  <div className="comment-meta">{new Date(c.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {commenting && (
        <CommentModal
          open={commenting}
          onClose={() => { setCommenting(false); fetchStory(); }}
          storyId={story._id}
          onCommentAdded={() => { setCommenting(false); fetchStory(); }}
          storyAPI={storyAPI}
          user={user}
        />
      )}
    </div>
  );
};

export default StoryDetail;
