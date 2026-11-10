import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

import { Navbar } from './components/Navbar.jsx';
import { Sidebar } from './components/Sidebar.jsx';

import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { NewBill } from './pages/NewBill.jsx';
import { BillsList } from './pages/BillsList.jsx';
import { Products } from './pages/Products.jsx';
import { Customers } from './pages/Customers.jsx';
import { CustomerLedger } from './pages/CustomerLedger.jsx';
import { Payments } from './pages/Payments.jsx';
import { Reports } from './pages/Reports.jsx';
import { Settings } from './pages/Settings.jsx';
import { AuditLogs } from './pages/AuditLogs.jsx';

// Protected Route Wrapper
const ProtectedLayout = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-2xl font-bold text-slate-700">
        Loading Kisan Hardware...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <ToastProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected App Routes */}
              <Route
                path="/"
                element={
                  <ProtectedLayout>
                    <Dashboard />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/new-bill"
                element={
                  <ProtectedLayout>
                    <NewBill />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/bills"
                element={
                  <ProtectedLayout>
                    <BillsList />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedLayout>
                    <Products />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedLayout>
                    <Customers />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/customers/:id/ledger"
                element={
                  <ProtectedLayout>
                    <CustomerLedger />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedLayout>
                    <Payments />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedLayout adminOnly={true}>
                    <Reports />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedLayout>
                    <Settings />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/audit"
                element={
                  <ProtectedLayout adminOnly={true}>
                    <AuditLogs />
                  </ProtectedLayout>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ToastProvider>
  );
};

export default App;
