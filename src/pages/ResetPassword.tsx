import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import api from '../api/client';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setMessage({ type: 'error', text: 'Link inválido o expirado' });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
      });
      setMessage({ type: 'success', text: response.data.message || 'Contraseña restablecida exitosamente' });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error al restablecer la contraseña',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <Link to="/login" className="back-link">
          <ArrowLeft size={20} /> Volver
        </Link>

        {success ? (
          <>
            <div className="auth-header">
              <CheckCircle size={40} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
              <p>¡Éxito!</p>
            </div>
            <div className="success-message" style={{ textAlign: 'center' }}>
              Tu contraseña ha sido restablecida. Redirigiendo al login...
            </div>
          </>
        ) : (
          <>
            <div className="auth-header">
              <img src="/logo-efimero.png" alt="Efímero" className="auth-logo" />
              <p>Restablecer Contraseña</p>
            </div>

            <form onSubmit={handleSubmit}>
              {message && (
                <div className={`error-message ${message.type === 'success' ? 'success-message' : ''}`}>
                  {message.text}
                </div>
              )}

              <div className="password-field">
                <GlassInput
                  label="Nueva Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={!token}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={!token}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="password-field">
                <GlassInput
                  label="Confirmar Contraseña"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={!token}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  disabled={!token}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !token}
                style={{ width: '100%' }}
              >
                {loading ? 'Procesando...' : 'Restablecer Contraseña'}
              </GlassButton>
            </form>

            <p className="auth-footer">
              ¿Recuerdas tu contraseña? <Link to="/login">Inicia sesión</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
