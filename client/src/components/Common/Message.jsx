import React from 'react';
import './Message.css';

const Message = ({ type, message, onClose }) => {
  return (
    <div className={`message ${type}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="close-btn">
          ×
        </button>
      )}
    </div>
  );
};

// Change to default export
export default Message;