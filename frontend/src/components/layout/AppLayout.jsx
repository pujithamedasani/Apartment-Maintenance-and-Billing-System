import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard, MdApartment, MdPeople, MdReceipt, MdPayment,
  MdBuildCircle, MdCampaign, MdPerson, MdLogout, MdMenu, MdClose,
  MdNotifications
} from 'react-icons/md';
import { useState } from 'react';
import toast from 'react-hot-toast';

const NAV_ITEMS = {
  admin: [
    { label: 'Overview', items: [
      { to: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
    ]},
    { label: 'Management', items: [
      { to: '/apartments', icon: MdApartment, label: 'Apartments' },
      { to: '/residents', icon: MdPeople, label: 'Residents' },
    ]},
    { label: 'Billing', items: [
      { to: '/invoices', icon: MdReceipt, label: 'Invoices' },
      { to: '/payments', icon: MdPayment, label: 'Payments' },
    ]},
    { label: 'Operations', items: [
      { to: '/complaints', icon: MdBuildCircle, label: 'Complaints' },
      { to: '/notices', icon: MdCampaign, label: 'Notices' },
    ]},
  ],
  resident: [
    { label: 'My Portal', items: [
      { to: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
      { to: '/invoices', icon: MdReceipt, label: 'My Bills' },
      { to: '/payments', icon: MdPayment, label: 'Payments' },
      { to: '/complaints', icon: MdBuildCircle, label: 'Complaints' },
      { to: '/notices', icon: MdCampaign, label: 'Notices' },
    ]},
  ],
  maintenance: [
    { label: 'Work Portal', items: [
      { to: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
      { to: '/complaints', icon: MdBuildCircle, label: 'My Tasks' },
      { to: '/notices', icon: MdCampaign, label: 'Notices' },
    ]},
  ],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const navGroups = NAV_ITEMS[user?.role] || NAV_ITEMS.resident;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    toast.success('Logged out successfully');
    setTimeout(logout, 500);
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">🏢</div>
            <div>
              <div className="logo-text">ApartmentOS</div>
              <div className="logo-sub">Management Portal</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="nav-section-label">{group.label}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="nav-icon" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}

          <div style={{ marginTop: 8 }}>
            <div className="nav-section-label">Account</div>
            <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
              <MdPerson className="nav-icon" /> Profile
            </NavLink>
            <button className="nav-item" style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'none', textAlign: 'left' }} onClick={handleLogout}>
              <MdLogout className="nav-icon" /> Logout
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={() => navigate('/profile')}>
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSidebarOpen(o => !o)}
              style={{ display: 'none' }}
              id="menu-toggle"
            >
              {sidebarOpen ? <MdClose /> : <MdMenu />}
            </button>
            <div>
              <div className="header-title">Welcome back, {user?.name?.split(' ')[0]} 👋</div>
            </div>
          </div>
          <div className="header-actions">
            <div className={`badge ${user?.role}`}>{user?.role}</div>
            <button className="btn btn-ghost btn-icon" title="Notifications">
              <MdNotifications />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
