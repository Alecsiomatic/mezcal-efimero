import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, FolderTree, Ticket, Users, Settings, LogOut, Store, Wine } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import './Admin.css';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Menu items - show only 5 on mobile bottom nav
  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Inicio', end: true, showMobile: true },
    { path: '/admin/productos', icon: Package, label: 'Productos', showMobile: true },
    { path: '/admin/botellas', icon: Wine, label: 'Botellas', showMobile: false },
    { path: '/admin/pedidos', icon: ShoppingCart, label: 'Pedidos', showMobile: true },
    { path: '/admin/categorias', icon: FolderTree, label: 'Categorías', showMobile: false },
    { path: '/admin/cupones', icon: Ticket, label: 'Cupones', showMobile: false },
    { path: '/admin/usuarios', icon: Users, label: 'Usuarios', showMobile: true },
    { path: '/admin/configuracion', icon: Settings, label: 'Config', showMobile: true },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <img src="/logo-efimero.png" alt="Efímero" className="sidebar-logo" />
          <span>Admin Panel</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${!item.showMobile ? 'desktop-only' : ''}`}
              end={item.end}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/" className="nav-item back-home">
            <Store size={20} />
            <span>Tienda</span>
          </NavLink>
          <div className="user-info">
            <div className="user-avatar">{user?.firstName?.[0] || 'A'}</div>
            <div className="user-details">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-role">Administrador</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
