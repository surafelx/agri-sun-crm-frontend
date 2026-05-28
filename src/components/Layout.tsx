import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { LayoutDashboard, Users, Wrench, LogOut, Sun } from 'lucide-react';

const nav = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/customers',    label: 'Customers',    icon: Users },
  { to: '/installations',label: 'Installations',icon: Wrench },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-surface-card border-r border-surface-border flex flex-col">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-surface-border">
          <Sun className="w-6 h-6 text-primary" />
          <span className="font-bold text-white text-sm leading-tight">Agri-Sun<br/><span className="text-primary">CRM</span></span>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
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
            <p className="text-xs text-gray-400 truncate">{user.fullName}</p>
            <p className="text-xs text-gray-600 truncate">{user.email}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-surface transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
