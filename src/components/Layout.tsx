import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Wrench, BarChart3, LogOut, Sun, Menu, X } from 'lucide-react';

const nav = [
  { to: '/',              label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/customers',     label: 'Customers',     icon: Users },
  { to: '/installations', label: 'Installations', icon: Wrench },
  { to: '/reports',       label: 'Reports',       icon: BarChart3 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return null;

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between px-5 py-5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Sun className="w-6 h-6 text-primary" />
          <span className="font-bold text-white text-sm leading-tight">
            Agri-Sun<br /><span className="text-primary">CRM</span>
          </span>
        </div>
        <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-surface'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-surface-border">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-gray-300 font-medium truncate">{user.fullName}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-surface transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-56 bg-surface-card border-r border-surface-border flex flex-col
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:shrink-0`}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-surface-card border-b border-surface-border">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-primary" />
            <span className="font-bold text-white text-sm">Agri-Sun <span className="text-primary">CRM</span></span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
