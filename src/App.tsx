import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Contributions from './pages/Contributions';
import Wishlist from './pages/Wishlist';
import Savings from './pages/Savings';
import Simulation from './pages/Simulation';
import ShoppingList from './pages/ShoppingList';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return !user ? <>{children}</> : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/transactions" element={
        <ProtectedRoute>
          <Layout>
            <Transactions />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/categories" element={
        <ProtectedRoute>
          <Layout>
            <Categories />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/contributions" element={
        <ProtectedRoute>
          <Layout>
            <Contributions />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/wishlist" element={
        <ProtectedRoute>
          <Layout>
            <Wishlist />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/savings" element={
        <ProtectedRoute>
          <Layout>
            <Savings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/simulation" element={
        <ProtectedRoute>
          <Layout>
            <Simulation />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/shopping-list" element={
        <ProtectedRoute>
          <Layout>
            <ShoppingList />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <Layout>
            <Reports />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <DataProvider>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </DataProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;