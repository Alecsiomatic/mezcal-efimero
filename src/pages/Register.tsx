import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import { COUNTRIES, getCountryByCode, getLadaByState } from '../data/phoneData';
import './Auth.css';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    lastName2: '', // Apellido materno
    email: '',
    country: 'MX',
    state: 'San Luis Potosí',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Obtener datos del país y estado seleccionados
  const selectedCountry = getCountryByCode(formData.country);
  const currentLada = getLadaByState(formData.country, formData.state);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Si cambia el país, resetear el estado al primero de ese país
    if (name === 'country') {
      const newCountry = getCountryByCode(value);
      setFormData(prev => ({
        ...prev,
        country: value,
        state: newCountry?.states[0]?.name || '',
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Construir número de teléfono completo
    const fullPhone = selectedCountry 
      ? `${selectedCountry.phoneCode}${currentLada ? ` (${currentLada})` : ''} ${formData.phone}`
      : formData.phone;

    const success = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      lastName2: formData.lastName2,
      email: formData.email,
      phone: fullPhone,
      country: formData.country,
      state: formData.state,
      password: formData.password
    });

    if (success) navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <Link to="/" className="back-link">
          <ArrowLeft size={20} /> Volver
        </Link>

        <div className="auth-header">
          <img src="/logo-efimero.png" alt="Efímero" className="auth-logo" />
          <p>Crear Cuenta</p>
        </div>

        <form onSubmit={handleSubmit}>
          {(error || localError) && (
            <div className="error-message" onClick={clearError}>
              {error || localError}
            </div>
          )}

          <div className="form-row">
            <GlassInput
              label="Nombre"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Juan"
              required
            />
            <GlassInput
              label="Apellido Paterno"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Pérez"
              required
            />
          </div>

          <GlassInput
            label="Apellido Materno (opcional)"
            type="text"
            name="lastName2"
            value={formData.lastName2}
            onChange={handleChange}
            placeholder="García"
          />

          <GlassInput
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            required
          />

          {/* País y Estado */}
          <div className="form-row">
            <div className="glass-input-wrapper">
              <label className="glass-input-label">País</label>
              <select 
                name="country" 
                value={formData.country} 
                onChange={handleChange} 
                className="glass-select"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1rem'
                }}
              >
                {COUNTRIES.map(country => (
                  <option key={country.code} value={country.code} style={{ background: '#1a1a2e', color: 'white' }}>
                    {country.name} ({country.phoneCode})
                  </option>
                ))}
              </select>
            </div>
            {selectedCountry && selectedCountry.states.length > 1 ? (
              <div className="glass-input-wrapper">
                <label className="glass-input-label">Estado</label>
                <select 
                  name="state" 
                  value={formData.state} 
                  onChange={handleChange} 
                  className="glass-select"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                >
                  {selectedCountry.states.map(state => (
                    <option key={state.name} value={state.name} style={{ background: '#1a1a2e', color: 'white' }}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <GlassInput
                label="Estado/Provincia"
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Tu estado"
              />
            )}
          </div>

          {/* Teléfono con código de área */}
          <div className="glass-input-wrapper">
            <label className="glass-input-label">Teléfono (opcional)</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ 
                background: 'rgba(212, 175, 55, 0.15)', 
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '12px',
                padding: '0.875rem 1rem',
                color: '#D4AF37',
                fontWeight: '600',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap'
              }}>
                {selectedCountry?.phoneCode}{currentLada ? ` (${currentLada})` : ''}
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={currentLada ? "123 4567" : "Número"}
                style={{
                  flex: 1,
                  padding: '0.875rem 1rem',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div className="password-field">
            <GlassInput
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
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

          <GlassInput
            label="Confirmar Contraseña"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder=""
            required
          />

          <GlassButton type="submit" variant="primary" size="lg" disabled={isLoading} style={{ width: '100%' }}>
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </GlassButton>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  );
}
