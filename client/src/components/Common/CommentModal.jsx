import React, { useState } from 'react';
import './CommentModal.css';

const CommentModal = ({ open, onClose, storyId, onCommentAdded, storyAPI, user }) => {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please login to comment');
      return;
    }
    if (!comment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await storyAPI.post(`/${storyId}/comment`, { comment: comment.trim() });
      // res.data contains the response body in this project
      const newComment = res.data?.data?.comment || res.data?.comment || null;
      setComment('');
      onCommentAdded && onCommentAdded(newComment);
      onClose();
    } catch (err) {
      console.error('Failed to add comment', err);
      setError((err?.response?.data?.message) || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-modal-backdrop" onClick={onClose}>
      <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comment-modal-header">
          <h3>Add Comment</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="comment-form">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your comment..."
            rows={5}
          />

          {error && <div className="comment-error">{error}</div>}

          <div className="comment-actions">
            <button type="button" className="btn secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn primary" disabled={submitting}> {submitting ? 'Posting...' : 'Post Comment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentModal;
