import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storyAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Message from '../../components/Common/Message';
import CommentModal from '../../components/Common/CommentModal';
import './Stories.css';

const Stories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [commentingStoryId, setCommentingStoryId] = useState(null);

  useEffect(() => {
    fetchStories();
  }, [filter]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await storyAPI.get('/', {
        params: { 
          status: 'approved',
          featured: filter === 'featured' ? 'true' : undefined
        }
      });
      setStories(response.data.data.stories);
    } catch (error) {
      setError('Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (storyId) => {
    if (!user) return;
    
    try {
      await storyAPI.post(`/${storyId}/like`);
      fetchStories(); // Refresh to get updated likes
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const openCommentModal = (storyId) => {
    setCommentingStoryId(storyId);
  };

  const closeCommentModal = () => setCommentingStoryId(null);

  const handleCommentAdded = (newComment) => {
    if (!newComment) return;
    // Update local stories array to reflect incremented count
    setStories(prev => prev.map(s => s._id === commentingStoryId ? { ...s, commentsCount: (s.commentsCount || 0) + 1 } : s));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="stories-container">
      <div className="stories-header">
        <h1>Inspiring Stories</h1>
        <p>Discover the incredible journeys of our specially challenged artisans</p>
      </div>

      {error && <Message type="error" message={error} />}

      <div className="stories-filters">
        <button
          onClick={() => setFilter('all')}
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
        >
          All Stories
        </button>
        <button
          onClick={() => setFilter('featured')}
          className={`filter-btn ${filter === 'featured' ? 'active' : ''}`}
        >
          Featured
        </button>
        {user?.role === 'seller' && (
          <Link to="/seller/stories/share" className="btn primary">
            Share Your Story
          </Link>
        )}
      </div>

      {stories.length === 0 ? (
        <div className="no-stories">
          <h3>No stories found</h3>
          <p>Check back later for inspiring stories from our community.</p>
        </div>
      ) : (
        <div className="stories-grid">
          {stories.map(story => (
            <div key={story._id} className={`story-card ${story.isFeatured ? 'featured' : ''}`}>
              {story.isFeatured && (
                <div className="featured-badge">Featured</div>
              )}
              
              {story.media && (
                <div className="story-media">
                  {story.mediaType === 'video' ? (
                    <video controls>
                      <source src={`http://localhost:5000/${story.media}`} />
                    </video>
                  ) : (
                    <img 
                      src={`http://localhost:5000/${story.media}`} 
                      alt={story.title}
                    />
                  )}
                </div>
              )}

              <div className="story-content">
                <h3 className="story-title">{story.title}</h3>
                <p className="story-description">
                  {story.description.length > 150 
                    ? `${story.description.substring(0, 150)}...` 
                    : story.description
                  }
                </p>
                
                <div className="story-author">
                  <span>By {story.author?.personalDetails?.fullName}</span>
                  {story.author?.profileStatus === 'verified' && (
                    <span className="verified-badge">✓ Verified</span>
                  )}
                </div>

                <div className="story-stats">
                  <button
                    onClick={() => handleLike(story._id)}
                    className={`like-btn ${story.likes.includes(user?._id) ? 'liked' : ''}`}
                    disabled={!user}
                  >
                    ❤️ {story.likesCount}
                  </button>
                  <button className="comment-btn" onClick={() => openCommentModal(story._id)}>
                    💬 {story.commentsCount}
                  </button>
                  <span>👁️ {story.views}</span>
                </div>

                <div className="story-tags">
                  {story.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>

                <Link to={`/story/${story._id}`} className="read-more">
                  Read Full Story →
                </Link>
              </div>
              {commentingStoryId && (
                <CommentModal
                  open={!!commentingStoryId}
                  onClose={closeCommentModal}
                  storyId={commentingStoryId}
                  onCommentAdded={handleCommentAdded}
                  storyAPI={storyAPI}
                  user={user}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Stories;