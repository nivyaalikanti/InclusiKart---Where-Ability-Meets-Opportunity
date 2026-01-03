import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>InclusiKart</h3>
          <p>
            Empowering specially challenged artisans by providing a platform 
            to showcase and sell their unique handmade products.
          </p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/shop">Shop</a></li>
            <li><a href="/stories">Stories</a></li>
            <li><a href="/support">Support</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>For Sellers</h3>
          <ul className="footer-links">
            <li><a href="/seller/dashboard">Seller Dashboard</a></li>
            <li><a href="/seller/products">Manage Products</a></li>
            <li><a href="/seller/stories/share">Share Your Story</a></li>
            <li><a href="/support">Get Support</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Contact</h3>
          <ul className="footer-links">
            <li>Email: support@inclusikart.com</li>
            <li>Phone: +1 (555) 123-4567</li>
            <li>Address: 123 Empowerment St, City</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 InclusiKart. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;