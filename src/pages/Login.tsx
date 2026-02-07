import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
import useAuthStore from '../store/authStore';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import api from '../api/client';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      const user = useAuthStore.getState().user;
      navigate(user?.isAdmin ? '/admin' : '/');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage(null);
    
    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMessage({ type: 'success', text: response.data.message || 'Revisa tu correo para restablecer tu contraseña' });
      setForgotEmail('');
      setTimeout(() => setShowForgot(false), 3000);
    } catch (error: any) {
      setForgotMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error al enviar el correo' 
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <Link to="/" className="back-link">
          <ArrowLeft size={20} /> Volver
        </Link>
        
        {!showForgot ? (
          <>
            <div className="auth-header">
              <img src="/logo-efimero.png" alt="Efímero" className="auth-logo" />
              <p>Iniciar Sesión</p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="error-message" onClick={clearError}>
                  {error}
                </div>
              )}

              <GlassInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />

              <div className="password-field">
                <GlassInput
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <GlassButton type="submit" variant="primary" size="lg" disabled={isLoading} style={{ width: '100%' }}>
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </GlassButton>
            </form>

            <button 
              onClick={() => setShowForgot(true)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#D4AF37', 
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.9rem',
                marginTop: '1rem',
                display: 'block',
                width: '100%',
                textAlign: 'center'
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>

            <p className="auth-footer">
              ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
            </p>
          </>
        ) : (
          <>
            <div className="auth-header">
              <Mail size={40} style={{ color: '#D4AF37', marginBottom: '0.5rem' }} />
              <p>Recuperar Contraseña</p>
            </div>

            <form onSubmit={handleForgotSubmit}>
              {forgotMessage && (
                <div className={`error-message ${forgotMessage.type === 'success' ? 'success-message' : ''}`}>
                  {forgotMessage.text}
                </div>
              )}

              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Ingresa tu email y te enviaremos un link para restablecer tu contraseña.
              </p>

              <GlassInput
                label="Email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />

              <GlassButton type="submit" variant="primary" size="lg" disabled={forgotLoading} style={{ width: '100%' }}>
                {forgotLoading ? 'Enviando...' : 'Enviar Link de Recuperación'}
              </GlassButton>
            </form>

            <button 
              onClick={() => setShowForgot(false)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#D4AF37', 
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.9rem',
                marginTop: '1rem',
                display: 'block',
                width: '100%',
                textAlign: 'center'
              }}
            >
              Volver al login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
