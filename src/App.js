import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Admin from './components/Admin';
import ForgotPassword from './components/ForgotPassword';
import AccountSelection from './components/AccountSelection';
import CustomerDashboard from './components/CustomerDashboard';
import ProfilePage from './components/ProfilePage';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Customer page */}
          <Route path="/customer" element={<CustomerDashboard />} />

          {/* Profile page */}
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
