import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RootLayout } from '@/components/RootLayout';
import Auth from './pages/Auth';
import Index from './pages/Index';
import ManageCharacters from './pages/ManageCharacters';
import Account from './pages/Account';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/auth" element={<Auth />} />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <RootLayout>
                  <Index />
                </RootLayout>
              </ProtectedRoute>
            } />

            <Route path="/manage" element={
              <ProtectedRoute>
                <RootLayout>
                  <ManageCharacters />
                </RootLayout>
              </ProtectedRoute>
            } />

            <Route path="/account" element={
              <ProtectedRoute>
                <RootLayout>
                  <Account />
                </RootLayout>
              </ProtectedRoute>
            } />

            {/* 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;