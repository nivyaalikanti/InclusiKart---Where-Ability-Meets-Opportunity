import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Home from './pages/common/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Shop from './pages/buyer/Shop';
import ProductDetail from './pages/buyer/ProductDetail';
import Cart from './pages/buyer/Cart';
import BuyerOrders from './pages/buyer/Orders';
import BuyerDashboard from './pages/buyer/Dashboard';
import SellerDashboard from './pages/seller/Dashboard';
import SellerProducts from './pages/seller/ProductManagement';
import AddProduct from './pages/seller/AddProduct';
import EditProduct from './pages/seller/EditProduct';
import SellerOrders from './pages/seller/Orders';
import SellerRequests from './pages/seller/Requests';
import SellerReports from './pages/seller/Reports';
import ShareStory from './pages/seller/ShareStory';
import ManageStories from './pages/seller/ManageStories';
import EditStory from './pages/seller/EditStory';
import ProfileVerification from './pages/seller/ProfileVerification';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProfileVerification from './pages/admin/ProfileVerification';
import AdminProductVerification from './pages/admin/ProductVerification';
import AdminStoryVerification from './pages/admin/StoryVerification';
import Stories from './pages/common/Stories';
import StoryDetail from './pages/common/StoryDetail';
import Support from './pages/common/Support';
import NotFound from './pages/404';
import NGOLogin from './pages/ngo/Login';
import NGODashboard from './pages/ngo/Dashboard';
import NGORequests from './pages/ngo/Requests';
import RequestDetail from './pages/ngo/RequestDetail';
import SellerHelpRequest from './pages/seller/HelpRequest';
import VoiceController from './voice/VoiceController';
import './App.css';

function App() {
  useEffect(() => {
  // Define the init function globally
  window.googleTranslateElementInit = () => {
    if (!document.querySelector(".goog-te-gadget")) {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,hi,te,ta,bn,ml,kn,gu,mr,ur",
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element"
      );
    }
  };

  // Check if script already exists
  if (!document.querySelector("#google-translate-script")) {
    const addScript = document.createElement("script");
    addScript.id = "google-translate-script";
    addScript.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(addScript);
  }
}, []); // 👈 dependency array added


  
  return (
    
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/story/:id" element={<StoryDetail />} />
                <Route path="/support" element={<Support />} />

                {/* Buyer Routes */}
                <Route path="/buyer/dashboard" element={
                  <ProtectedRoute role="buyer">
                    <BuyerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/buyer/cart" element={
                  <ProtectedRoute role="buyer">
                    <Cart />
                  </ProtectedRoute>
                } />
                <Route path="/buyer/orders" element={
                  <ProtectedRoute role="buyer">
                    <BuyerOrders />
                  </ProtectedRoute>
                } />

                {/* Seller Routes */}
                <Route path="/seller/dashboard" element={
                  <ProtectedRoute role="seller">
                    <SellerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/seller/profile-verification" element={
                  <ProtectedRoute role="seller">
                    <ProfileVerification />
                  </ProtectedRoute>
                } />
                <Route path="/seller/products" element={
                  <ProtectedRoute role="seller">
                    <SellerProducts />
                  </ProtectedRoute>
                } />
                <Route path="/seller/products/add" element={
                  <ProtectedRoute role="seller">
                    <AddProduct />
                  </ProtectedRoute>
                } />
                <Route path="/seller/products/edit/:id" element={
                  <ProtectedRoute role="seller">
                    <EditProduct />
                  </ProtectedRoute>
                } />
                <Route path="/seller/orders" element={
                  <ProtectedRoute role="seller">
                    <SellerOrders />
                  </ProtectedRoute>
                } />
                <Route path="/seller/requests" element={
                  <ProtectedRoute role="seller">
                    <SellerRequests />
                  </ProtectedRoute>
                } />
                <Route path="/seller/reports" element={
                  <ProtectedRoute role="seller">
                    <SellerReports />
                  </ProtectedRoute>
                } />
                <Route path="/seller/stories/share" element={
                  <ProtectedRoute role="seller">
                    <ShareStory />
                  </ProtectedRoute>
                } />
                <Route path="/seller/stories/manage" element={
                  <ProtectedRoute role="seller">
                    <ManageStories />
                  </ProtectedRoute>
                } />
                <Route path="/seller/stories/edit/:id" element={
                  <ProtectedRoute role="seller">
                    <EditStory />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute role="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/verifications" element={
                  <ProtectedRoute role="admin">
                    <AdminProfileVerification />
                  </ProtectedRoute>
                } />
                <Route path="/admin/products" element={
                  <ProtectedRoute role="admin">
                    <AdminProductVerification />
                  </ProtectedRoute>
                } />
                <Route path="/admin/stories" element={
                  <ProtectedRoute role="admin">
                    <AdminStoryVerification />
                  </ProtectedRoute>
                } />
                {/* NGO Routes */}
<Route path="/ngo/login" element={<NGOLogin/>} />
<Route path="/ngo/dashboard" element={<ProtectedRoute role="ngo"><NGODashboard /></ProtectedRoute>} />
<Route path="/ngo/requests" element={<ProtectedRoute role="ngo"><NGORequests /></ProtectedRoute>} />
<Route path="/ngo/requests/:id" element={<ProtectedRoute role="ngo"><RequestDetail /></ProtectedRoute>} />

 {/* Seller Route for Help Requests */}
<Route path="/seller/help-request" element={<ProtectedRoute role="seller"><SellerHelpRequest /></ProtectedRoute>} />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            {/* Voice navigation removed */}
            <div onClick={() => {}}>
  <VoiceController />
</div>

          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;