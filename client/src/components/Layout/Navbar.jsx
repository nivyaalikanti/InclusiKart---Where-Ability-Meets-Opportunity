import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'buyer':
        return '/buyer/dashboard';
      case 'seller':
        return user.profileStatus === 'verified' ? '/seller/dashboard' : '/seller/profile-verification';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <nav className="navbar">
      
      <div className="nav-container">
        <Link to="/" className="nav-logo" >
          <span className="logo-icon">♿</span>
          InclusiKart
        </Link>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" id="nav-link-home" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link to="/shop" className="nav-link" id="nav-link-shop" onClick={() => setIsMenuOpen(false)}>
            Shop
          </Link>
          <Link to="/stories" className="nav-link" id="nav-link-stories" onClick={() => setIsMenuOpen(false)}>
            Stories
          </Link>
          
          {user ? (
            <>
              {getDashboardLink() && (
                <Link to={getDashboardLink()} className="nav-link" id="nav-link-dashboard" onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </Link>
              )}
              
              {user.role === 'buyer' && (
                <Link to="/buyer/cart" className="nav-link cart-link" id="nav-link-cart" onClick={() => setIsMenuOpen(false)}>
                  Cart {cartItems.length > 0 && <span className="cart-count">{cartItems.length}</span>}
                </Link>
              )}

              <div className="nav-user">
                <span className="user-greeting">Hello, {user.username}</span>
                <button onClick={handleLogout} className="logout-btn" id="logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="nav-link login-link" id="nav-link-login"onClick={() => setIsMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="nav-link register-link" id="nav-link-register"onClick={() => setIsMenuOpen(false)}>
                Register
              </Link>
            </div>
          )}
        </div>

        <div 
          className="nav-toggle" id="nav-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
        <div id="google_translate_element"></div>
      </div>
      
    </nav>
  );
};

export default Navbar;