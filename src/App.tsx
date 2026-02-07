import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import useAuthStore from './store/authStore';
import Landing from './pages/Landing';
import Shop from './pages/Shop';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Checkout from './pages/Checkout';
import ProductDetail from './pages/ProductDetail';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import PaymentPending from './pages/PaymentPending';
import Profile from './pages/Profile';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Bottles from './pages/admin/Bottles';
import Orders from './pages/admin/Orders';
import Categories from './pages/admin/Categories';
import Coupons from './pages/admin/Coupons';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';
import FluidBackground from './components/FluidBackground';
import AgeVerification from './components/AgeVerification';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { token, user } = useAuthStore();
  
  if (!token) return <Navigate to="/login" />;
  if (adminOnly && !user?.isAdmin) return <Navigate to="/" />;
  
  return <>{children}</>;
}

function AppContent() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/tienda" element={<Shop />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/restablecer-contraseña" element={<ResetPassword />} />
      <Route path="/producto/:slug" element={<ProductDetail />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/checkout/success" element={<PaymentSuccess />} />
      <Route path="/checkout/failure" element={<PaymentFailure />} />
      <Route path="/checkout/pending" element={<PaymentPending />} />
      <Route path="/perfil" element={<Profile />} />
      <Route path="/terminos" element={<Terms />} />
      <Route path="/privacidad" element={<Privacy />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <PrivateRoute adminOnly>
          <AdminLayout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="productos" element={<Products />} />
        <Route path="botellas" element={<Bottles />} />
        <Route path="pedidos" element={<Orders />} />
        <Route path="categorias" element={<Categories />} />
        <Route path="cupones" element={<Coupons />} />
        <Route path="usuarios" element={<Users />} />
        <Route path="configuracion" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  const [, setAgeVerified] = useState(() => {
    return localStorage.getItem('age_verified') === 'true';
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Age Verification Modal */}
        <AgeVerification onVerified={() => setAgeVerified(true)} />
        
        {/* Global Liquid Background - Persistent across all pages */}
        <FluidBackground />
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

