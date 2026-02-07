import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../../api/client';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [mpValidation, setMpValidation] = useState<{ type: 'success' | 'error' | 'loading'; message: string } | null>(null);

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/admin/settings');
      return data.settings || [];
    }
  });

  useEffect(() => {
    if (data) {
      const obj: Record<string, string> = {};
      data.forEach((s: any) => { obj[s.key] = s.value; });
      setSettings(obj);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (settings: any) => api.put('/admin/settings', { settings }),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  });

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(Object.entries(settings).map(([key, value]) => ({ key, value })));
  };

  const tabs = [
    { id: 'general', label: '🏪 General' },
    { id: 'payment', label: '💳 MercadoPago' },
    { id: 'transfer', label: '🏦 Transferencia' },
    { id: 'shipping', label: '📦 Envíos' },
    { id: 'email', label: '✉️ Email' }
  ];

  const validateMercadoPago = async () => {
    const accessToken = settings.mp_access_token;
    const publicKey = settings.mp_public_key;
    
    if (!accessToken || !publicKey) {
      setMpValidation({ type: 'error', message: 'Ingresa Access Token y Public Key' });
      return;
    }
    
    setMpValidation({ type: 'loading', message: 'Validando credenciales...' });
    
    try {
      const { data } = await api.post('/admin/settings/validate-mercadopago', {
        accessToken,
        publicKey
      });
      
      if (data.valid) {
        setMpValidation({ 
          type: 'success', 
          message: `✓ Credenciales válidas - Cuenta: ${data.email} (${data.siteId})` 
        });
      } else {
        setMpValidation({ 
          type: 'error', 
          message: data.error || 'Credenciales inválidas' 
        });
      }
    } catch (err: any) {
      setMpValidation({ 
        type: 'error', 
        message: err.response?.data?.error || 'Error al validar credenciales' 
      });
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) return;
    setEmailStatus(null);
    try {
      const response = await api.post('/admin/settings/test-email', { email: testEmail });
      if (response.data.success) {
        setEmailStatus({ type: 'success', message: 'Email de prueba enviado correctamente' });
      } else {
        setEmailStatus({ type: 'error', message: response.data.error || 'Error al enviar email' });
      }
    } catch (err: any) {
      setEmailStatus({ type: 'error', message: err.response?.data?.error || 'Error al enviar email' });
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Configuracion</h1>
        <button className="btn-primary" onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Guardando...' : ' Guardar Cambios'}
        </button>
      </div>

      {saved && <div className="alert success">Configuracion guardada exitosamente</div>}

      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>Informacion de la Tienda</h3>
              <div className="form-group">
                <label>Nombre de la Tienda</label>
                <input value={settings.store_name || ''} onChange={e => updateSetting('store_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email de Contacto</label>
                <input type="email" value={settings.store_email || ''} onChange={e => updateSetting('store_email', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Telefono</label>
                <input value={settings.store_phone || ''} onChange={e => updateSetting('store_phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Direccion</label>
                <textarea value={settings.store_address || ''} onChange={e => updateSetting('store_address', e.target.value)} />
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="settings-section">
              <h3>MercadoPago</h3>
              <div className="form-group">
                <label>Access Token</label>
                <input type="password" value={settings.mp_access_token || ''} onChange={e => updateSetting('mp_access_token', e.target.value)} placeholder="APP_USR-..." />
                <small>Obtenlo en developers.mercadopago.com</small>
              </div>
              <div className="form-group">
                <label>Public Key</label>
                <input value={settings.mp_public_key || ''} onChange={e => updateSetting('mp_public_key', e.target.value)} placeholder="APP_USR-..." />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={settings.mp_sandbox === 'true'} onChange={e => updateSetting('mp_sandbox', e.target.checked ? 'true' : 'false')} />
                  Modo Sandbox (Pruebas)
                </label>
              </div>
              
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button 
                  onClick={validateMercadoPago}
                  disabled={mpValidation?.type === 'loading'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(212, 175, 55, 0.2)',
                    border: '1px solid rgba(212, 175, 55, 0.5)',
                    borderRadius: '8px',
                    color: '#D4AF37',
                    cursor: mpValidation?.type === 'loading' ? 'not-allowed' : 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}
                >
                  {mpValidation?.type === 'loading' ? (
                    <Loader2 size={18} className="spin" />
                  ) : mpValidation?.type === 'success' ? (
                    <CheckCircle size={18} />
                  ) : mpValidation?.type === 'error' ? (
                    <XCircle size={18} />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  {mpValidation?.type === 'loading' ? 'Validando...' : 'Validar Credenciales'}
                </button>
                
                {mpValidation && mpValidation.type !== 'loading' && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: mpValidation.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${mpValidation.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: mpValidation.type === 'success' ? '#22c55e' : '#ef4444',
                    fontSize: '0.9rem'
                  }}>
                    {mpValidation.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="settings-section">
              <h3>Datos Bancarios para Transferencia</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Estos datos se mostrarán a los clientes cuando elijan pagar por transferencia.
              </p>
              <div className="form-group">
                <label>Banco</label>
                <input value={settings.bank_name || ''} onChange={e => updateSetting('bank_name', e.target.value)} placeholder="BBVA, Santander, Banorte..." />
              </div>
              <div className="form-group">
                <label>Titular de la Cuenta</label>
                <input value={settings.bank_holder || ''} onChange={e => updateSetting('bank_holder', e.target.value)} placeholder="Nombre completo o razón social" />
              </div>
              <div className="form-group">
                <label>CLABE Interbancaria (18 dígitos)</label>
                <input value={settings.bank_clabe || ''} onChange={e => updateSetting('bank_clabe', e.target.value)} placeholder="012180001234567890" maxLength={18} />
                <small>Esta CLABE se usa para transferencias SPEI</small>
              </div>
              <div className="form-group">
                <label>Número de Tarjeta (opcional)</label>
                <input value={settings.bank_card || ''} onChange={e => updateSetting('bank_card', e.target.value)} placeholder="4152 3138 0000 0000" maxLength={19} />
                <small>Para depósitos en tiendas de conveniencia</small>
              </div>
              <div className="form-group">
                <label>Email para Comprobantes</label>
                <input type="email" value={settings.bank_email || ''} onChange={e => updateSetting('bank_email', e.target.value)} placeholder="pagos@tutienda.com" />
                <small>Donde los clientes enviarán sus comprobantes (opcional)</small>
              </div>
              <div className="form-group">
                <label>Instrucciones Adicionales (opcional)</label>
                <textarea 
                  value={settings.bank_instructions || ''} 
                  onChange={e => updateSetting('bank_instructions', e.target.value)} 
                  placeholder="Ej: Una vez realizada la transferencia, sube tu comprobante en 'Mi cuenta' para agilizar el proceso."
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.transfer_enabled === 'true'} 
                    onChange={e => updateSetting('transfer_enabled', e.target.checked ? 'true' : 'false')} 
                  />
                  Habilitar pago por transferencia
                </label>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="settings-section">
              <h3>Configuracion de Envios</h3>
              <div className="form-group">
                <label>Costo de Envio Estandar</label>
                <input type="number" value={settings.shipping_cost || ''} onChange={e => updateSetting('shipping_cost', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Envio Gratis a partir de (MXN)</label>
                <input type="number" value={settings.free_shipping_min || ''} onChange={e => updateSetting('free_shipping_min', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Tiempo de Entrega</label>
                <input value={settings.delivery_time || ''} onChange={e => updateSetting('delivery_time', e.target.value)} placeholder="3-5 dias habiles" />
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="settings-section">
              <h3>Configuracion de Email</h3>
              
              <div style={{ 
                background: 'rgba(212, 175, 55, 0.1)', 
                border: '1px solid rgba(212, 175, 55, 0.3)', 
                borderRadius: '12px', 
                padding: '1.25rem', 
                marginBottom: '1.5rem' 
              }}>
                <h4 style={{ color: '#D4AF37', margin: '0 0 0.75rem', fontSize: '1rem' }}>📬 Email de Notificaciones Admin</h4>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                  A este correo llegarán las notificaciones de nuevos pedidos, pagos recibidos y eventos importantes.
                </p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Email del Administrador</label>
                  <input 
                    type="email" 
                    value={settings.admin_notification_email || ''} 
                    onChange={e => updateSetting('admin_notification_email', e.target.value)} 
                    placeholder="admin@tutienda.com"
                  />
                  <small>Puedes poner varios correos separados por coma: admin1@tienda.com, admin2@tienda.com</small>
                </div>
              </div>

              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.9)' }}>🔧 Configuración SMTP (Servidor de correo)</h4>
              <div className="form-group">
                <label>Host SMTP</label>
                <input value={settings.smtp_host || ''} onChange={e => updateSetting('smtp_host', e.target.value)} placeholder="smtp.gmail.com" />
              </div>
              <div className="form-group">
                <label>Puerto SMTP</label>
                <input value={settings.smtp_port || ''} onChange={e => updateSetting('smtp_port', e.target.value)} placeholder="587 o 465" />
                <small>Usa 465 para SSL o 587 para TLS</small>
              </div>
              <div className="form-group">
                <label>Usuario SMTP (Email remitente)</label>
                <input value={settings.smtp_user || ''} onChange={e => updateSetting('smtp_user', e.target.value)} placeholder="noreply@tudominio.com" />
              </div>
              <div className="form-group">
                <label>Password SMTP</label>
                <input type="password" value={settings.smtp_pass || ''} onChange={e => updateSetting('smtp_pass', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Nombre del Remitente (opcional)</label>
                <input value={settings.smtp_from_name || ''} onChange={e => updateSetting('smtp_from_name', e.target.value)} placeholder="EFÍMERO Mezcal" />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.smtp_secure === 'true'} 
                    onChange={e => updateSetting('smtp_secure', e.target.checked ? 'true' : 'false')} 
                  />
                  Usar SSL/TLS (recomendado para puerto 465)
                </label>
              </div>
              
              <div className="email-test-section">
                <h4>Probar Configuración</h4>
                {emailStatus && (
                  <div className={`alert ${emailStatus.type}`}>{emailStatus.message}</div>
                )}
                <div className="form-row">
                  <input 
                    type="email" 
                    placeholder="email@ejemplo.com" 
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                  />
                  <button type="button" className="btn-secondary" onClick={sendTestEmail}>
                    <Send size={16} /> Enviar Prueba
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
