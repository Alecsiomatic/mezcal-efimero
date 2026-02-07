import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingCart, Package, Users, Clock } from 'lucide-react';
import api from '../../api/client';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Get stats from multiple endpoints
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        api.get('/admin/orders').catch(() => ({ data: { orders: [] } })),
        api.get('/products/admin/all').catch(() => ({ data: { products: [], pagination: { total: 0 } } })),
        api.get('/admin/users').catch(() => ({ data: { users: [] } }))
      ]);
      
      const orders = ordersRes.data.orders || [];
      const products = productsRes.data.products || [];
      const users = usersRes.data.users || [];
      
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const monthOrders = orders.filter((o: any) => new Date(o.createdAt) >= monthStart);
      const monthSales = monthOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
      
      return {
        monthSales,
        totalOrders: orders.length,
        totalProducts: productsRes.data.pagination?.total || products.length,
        totalUsers: users.length,
        pendingOrders,
        recentOrders: orders.slice(0, 5)
      };
    }
  });

  const statCards = [
    { label: 'Ventas del Mes', value: `$${stats?.monthSales?.toLocaleString() || 0}`, icon: DollarSign, color: 'green' },
    { label: 'Pedidos Totales', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'blue' },
    { label: 'Productos', value: stats?.totalProducts || 0, icon: Package, color: 'purple' },
    { label: 'Clientes', value: stats?.totalUsers || 0, icon: Users, color: 'yellow' },
    { label: 'Pendientes', value: stats?.pendingOrders || 0, icon: Clock, color: 'orange' },
  ];

  if (isLoading) return <div className="loading">Cargando...</div>;

  return (
    <div className="page-dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className={`icon ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <h3>{stat.label}</h3>
            <p className="value">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Pedidos Recientes</h3>
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="recent-orders-list">
              {stats.recentOrders.map((order: any) => (
                <div key={order.id} className="recent-order-item">
                  <span className="order-number">#{order.orderNumber}</span>
                  <span className="order-customer">{order.user?.firstName || 'Cliente'}</span>
                  <span className="order-amount">${order.totalAmount}</span>
                  <span className={`order-status ${order.status}`}>{order.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No hay pedidos recientes</p>
          )}
        </div>
        <div className="dashboard-card">
          <h3>Resumen</h3>
          <div className="summary-info">
            <p>Panel de administración de <strong>Efímero Mezcal</strong></p>
            <p>Gestiona productos, pedidos, cupones y configuración desde aquí.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
