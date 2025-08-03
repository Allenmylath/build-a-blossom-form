import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
// Remove PipecatProvider import for now - we'll add it conditionally
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

// Dynamic import for PipecatProvider to handle build issues
const PipecatWrapper = ({ children }: { children: React.ReactNode }) => {
  const [PipecatProvider, setPipecatProvider] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Try to dynamically import PipecatProvider
    const loadPipecat = async () => {
      try {
        const { PipecatProvider: Provider } = await import("@pipecat-ai/client-react");
        setPipecatProvider(() => Provider);
      } catch (error) {
        console.warn("PipecatProvider not available:", error);
        // Fallback: just render children without provider
        setPipecatProvider(() => ({ children }: { children: React.ReactNode }) => <>{children}</>);
      }
    };

    loadPipecat();
  }, []);

  if (!PipecatProvider) {
    // Loading state or fallback
    return <>{children}</>;
  }

  return <PipecatProvider>{children}</PipecatProvider>;
};

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
    <PipecatWrapper>
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
            
            {/* Shared form route */}
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
      </Router>
    </PipecatWrapper>
  );
}

export default App;