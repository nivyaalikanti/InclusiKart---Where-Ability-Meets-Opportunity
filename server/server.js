const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Add this import
require('dotenv').config();
const helpRoutes = require('./routes/help');
const ngoRoutes = require('./routes/ngo');
const app = express();
const fs = require('fs');
const { execFile } = require("child_process");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ ADD THIS: Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inclusikart');
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};
// Voice routes removed

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to InclusiKart API!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is healthy and running!',
    database: 'Connected',
    timestamp: new Date().toISOString()
  });
});

// Test API routes
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working correctly!',
    data: {
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders'
    }
  });
});
app.post("/voice-command", async (req, res) => {
  try {
    const response = await fetch("http://localhost:8000/voice-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ type: "error", message: "Voice service unavailable" });
  }
});


const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/certificates',
    'uploads/products',
    'uploads/stories',
    'uploads/support',
    'uploads/help-requests', // Add this
    'uploads/general'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

createUploadDirs();
// Mount API route modules
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const storiesRoutes = require('./routes/stories');
const requestsRoutes = require('./routes/requests');
const supportRoutes = require('./routes/support');
const adminRoutes = require('./routes/admin');
const notificationsRoutes = require('./routes/notifications');
// Add cart routes
const cartRoutes = require('./routes/cart');
app.use('/api/cart', cartRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/ngo', ngoRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    await connectDB();

    // Try to bind to the configured port; if it's in use, try the next ports up to +5
    const maxRetries = 5;
    let currentPort = parseInt(PORT, 10) || 5000;
    let server;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        server = app.listen(currentPort);
        // If listening succeeds, break out
        console.log('🚀 InclusiKart Server Started Successfully');
        console.log(`📍 Port: ${currentPort}`);
        console.log(`🌐 URL: http://localhost:${currentPort}`);
        console.log(`✅ Health Check: http://localhost:${currentPort}/api/health`);
        console.log(`🔄 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📁 Static Files: http://localhost:${currentPort}/uploads/`);
        break;
      } catch (err) {
        if (err && err.code === 'EADDRINUSE') {
          console.warn(`Port ${currentPort} is in use. Trying port ${currentPort + 1}...`);
          currentPort += 1;
          if (attempt === maxRetries) {
            console.error('❌ Unable to bind to any port. Exiting.');
            process.exit(1);
          }
          // continue loop to try next port
        } else {
          throw err;
        }
      }
    }

    // Attach error handler to report EADDRINUSE if it happens after listen
    if (server) {
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`❌ Port ${currentPort} is already in use. Please free the port or set PORT env var to another port.`);
          process.exit(1);
        } else {
          console.error('Server error:', err);
        }
      });
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();