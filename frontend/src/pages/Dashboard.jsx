import useAuth from '../hooks/useAuth';
import { 
  TrendingUp, 
  ShoppingBag, 
  Truck, 
  Users, 
  ArrowUpRight, 
  Layers3, 
  UserCheck 
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Metrics mock data representation
  const metrics = [
    {
      title: 'Total Revenue',
      value: '$24,982.50',
      change: '+12.5%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-emerald-500/25 to-teal-500/5',
      iconColor: 'text-emerald-400'
    },
    {
      title: 'Processed Orders',
      value: '1,482',
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingBag,
      color: 'from-amazon-orange/25 to-amber-500/5',
      iconColor: 'text-amazon-orange'
    },
    {
      title: 'Active Shipments',
      value: '84',
      change: '-2.1%',
      trend: 'down',
      icon: Truck,
      color: 'from-blue-500/25 to-indigo-500/5',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Portal Clients',
      value: '912',
      change: '+22.4%',
      trend: 'up',
      icon: Users,
      color: 'from-purple-500/25 to-pink-500/5',
      iconColor: 'text-purple-400'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dynamic Jumbotron section */}
      <div className="relative rounded-3xl overflow-hidden glass-card p-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-amazon-orange/10 blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-amazon-yellow text-[10px] font-extrabold uppercase tracking-wider mb-4">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Active Session Level: {user?.role || 'Guest'}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight leading-tight mb-3">
            Welcome to Amazon Order Architecture
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Access secure transaction filters, view real-time shipping milestones, and audit bulk actions inside a single centralized micro-service console.
          </p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => window.location.href = '/orders'}
              className="bg-amazon-orange hover:bg-amber-500 text-slate-950 text-xs font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Explore Orders</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
            {isAdmin && (
              <button 
                onClick={() => window.location.href = '/admin/bulk-operations'}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-slate-100 text-xs font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Bulk Controller</span>
                <Layers3 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div 
              key={i}
              className={`rounded-2xl p-5 border border-slate-855 glass-card shadow-xl transition-all hover:translate-y-[-2px] hover:border-slate-800 relative overflow-hidden`}
            >
              {/* Backglow element */}
              <div className={`absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br ${metric.color} blur-[25px]`}></div>
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {metric.title}
                </span>
                <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800/80 ${metric.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl font-black text-slate-100 tracking-tight leading-none mb-1">
                  {metric.value}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold ${metric.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {metric.change}
                  </span>
                  <span className="text-[9px] font-medium text-slate-500 uppercase">
                    since last month
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Lower sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User context card info */}
        <div className="glass-card rounded-2xl border border-slate-855 p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Active User Identity
            </h4>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amazon-orange/10 to-amber-500/10 border border-amazon-orange/20 flex items-center justify-center text-xl font-bold text-amazon-yellow uppercase shadow-inner">
                {user?.name?.substring(0, 2) || 'AD'}
              </div>
              <div>
                <h5 className="font-extrabold text-slate-100">{user?.name || 'Agent'}</h5>
                <p className="text-xs text-slate-400 truncate mb-1">{user?.email}</p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-amazon-orange/10 border border-amazon-orange/25 text-[9px] font-extrabold text-amazon-orange uppercase tracking-wider">
                  Role: {user?.role || 'Guest'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2 text-xs text-slate-400 border-t border-slate-905 pt-4">
              <div className="flex justify-between">
                <span>Account Created:</span>
                <span className="text-slate-300 font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Auth Level:</span>
                <span className="text-slate-300 font-semibold uppercase">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span>Database Sync ID:</span>
                <span className="text-slate-300 font-mono truncate max-w-[120px]">{user?._id || 'local_session'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System metrics tracker */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-slate-855 p-6">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-5">
            Architecture Nodes Health
          </h4>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-855 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-slate-200">Express API Node Server</span>
              </div>
              <span className="text-[10px] bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Online - 200 OK
              </span>
            </div>
            
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-855 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-slate-200">MongoDB Atlas Database</span>
              </div>
              <span className="text-[10px] bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Connected
              </span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-855 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-slate-200">JWT Interceptor Middleware</span>
              </div>
              <span className="text-[10px] bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Secured
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
