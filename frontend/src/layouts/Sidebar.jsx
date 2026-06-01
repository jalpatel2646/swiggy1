import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Truck, 
  BarChart3, 
  Layers3, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  PackageCheck
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();

  // Navigation Links definition with role constraints
  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['customer', 'admin', 'vendor'],
    },
    {
      name: 'Orders',
      path: '/orders',
      icon: ShoppingBag,
      roles: ['customer', 'admin', 'vendor'],
    },
    {
      name: 'Shipping Logs',
      path: '/shipping',
      icon: Truck,
      roles: ['customer', 'admin', 'vendor'],
    },
    {
      name: 'Analytics API',
      path: '/admin/analytics',
      icon: BarChart3,
      roles: ['admin'],
    },
    {
      name: 'Bulk Updates',
      path: '/admin/bulk-operations',
      icon: Layers3,
      roles: ['admin'],
    },
  ];

  // Filter items matching user authority level
  const filteredNavItems = navigationItems.filter(item => {
    return !item.roles || item.roles.includes(user?.role);
  });

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen glass-effect border-r border-slate-800 transition-all duration-300 z-30 flex flex-col justify-between
        ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Header Branding */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amazon-orange to-amber-500 shadow-lg text-slate-950 font-bold">
              <PackageCheck className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-300 text-sm font-sans uppercase">
                Amazon Orders
              </span>
            )}
          </div>
          
          {/* Toggle Button */}
          {!isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1.5 mt-4">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative cursor-pointer
                  ${isActive 
                    ? 'bg-amazon-orange/10 border-l-4 border-amazon-orange text-amazon-orange font-semibold shadow-inner' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border-l-4 border-transparent'}
                `}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="text-sm tracking-wide">{item.name}</span>}
                
                {/* Collapsed Tooltip helper */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 invisible opacity-0 -translate-x-3 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    {item.name}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Profile Controls */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/20">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button 
              onClick={logout}
              className="p-3 rounded-xl bg-red-950/25 border border-red-900/20 text-red-400 hover:bg-red-900/30 hover:border-red-500/30 transition-all cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User card info */}
            <div className="flex items-center gap-3 p-2 bg-slate-900/55 rounded-xl border border-slate-800/50">
              <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-amazon-yellow uppercase">
                {user?.name?.substring(0, 2) || 'AD'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Admin Agent'}</p>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amazon-orange">
                  {user?.role || 'Guest'}
                </span>
              </div>
            </div>
            
            {/* Logout button */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-red-950/15 border border-red-950/50 text-red-400 hover:bg-red-950/30 hover:border-red-500/25 transition-all text-sm font-medium cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
