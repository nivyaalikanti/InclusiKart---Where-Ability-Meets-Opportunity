import React from 'react';
import { Link } from 'react-router-dom';
import './404.css';

const NotFound = () => {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div className="not-found-actions">
          <Link to="/" className="btn primary">
            Go Home
          </Link>
          <Link to="/shop" className="btn secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;