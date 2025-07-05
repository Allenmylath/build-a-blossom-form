
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import Pricing from "@/pages/Pricing";
import Settings from "@/pages/Settings";
import { SharedForm } from "@/components/SharedForm";

const queryClient = new QueryClient();

function App() {
  console.log('App component rendering');
  console.log('Current URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/settings" element={<Settings user={null} onSignOut={() => {}} />} />
          <Route path="/form/:id" element={<SharedForm />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
