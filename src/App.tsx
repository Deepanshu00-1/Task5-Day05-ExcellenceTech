import { Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from '@/components/ui/Navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Events from '@/pages/Events';
import MyRegistrations from '@/pages/MyRegistrations';
import EventDetails from '@/pages/EventDetails';
import Home from '@/pages/Home';
import AuthForm from '@/pages/AuthForm';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster richColors position="top-center" />
      <div className="min-h-screen bg-black">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AuthForm />} />

          {/* Protected Routes - All routes that require authentication */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>
                  <Navigation />
                  <main>
                    <Home />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <div>
                  <Navigation />
                  <main>
                    <Events />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <div>
                  <Navigation />
                  <main>
                    <EventDetails />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-registrations"
            element={
              <ProtectedRoute>
                <div>
                  <Navigation />
                  <main>
                    <MyRegistrations />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Organizer Routes */}
          <Route
            path="/events/create"
            element={
              <ProtectedRoute requireOrganizer>
                <div>
                  <Navigation />
                  <main>
                    <Events />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Redirect to login for unknown routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}
