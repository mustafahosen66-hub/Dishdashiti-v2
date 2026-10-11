import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import NewMeasurement from './pages/NewMeasurement';
import Orders from './pages/Orders';
import NewOrder from './pages/NewOrder';
import OrderDetail from './pages/OrderDetail';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Invoice from './pages/Invoice';
import Expired from './pages/Expired';
import Renew from './pages/Renew';
import OwnerDashboard from './pages/OwnerDashboard';
import Layout from './components/Layout';

const qc = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 0 } },
});

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isExpired, isBlocked } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        جارٍ التحميل...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // فحص الاشتراك — إلا إذا كان المالك
  if (isBlocked() || isExpired()) {
    return <Expired />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// الصفحة الرئيسية: المالك → /owner، المستخدم العادي → Dashboard
function RootRoute() {
  const { tenant } = useAuth();
  if (tenant?.is_owner) return <Navigate to="/owner" replace />;
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Root */}
            <Route path="/" element={<ProtectedRoute><RootRoute /></ProtectedRoute>} />

            {/* Owner Dashboard */}
            <Route path="/owner" element={<ProtectedRoute><Layout><OwnerDashboard /></Layout></ProtectedRoute>} />

            {/* Customers */}
            <Route path="/customers" element={<ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>} />
            <Route path="/customers/:id" element={<ProtectedRoute><Layout><CustomerDetail /></Layout></ProtectedRoute>} />
            <Route path="/customers/:id/measurements/new" element={<ProtectedRoute><Layout><NewMeasurement /></Layout></ProtectedRoute>} />

            {/* Orders */}
            <Route path="/orders" element={<ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>} />
            <Route path="/orders/new" element={<ProtectedRoute><Layout><NewOrder /></Layout></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><Layout><OrderDetail /></Layout></ProtectedRoute>} />
            <Route path="/orders/:id/invoice" element={<ProtectedRoute><Layout><Invoice /></Layout></ProtectedRoute>} />

            {/* Expenses & Reports */}
            <Route path="/expenses" element={<ProtectedRoute><Layout><Expenses /></Layout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />

            {/* Renew */}
            <Route path="/renew" element={<ProtectedRoute><Layout><Renew /></Layout></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}