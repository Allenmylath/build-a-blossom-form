
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { StoreProvider } from '@/components/StoreProvider';
import { useSupabaseAuth } from '@/hooks/useStore';
import { FormBuilderWithAuth } from '@/components/FormBuilderWithAuth';
import { SharedForm } from '@/components/SharedForm';
import Settings from '@/pages/Settings';
import KnowledgeBase from '@/pages/KnowledgeBase';
import Pricing from '@/pages/Pricing';
import NotFound from '@/pages/NotFound';
import './App.css';

function AppContent() {
  const { user, loading, signOut } = useSupabaseAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Main form builder route */}
          <Route 
            path="/" 
            element={<FormBuilderWithAuth />} 
          />
          
          {/* Shared form route */}
          <Route path="/form/:id" element={<SharedForm />} />
          
          {/* Settings route */}
          <Route 
            path="/settings" 
            element={
              user ? (
                <Settings user={user} onSignOut={signOut} />
              ) : (
                <FormBuilderWithAuth />
              )
            } 
          />

          {/* Knowledge Base route */}
          <Route 
            path="/knowledge-base" 
            element={
              user ? (
                <KnowledgeBase user={user} />
              ) : (
                <FormBuilderWithAuth />
              )
            } 
          />
          
          {/* Pricing route */}
          <Route path="/pricing" element={<Pricing />} />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
