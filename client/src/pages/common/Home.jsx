import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [currentImage, setCurrentImage] = useState(0);

  const backgroundImages = [
    '/image1.png',
    '/image2.png',
    '/image3.png',
    '/image4.png',
    '/image5.png'
  ];
  

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <div className="home">
      {/* Hero Section with Rotating Background */}
      <section 
        className="hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${backgroundImages[currentImage]})`
        }}
      >
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Where <span className="highlight">Ability</span> meets <span className="highlight">Opportunity</span>
              </h1>
              <p className="hero-subtitle">
                Empowering specially challenged artisans to showcase their extraordinary talents 
                and connect with a global audience. Every purchase tells a story of resilience and creativity.
              </p>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-number">100+</span>
                  <span className="stat-label">Artisans Empowered</span>
                </div>
                <div className="stat">
                  <span className="stat-number">500+</span>
                  <span className="stat-label">Unique Products</span>
                </div>
                <div className="stat">
                  <span className="stat-number">1000+</span>
                  <span className="stat-label">Lives Impacted</span>
                </div>
              </div>
              <div className="hero-actions">
                <Link to="/shop" className="btn primary large" id="btn-explore-shop">
                  Explore Handcrafted Treasures
                </Link>
                {!user && (
                  <Link to="/register" className="btn secondary large" id="btn-start-journey">
                    Start Your Journey
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Image Indicator Dots */}
        <div className="image-indicators">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentImage ? 'active' : ''}`}
              onClick={() => setCurrentImage(index)}
            />
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission">
        <div className="container">
          <div className="mission-content">
            <h2>Our Mission</h2>
            <p className="mission-text">
              We believe that talent knows no boundaries. InclusiKart is dedicated to breaking down barriers 
              and creating equal opportunities for specially challenged artisans. Through our platform, 
              we transform unique abilities into sustainable livelihoods and bring extraordinary handmade 
              products to your doorstep.
            </p>
            <div className="mission-highlights">
              <div className="highlight-item">
                <div className="highlight-icon">🌟</div>
                <h3>Showcase Talent</h3>
                <p>Platform for artisans to display their unique creations</p>
              </div>
              <div className="highlight-item">
                <div className="highlight-icon">💝</div>
                <h3>Create Impact</h3>
                <p>Every purchase directly supports artisan communities</p>
              </div>
              <div className="highlight-item">
                <div className="highlight-icon">🌍</div>
                <h3>Build Community</h3>
                <p>Connect makers with appreciative customers worldwide</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Why Choose InclusiKart?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">♿</div>
              <h3>Inclusive by Design</h3>
              <p>Specially crafted platform ensuring accessibility and ease of use for all artisans</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Authentic Creations</h3>
              <p>Each product carries the unique story and personal touch of its creator</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Direct Impact</h3>
              <p>Maximum earnings go directly to artisans, ensuring fair compensation</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Sustainable Growth</h3>
              <p>Building long-term economic independence for specially challenged individuals</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Be Part of the Change</h2>
          <p className="cta-subtitle">
            Join thousands who are transforming lives through conscious shopping
          </p>
          <div className="cta-actions">
            {user ? (
              user.role === 'buyer' ? (
                <Link to="/shop" className="btn primary large" id="btn-continue-impact">
                  Continue Your Impact Journey
                </Link>
              ) : (
                <Link to="/seller/dashboard" className="btn primary large" id="btn-manage-creations">
                  Manage Your Creations
                </Link>
              )
            ) : (
              <>
                <Link to="/register" className="btn primary large" id="btn-start-selling">
                  Start Selling Today
                </Link>
                <Link to="/shop" className="btn primary large" id="btn-discover-stories">
                  Discover Artisan Stories
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;