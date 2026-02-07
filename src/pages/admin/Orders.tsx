import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Package, Truck, CheckCircle, XCircle, CreditCard, Clock, AlertCircle, Search, Mail, Image } from 'lucide-react';
import api from '../../api/client';

interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
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
  notes?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingEmail?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingCountry?: string;
  paymentReceipt?: string;
  paymentReceiptNotes?: string;
  user?: { id: string; firstName: string; lastName: string; email: string; phone?: string };
  items?: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendiente', color: '#f59e0b', icon: Clock },
  confirmed: { label: 'Confirmado', color: '#3b82f6', icon: CheckCircle },
  processing: { label: 'En Proceso', color: '#8b5cf6', icon: Package },
  shipped: { label: 'Enviado', color: '#06b6d4', icon: Truck },
  delivered: { label: 'Entregado', color: '#22c55e', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: '#ef4444', icon: XCircle },
  refunded: { label: 'Reembolsado', color: '#6b7280', icon: AlertCircle }
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: '#f59e0b' },
  paid: { label: 'Pagado', color: '#22c55e' },
  failed: { label: 'Fallido', color: '#ef4444' },
  refunded: { label: 'Reembolsado', color: '#6b7280' }
};

export default function Orders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [trackingForm, setTrackingForm] = useState({ trackingNumber: '', trackingUrl: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', filterStatus, filterPayment, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPayment) params.append('paymentStatus', filterPayment);
      if (searchTerm) params.append('search', searchTerm);
      const { data } = await api.get(`/admin/orders?${params.toString()}`);
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/admin/orders/${id}/status`, { status }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (selectedOrder) setSelectedOrder({ ...selectedOrder, status: response.data.order.status });
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: string }) =>
      api.put(`/admin/orders/${id}/payment-status`, { paymentStatus }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (selectedOrder) setSelectedOrder({ ...selectedOrder, paymentStatus: response.data.order.paymentStatus });
    }
  });

  const updateTrackingMutation = useMutation({
    mutationFn: ({ id, trackingNumber, trackingUrl }: { id: string; trackingNumber: string; trackingUrl?: string }) =>
      api.put(`/admin/orders/${id}/tracking`, { trackingNumber, trackingUrl }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, trackingNumber: response.data.order.trackingNumber, trackingUrl: response.data.order.trackingUrl });
      }
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.put(`/admin/orders/${id}/cancel`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedOrder(null);
    }
  });

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setTrackingForm({ trackingNumber: order.trackingNumber || '', trackingUrl: order.trackingUrl || '' });
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatPrice = (price: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0);

  // Count orders with receipts pending verification
  const pendingReceipts = data?.orders?.filter((o: Order) => o.paymentReceipt && o.paymentStatus === 'pending').length || 0;

  return (
    <div className="page-orders">
      <div className="page-header">
        <h1>Gestión de Pedidos</h1>
        <div className="header-stats">
          <div className="stat"><span className="stat-value">{data?.orders?.length || 0}</span><span className="stat-label">Total</span></div>
          <div className="stat pending"><span className="stat-value">{data?.orders?.filter((o: Order) => o.status === 'pending').length || 0}</span><span className="stat-label">Pendientes</span></div>
          {pendingReceipts > 0 && (
            <div className="stat receipt-alert">
              <span className="stat-value">{pendingReceipts}</span>
              <span className="stat-label">Comprobantes</span>
            </div>
          )}
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Buscar por # pedido, cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmados</option>
          <option value="processing">En Proceso</option>
          <option value="shipped">Enviados</option>
          <option value="delivered">Entregados</option>
          <option value="cancelled">Cancelados</option>
        </select>
        <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
          <option value="">Todos los pagos</option>
          <option value="pending">Pago Pendiente</option>
          <option value="paid">Pagado</option>
          <option value="failed">Pago Fallido</option>
        </select>
      </div>

      {isLoading ? <div className="loading">Cargando pedidos...</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Comprobante</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.orders?.length === 0 ? (
                <tr><td colSpan={8} className="empty-state">No hay pedidos</td></tr>
              ) : (
                data?.orders?.map((order: Order) => {
                  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
                  const payment = PAYMENT_STATUS_MAP[order.paymentStatus] || PAYMENT_STATUS_MAP.pending;
                  const hasReceiptPending = order.paymentReceipt && order.paymentStatus === 'pending';
                  return (
                    <tr key={order.id} className={hasReceiptPending ? 'row-highlight' : ''}>
                      <td><span className="order-number">#{order.orderNumber}</span></td>
                      <td><div className="customer-info"><span className="name">{order.user?.firstName} {order.user?.lastName}</span><span className="email">{order.user?.email}</span></div></td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td className="total-cell">{formatPrice(order.total)}</td>
                      <td><span className="status-badge" style={{ background: status.color }}>{status.label}</span></td>
                      <td><span className="payment-badge" style={{ background: payment.color }}>{payment.label}</span></td>
                      <td>
                        {order.paymentReceipt ? (
                          <button 
                            className={`btn-receipt ${hasReceiptPending ? 'pending' : ''}`}
                            onClick={() => openOrderDetail(order)}
                            title="Ver comprobante"
                          >
                            <Image size={16} />
                            {hasReceiptPending && <span className="receipt-dot"></span>}
                          </button>
                        ) : (
                          <span className="no-receipt">—</span>
                        )}
                      </td>
                      <td><div className="actions"><button className="btn-icon" title="Ver detalle" onClick={() => openOrderDetail(order)}><Eye size={16} /></button></div></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Pedido #{selectedOrder.orderNumber}</h2>
              <span className="order-date">{formatDate(selectedOrder.createdAt)}</span>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h3><Package size={18} /> Estado del Pedido</h3>
                  <select className="status-select" value={selectedOrder.status} onChange={(e) => updateStatusMutation.mutate({ id: selectedOrder.id, status: e.target.value })} disabled={updateStatusMutation.isPending}>
                    {Object.entries(STATUS_MAP).map(([key, { label }]) => (<option key={key} value={key}>{label}</option>))}
                  </select>
                  <div className="status-timeline">
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                      const stepIdx = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(selectedOrder.status);
                      const isCompleted = idx <= stepIdx && selectedOrder.status !== 'cancelled';
                      const isCurrent = step === selectedOrder.status;
                      return (<div key={step} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}><div className="step-dot" /><span>{STATUS_MAP[step]?.label}</span></div>);
                    })}
                  </div>
                </div>

                <div className="detail-section">
                  <h3><CreditCard size={18} /> Estado del Pago</h3>
                  <select className="payment-select" value={selectedOrder.paymentStatus} onChange={(e) => updatePaymentMutation.mutate({ id: selectedOrder.id, paymentStatus: e.target.value })} disabled={updatePaymentMutation.isPending}>
                    {Object.entries(PAYMENT_STATUS_MAP).map(([key, { label }]) => (<option key={key} value={key}>{label}</option>))}
                  </select>
                  <div className={`payment-indicator ${selectedOrder.paymentStatus}`}>
                    {selectedOrder.paymentStatus === 'paid' ? <><CheckCircle size={16} /> Pago confirmado</> : selectedOrder.paymentStatus === 'pending' ? <><Clock size={16} /> Esperando pago</> : <><AlertCircle size={16} /> {PAYMENT_STATUS_MAP[selectedOrder.paymentStatus]?.label}</>}
                  </div>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-section">
                  <h3>👤 Cliente</h3>
                  <div className="info-card">
                    <p className="primary">{selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</p>
                    <p><Mail size={14} /> {selectedOrder.user?.email}</p>
                    {selectedOrder.user?.phone && <p>📞 {selectedOrder.user.phone}</p>}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>📦 Dirección de Envío</h3>
                  <div className="info-card">
                    <p className="primary">{selectedOrder.shippingFirstName} {selectedOrder.shippingLastName}</p>
                    <p>{selectedOrder.shippingAddress}</p>
                    <p>{selectedOrder.shippingCity}, {selectedOrder.shippingState} {selectedOrder.shippingZip}</p>
                    <p>{selectedOrder.shippingCountry}</p>
                    {selectedOrder.shippingPhone && <p>📞 {selectedOrder.shippingPhone}</p>}
                  </div>
                </div>
              </div>

              <div className="detail-section tracking-section">
                <h3><Truck size={18} /> Información de Envío</h3>
                <div className="tracking-form">
                  <div className="form-row">
                    <div className="form-group"><label>Número de Rastreo</label><input type="text" placeholder="Ej: 1Z999AA10123456784" value={trackingForm.trackingNumber} onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })} /></div>
                    <div className="form-group"><label>URL de Rastreo (opcional)</label><input type="url" placeholder="https://..." value={trackingForm.trackingUrl} onChange={(e) => setTrackingForm({ ...trackingForm, trackingUrl: e.target.value })} /></div>
                    <button className="btn-primary" onClick={() => updateTrackingMutation.mutate({ id: selectedOrder.id, trackingNumber: trackingForm.trackingNumber, trackingUrl: trackingForm.trackingUrl })} disabled={!trackingForm.trackingNumber || updateTrackingMutation.isPending}>{updateTrackingMutation.isPending ? 'Guardando...' : 'Guardar Tracking'}</button>
                  </div>
                  {selectedOrder.trackingNumber && (<div className="current-tracking"><span>Tracking actual: <strong>{selectedOrder.trackingNumber}</strong></span>{selectedOrder.trackingUrl && <a href={selectedOrder.trackingUrl} target="_blank" rel="noopener noreferrer">Ver rastreo →</a>}</div>)}
                </div>
              </div>

              {/* SECCIÓN DE VERIFICACIÓN DE COMPROBANTE */}
              <div className="detail-section receipt-section">
                <h3><Image size={18} /> Comprobante de Pago</h3>
                
                {selectedOrder.paymentReceipt ? (
                  <div className="receipt-verification">
                    <div className="receipt-status-header">
                      <span className={`receipt-badge ${selectedOrder.paymentStatus}`}>
                        {selectedOrder.paymentStatus === 'paid' ? '✅ Verificado' : 
                         selectedOrder.paymentStatus === 'failed' ? '❌ Rechazado' : 
                         '⏳ Pendiente de Verificar'}
                      </span>
                    </div>
                    
                    <div className="receipt-content">
                      <div className="receipt-image-box">
                        <a 
                          href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://mezcalefimero.com'}${selectedOrder.paymentReceipt}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <img 
                            src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://mezcalefimero.com'}${selectedOrder.paymentReceipt}`}
                            alt="Comprobante de pago"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect fill="%23222" width="200" height="150"/><text fill="%23666" font-size="12" x="50%" y="50%" text-anchor="middle">Error al cargar</text></svg>';
                            }}
                          />
                          <span className="view-full">🔍 Ver imagen completa</span>
                        </a>
                      </div>
                      
                      <div className="receipt-info-box">
                        <div className="amount-to-verify">
                          <span className="label">Total a verificar</span>
                          <span className="amount">{formatPrice(selectedOrder.total)}</span>
                        </div>
                        
                        {selectedOrder.paymentReceiptNotes && (
                          <div className="receipt-notes">
                            <strong>📝 Notas del cliente:</strong>
                            <p>{selectedOrder.paymentReceiptNotes}</p>
                          </div>
                        )}
                        
                        {selectedOrder.paymentStatus === 'pending' && (
                          <div className="receipt-actions">
                            <button 
                              className="btn-confirm"
                              onClick={() => updatePaymentMutation.mutate({ id: selectedOrder.id, paymentStatus: 'paid' })}
                              disabled={updatePaymentMutation.isPending}
                            >
                              <CheckCircle size={18} />
                              Confirmar Pago
                            </button>
                            <button 
                              className="btn-reject"
                              onClick={() => updatePaymentMutation.mutate({ id: selectedOrder.id, paymentStatus: 'failed' })}
                              disabled={updatePaymentMutation.isPending}
                            >
                              <XCircle size={18} />
                              Rechazar
                            </button>
                          </div>
                        )}
                        
                        {selectedOrder.paymentStatus === 'paid' && (
                          <div className="payment-confirmed">
                            <CheckCircle size={20} />
                            <span>Pago verificado y confirmado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-receipt-message">
                    <AlertCircle size={32} />
                    <p>El cliente no ha subido comprobante de pago</p>
                    <span>Si pagó por transferencia, el cliente puede subir el comprobante desde su perfil</span>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h3>🛒 Productos</h3>
                <table className="items-table">
                  <thead><tr><th>Producto</th><th>SKU</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr></thead>
                  <tbody>
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td>{item.productName}</td>
                        <td><code>{item.productSku}</code></td>
                        <td>{item.quantity}</td>
                        <td>{formatPrice(item.price)}</td>
                        <td>{formatPrice(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="order-totals">
                  <div className="total-row"><span>Subtotal</span><span>{formatPrice(selectedOrder.subtotal)}</span></div>
                  {selectedOrder.discount > 0 && <div className="total-row discount"><span>Descuento</span><span>-{formatPrice(selectedOrder.discount)}</span></div>}
                  <div className="total-row"><span>Envío</span><span>{selectedOrder.shipping > 0 ? formatPrice(selectedOrder.shipping) : 'Gratis'}</span></div>
                  <div className="total-row grand-total"><span>Total</span><span>{formatPrice(selectedOrder.total)}</span></div>
                </div>
              </div>

              {selectedOrder.notes && (<div className="detail-section"><h3>📝 Notas del Cliente</h3><p className="notes-text">{selectedOrder.notes}</p></div>)}
            </div>

            <div className="modal-footer">
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (<button className="btn-danger" onClick={() => setShowCancelModal(true)}>Cancelar Pedido</button>)}
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal cancel-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancelar Pedido #{selectedOrder.orderNumber}</h3>
            <p>¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.</p>
            <div className="form-group"><label>Razón de cancelación</label><textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Describe el motivo de la cancelación..." rows={3} /></div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>Volver</button>
              <button className="btn-danger" onClick={() => cancelOrderMutation.mutate({ id: selectedOrder.id, reason: cancelReason })} disabled={cancelOrderMutation.isPending}>{cancelOrderMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelación'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
