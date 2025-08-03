import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { PipecatClientProvider, PipecatClientAudio } from "@pipecat-ai/client-react";
import { PipecatClient } from "@pipecat-ai/client-js";
import { DailyTransport } from "@pipecat-ai/daily-transport";
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { FormBuilderWithAuth } from '@/components/FormBuilderWithAuth';
import { SharedForm } from '@/components/SharedForm';
import { AppSidebar } from '@/components/AppSidebar';
import { MainHeader } from '@/components/MainHeader';
import Forms from '@/pages/Forms';
import ChatForms from '@/pages/ChatForms';
import ChatDesign from '@/pages/ChatDesign';
import Integrations from '@/pages/Integrations';
import Settings from '@/pages/Settings';
import KnowledgeBase from '@/pages/KnowledgeBase';
import Payments from '@/pages/Payments';
import Pricing from '@/pages/Pricing';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import './App.css';

// Create Pipecat client with enhanced configuration (same as your working examples)
const pipecatClient = new PipecatClient({
  transport: new DailyTransport(),
  enableMic: true,        // Enable microphone by default
  enableCam: false,       // Disable camera for voice-only chat
});

// Add global event listeners (same as your working examples)
pipecatClient.on('connected', () => {
  console.log('✅ Pipecat client connected');
});

pipecatClient.on('disconnected', () => {
  console.log('❌ Pipecat client disconnected');
});

pipecatClient.on('error', (error) => {
  console.error('🚨 Pipecat client error:', error);
});

function App() {
  const { user, loading, signOut } = useSupabaseAuth();

  const AppLayout = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return children;
    }

    return (
      <SidebarProvider defaultOpen style={{ '--sidebar-width': '12rem', '--sidebar-width-icon': '3rem' } as any}>
        <div className="min-h-screen flex w-full bg-background" style={{ gap: 0 }}>
          <AppSidebar />
          <main className="flex-1 flex flex-col" style={{ marginLeft: 0 }}>
            <MainHeader />
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  };

  return (
    <PipecatClientProvider client={pipecatClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Main form builder route */}
            <Route 
              path="/" 
              element={
                <AppLayout>
                  {user ? (
                    <FormBuilderWithAuth />
                  ) : (
                    <FormBuilderWithAuth />
                  )}
                </AppLayout>
              } 
            />
            
            {/* Forms management route */}
            <Route 
              path="/forms" 
              element={
                <AppLayout>
                  {user ? (
                    <Forms user={user} />
                  ) : (
                    <FormBuilderWithAuth />
                  )}
                </AppLayout>
              } 
            />
            
            {/* Shared form route - Now has Pipecat context! */}
            <Route path="/form/:id" element={<SharedForm />} />
            
            {/* Chat Forms route */}
            <Route 
              path="/chat-forms" 
              element={
                <AppLayout>
                  {user ? (
                    <ChatForms user={user} />
                  ) : (
                    <FormBuilderWithAuth />
                  )}
                </AppLayout>
              } 
            />
            
            {/* Chat Design route */}
            <Route 
              path="/chat-design" 
              element={
                <AppLayout>
                  {user ? (
                    <ChatDesign />
                  ) : (
                    <FormBuilderWithAuth />
                  )}
                </AppLayout>
              } 
            />
            
            {/* Integrations route */}
            <Route 
              path="/integrations" 
              element={
                <AppLayout>
                  {user ? (
                    <Integrations />
                  ) : (
                    <FormBuilderWithAuth />
                  )}
                </AppLayout>
              } 
            />
            
            {/* Payments route */}
            <Route 
              path="/payments" 
              element={
                <AppLayout>
                  {user ? (
                    <Payments />
                  ) : (
                    <FormBuilderWithAuth />
                  )}
                </AppLayout>
              } 
            />

            {/* Settings route */}
            <Route 
              path="/settings" 
              element={
                <AppLayout>
                  {user ? (
                    <Settings user={user} onSignOut={signOut} />
                  ) : (
                    <FormBuilderWithAuth />
                  )}
                </AppLayout>
              } 
            />

            {/* Knowledge Base route */}
            <Route 
              path="/knowledge-base" 
              element={
                <AppLayout>
                  {user ? (
                    <KnowledgeBase user={user} />
                  ) : (
                    <FormBuilderWithAuth />
                  )}
                </AppLayout>
              } 
            />
            
            {/* Pricing route */}
            <Route 
              path="/pricing" 
              element={
                <AppLayout>
                  <Pricing />
                </AppLayout>
              } 
            />
            
            {/* Auth route */}
            <Route path="/auth" element={<Auth />} />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </div>
        {/* Add PipecatClientAudio for bot audio playback (same as your working examples) */}
        <PipecatClientAudio />
      </Router>
    </PipecatClientProvider>
  );
}

export default App;