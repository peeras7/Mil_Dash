import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

// Page Imports
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees"; 
import Calendar from "./pages/Calendar";
import Reports from "./pages/Reports";   
import Settings from "./pages/Settings"; 
import Profile from "./pages/Profile";
import Requests from "./pages/Requests"; 
import AuditLogs from "./pages/AuditLogs"; 

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Authentication */}
          <Route path="/" element={<Login />} /> 
          <Route path="/login" element={<Login />} />

          {/* Main Pages */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/view-employees" element={<Employees />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/reports" element={<Reports />} />      
          <Route path="/settings" element={<Settings />} />    
          <Route path="/requests" element={<Requests />} /> 

          {/* New Feature */}
          <Route path="/audit-logs" element={<AuditLogs />} />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}