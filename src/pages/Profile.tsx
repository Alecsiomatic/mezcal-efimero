import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/client';
import './Profile.css';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  createdAt: string;
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingEmail?: string;
  shippingPhone?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip?: string;
  shippingCountry?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  items: OrderItem[];
  paymentReceipt?: string;
  paymentReceiptNotes?: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado'
};

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#06b6d4',
  delivered: '#10b981',
  cancelled: '#ef4444',
  refunded: '#6b7280'
};

const paymentStatusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'Fallido',
  refunded: 'Reembolsado'
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, logout, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'security'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  // Receipt upload
  const [uploadingReceipt, setUploadingReceipt] = useState<string | null>(null);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiptMessage, setReceiptMessage] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [token, navigate]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/my-orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage('');

    try {
      const response = await api.put('/users/profile', profileForm);
      updateProfile(response.data.user);
      setProfileMessage('Perfil actualizado correctamente');
    } catch (error: any) {
      setProfileMessage(error.response?.data?.error || 'Error al actualizar perfil');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('Las contraseñas no coinciden');
      setPasswordSaving(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage('La contraseña debe tener al menos 6 caracteres');
      setPasswordSaving(false);
      return;
    }

    try {
      await api.put('/users/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordMessage('Contraseña actualizada correctamente');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setPasswordMessage(error.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleUploadReceipt = async (orderId: string, file: File) => {
    setUploadingReceipt(orderId);
    setReceiptMessage('');

    const formData = new FormData();
    formData.append('receipt', file);
    if (receiptNotes) {
      formData.append('notes', receiptNotes);
    }

    try {
      await api.post(`/orders/${orderId}/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReceiptMessage('Comprobante enviado correctamente. Espera la confirmación del pago.');
      setReceiptNotes('');
      fetchOrders(); // Refresh orders to show updated status
    } catch (error: any) {
      setReceiptMessage(error.response?.data?.error || 'Error al subir comprobante');
    } finally {
      setUploadingReceipt(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  if (!token) return null;

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <div className="header-content">
          <Link to="/" className="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
          <Link to="/" className="profile-logo">
            <img src="/logo-efimero.png" alt="Efímero" />
          </Link>
          <Link to="/tienda" className="shop-link">Tienda</Link>
        </div>
      </header>

      <div className="profile-container">
        {/* Sidebar */}
        <motion.aside 
          className="profile-sidebar"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <h3>{user?.firstName} {user?.lastName}</h3>
            <p>{user?.email}</p>
          </div>

          <nav className="profile-nav">
            <button 
              className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Mis Pedidos
            </button>
            <button 
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Mi Perfil
            </button>
            <button 
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Seguridad
            </button>
            <button className="nav-item logout" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </nav>
        </motion.aside>

        {/* Main Content */}
        <main className="profile-main">
          <AnimatePresence mode="wait">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="profile-section"
              >
                <h2>Mis Pedidos</h2>
                
                {loading ? (
                  <div className="loading-orders">
                    <div className="spinner"></div>
                    <p>Cargando pedidos...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="no-orders">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3>No tienes pedidos aún</h3>
                    <p>Explora nuestra colección de mezcales artesanales</p>
                    <button onClick={() => navigate('/tienda')} className="shop-btn">
                      Ir a la Tienda
                    </button>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map((order) => (
                      <motion.div 
                        key={order.id} 
                        className="order-card"
                        layout
                      >
                        <div 
                          className="order-header"
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        >
                          <div className="order-info">
                            <span className="order-number">Pedido #{order.orderNumber}</span>
                            <span className="order-date">{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="order-status-total">
                            <span 
                              className="order-status"
                              style={{ backgroundColor: statusColors[order.status] }}
                            >
                              {statusLabels[order.status]}
                            </span>
                            <span className="order-total">{formatPrice(order.total)}</span>
                          </div>
                          <svg 
                            className={`expand-icon ${expandedOrder === order.id ? 'expanded' : ''}`}
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                          >
                            <path d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        <AnimatePresence>
                          {expandedOrder === order.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="order-details"
                            >
                              {/* Order Progress */}
                              {order.status !== 'cancelled' && order.status !== 'refunded' && (
                                <div className="order-progress">
                                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, index) => (
                                    <div 
                                      key={step}
                                      className={`progress-step ${getStatusStep(order.status) >= index ? 'completed' : ''} ${order.status === step ? 'current' : ''}`}
                                    >
                                      <div className="step-dot">
                                        {getStatusStep(order.status) > index && (
                                          <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                          </svg>
                                        )}
                                      </div>
                                      <span className="step-label">{statusLabels[step]}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Payment Status */}
                              <div className="order-payment">
                                <span className="label">Estado de pago:</span>
                                <span className={`payment-status ${order.paymentStatus}`}>
                                  {paymentStatusLabels[order.paymentStatus]}
                                </span>
                              </div>

                              {/* Upload Receipt - Show if payment is pending OR failed (allow retry) */}
                              {(order.paymentStatus === 'pending' || order.paymentStatus === 'failed') && (
                                <div className="upload-receipt-section">
                                  <h4>📤 {order.paymentReceipt ? 'Actualizar Comprobante' : 'Subir Comprobante de Pago'}</h4>
                                  <p className="receipt-help">
                                    {order.paymentStatus === 'failed' 
                                      ? 'Tu pago fue rechazado. Puedes subir un nuevo comprobante.'
                                      : 'Sube una foto o captura de pantalla de tu comprobante de transferencia para agilizar la confirmación.'
                                    }
                                  </p>
                                  <div className="receipt-upload-form">
                                    <input
                                      type="text"
                                      placeholder="Notas adicionales (opcional)"
                                      value={receiptNotes}
                                      onChange={(e) => setReceiptNotes(e.target.value)}
                                      className="receipt-notes-input"
                                    />
                                    <label className="upload-btn">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleUploadReceipt(order.id, file);
                                        }}
                                        disabled={uploadingReceipt === order.id}
                                        style={{ display: 'none' }}
                                      />
                                      {uploadingReceipt === order.id ? (
                                        <>
                                          <div className="mini-spinner"></div>
                                          Subiendo...
                                        </>
                                      ) : (
                                        <>
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                                          </svg>
                                          {order.paymentReceipt ? 'Cambiar Comprobante' : 'Seleccionar Comprobante'}
                                        </>
                                      )}
                                    </label>
                                  </div>
                                  {receiptMessage && expandedOrder === order.id && (
                                    <div className={`receipt-message ${receiptMessage.includes('Error') ? 'error' : 'success'}`}>
                                      {receiptMessage}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Show uploaded receipt with IMAGE */}
                              {order.paymentReceipt && (
                                <div className="receipt-uploaded">
                                  <h4>📷 Comprobante Enviado</h4>
                                  
                                  {/* Show the actual image */}
                                  <div className="receipt-image-container">
                                    <a href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://mezcalefimero.com'}${order.paymentReceipt}`} target="_blank" rel="noopener noreferrer">
                                      <img 
                                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://mezcalefimero.com'}${order.paymentReceipt}`} 
                                        alt="Comprobante de pago"
                                        className="receipt-image"
                                      />
                                      <span className="view-full-text">🔍 Click para ver completo</span>
                                    </a>
                                  </div>
                                  
                                  <div className="receipt-status">
                                    {order.paymentStatus === 'pending' ? (
                                      <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="icon-pending">
                                          <circle cx="12" cy="12" r="10" />
                                          <path d="M12 6v6l4 2" />
                                        </svg>
                                        <span>En revisión - Esperando confirmación del administrador</span>
                                      </>
                                    ) : order.paymentStatus === 'paid' ? (
                                      <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="icon-success">
                                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                          <path d="M22 4L12 14.01l-3-3" />
                                        </svg>
                                        <span>¡Pago confirmado!</span>
                                      </>
                                    ) : (
                                      <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="icon-error">
                                          <circle cx="12" cy="12" r="10" />
                                          <path d="M15 9l-6 6M9 9l6 6" />
                                        </svg>
                                        <span>Pago rechazado - Por favor sube otro comprobante</span>
                                      </>
                                    )}
                                  </div>
                                  {order.paymentReceiptNotes && (
                                    <p className="receipt-notes-display">Notas: {order.paymentReceiptNotes}</p>
                                  )}
                                </div>
                              )}

                              {/* Tracking */}
                              {order.trackingNumber && (
                                <div className="order-tracking">
                                  <span className="label">Número de rastreo:</span>
                                  {order.trackingUrl ? (
                                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                                      {order.trackingNumber}
                                    </a>
                                  ) : (
                                    <span>{order.trackingNumber}</span>
                                  )}
                                </div>
                              )}

                              {/* Shipping Address */}
                              <div className="order-address">
                                <h4>📍 Dirección de Envío</h4>
                                <div className="address-details">
                                  {order.shippingFirstName && (
                                    <p className="recipient-name">
                                      <strong>{order.shippingFirstName} {order.shippingLastName}</strong>
                                    </p>
                                  )}
                                  {order.shippingPhone && <p className="recipient-phone">📞 {order.shippingPhone}</p>}
                                  <p className="address-line">{order.shippingAddress || 'Sin dirección'}</p>
                                  <p className="address-city">
                                    {order.shippingCity}, {order.shippingState} {order.shippingZip}
                                  </p>
                                  {order.shippingCountry && <p className="address-country">{order.shippingCountry}</p>}
                                </div>
                              </div>

                              {/* Order Items */}
                              <div className="order-items">
                                <h4>Productos</h4>
                                {order.items?.map((item) => (
                                  <div key={item.id} className="order-item">
                                    <div className="item-info">
                                      <span className="item-name">{item.productName}</span>
                                      <span className="item-qty">x{item.quantity}</span>
                                    </div>
                                    <span className="item-price">{formatPrice(item.total)}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Order Summary */}
                              <div className="order-summary">
                                <div className="summary-row">
                                  <span>Subtotal</span>
                                  <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                {order.discount > 0 && (
                                  <div className="summary-row discount">
                                    <span>Descuento</span>
                                    <span>-{formatPrice(order.discount)}</span>
                                  </div>
                                )}
                                <div className="summary-row">
                                  <span>Envío</span>
                                  <span>{order.shipping > 0 ? formatPrice(order.shipping) : 'Gratis'}</span>
                                </div>
                                <div className="summary-row total">
                                  <span>Total</span>
                                  <span>{formatPrice(order.total)}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="profile-section"
              >
                <h2>Mi Perfil</h2>
                
                <form onSubmit={handleProfileSubmit} className="profile-form">
                  <div className="form-group">
                    <label>Correo electrónico</label>
                    <input 
                      type="email" 
                      value={user?.email || ''} 
                      disabled 
                      className="disabled"
                    />
                    <span className="help-text">El correo no se puede cambiar</span>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombre</label>
                      <input 
                        type="text" 
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Apellido</label>
                      <input 
                        type="text" 
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Teléfono</label>
                    <input 
                      type="tel" 
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  {profileMessage && (
                    <div className={`form-message ${profileMessage.includes('Error') ? 'error' : 'success'}`}>
                      {profileMessage}
                    </div>
                  )}

                  <button type="submit" className="save-btn" disabled={profileSaving}>
                    {profileSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="profile-section"
              >
                <h2>Seguridad</h2>
                
                <form onSubmit={handlePasswordSubmit} className="profile-form">
                  <div className="form-group">
                    <label>Contraseña actual</label>
                    <input 
                      type="password" 
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Nueva contraseña</label>
                    <input 
                      type="password" 
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                    <span className="help-text">Mínimo 6 caracteres</span>
                  </div>

                  <div className="form-group">
                    <label>Confirmar nueva contraseña</label>
                    <input 
                      type="password" 
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>

                  {passwordMessage && (
                    <div className={`form-message ${passwordMessage.includes('Error') || passwordMessage.includes('no coinciden') ? 'error' : 'success'}`}>
                      {passwordMessage}
                    </div>
                  )}

                  <button type="submit" className="save-btn" disabled={passwordSaving}>
                    {passwordSaving ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                </form>

                <div className="security-info">
                  <h4>Información de la cuenta</h4>
                  <div className="info-row">
                    <span>Miembro desde</span>
                    <span>{user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span>Último acceso</span>
                    <span>{user?.lastLogin ? formatDate(user.lastLogin) : 'N/A'}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
