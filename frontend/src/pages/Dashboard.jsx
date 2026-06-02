import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import analyticsService from '../services/analyticsService';
import { orderService } from '../services/orderService';
import { 
  TrendingUp, 
  ShoppingBag, 
  Truck, 
  Users, 
  ArrowUpRight, 
  Layers3, 
  UserCheck,
  Loader2,
  AlertCircle,
  Package,
  Calendar
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    monthlySales: [],
    topProducts: [
      { name: 'Amazon Echo Dot (5th Gen)', revenue: '$4,290.00', units: 143 },
      { name: 'Kindle Paperwhite 16GB', revenue: '$3,180.00', units: 82 },
      { name: 'Sony WH-1000XM5', revenue: '$2,850.00', units: 19 },
      { name: 'MacBook Air M2', revenue: '$8,400.00', units: 7 }
    ],
    systemHealth: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAdmin) {
        // Normal user doesn't have access to global analytics.
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
        const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString();

        // Fetch multiple metrics in parallel
        const [salesRes, revenueRes, deliveredRes, pendingRes, healthRes] = await Promise.allSettled([
          analyticsService.getSalesReport(startOfYear, endOfYear, 'month'),
          analyticsService.getRevenueReport(startOfYear, endOfYear, 'month'),
          orderService.getOrders({ status: 'delivered', limit: 1 }),
          orderService.getOrders({ status: 'pending', limit: 1 }),
          analyticsService.getSystemHealth()
        ]);

        const totalOrders = salesRes.status === 'fulfilled' && salesRes.value.data 
          ? salesRes.value.data.reduce((sum, item) => sum + item.totalOrders, 0) : 0;
          
        const totalRevenue = revenueRes.status === 'fulfilled' && revenueRes.value.data
          ? revenueRes.value.data.reduce((sum, item) => sum + item.grossRevenue, 0) : 0;

        const deliveredOrders = deliveredRes.status === 'fulfilled' && deliveredRes.value.data?.totalResults
          ? deliveredRes.value.data.totalResults : 0;

        const pendingOrders = pendingRes.status === 'fulfilled' && pendingRes.value.data?.totalResults
          ? pendingRes.value.data.totalResults : 0;

        const monthlySales = salesRes.status === 'fulfilled' && salesRes.value.data ? salesRes.value.data : [];
        const systemHealth = healthRes.status === 'fulfilled' && healthRes.value.data ? healthRes.value.data : null;

        setDashboardData(prev => ({
          ...prev,
          totalOrders,
          totalRevenue,
          deliveredOrders,
          pendingOrders,
          monthlySales,
          systemHealth
        }));

      } catch (err) {
        console.error('Failed to load dashboard data', err);
        setError('Failed to load real-time analytics. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  // Metrics mapping
  const metrics = [
    {
      title: 'Total Revenue',
      value: isAdmin ? `$${dashboardData.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '---',
      change: '+12.5%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-emerald-500/25 to-teal-500/5',
      iconColor: 'text-emerald-400'
    },
    {
      title: 'Total Orders',
      value: isAdmin ? dashboardData.totalOrders.toLocaleString() : '---',
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingBag,
      color: 'from-amazon-orange/25 to-amber-500/5',
      iconColor: 'text-amazon-orange'
    },
    {
      title: 'Pending Orders',
      value: isAdmin ? dashboardData.pendingOrders.toLocaleString() : '---',
      change: '-2.1%',
      trend: 'down',
      icon: Truck,
      color: 'from-blue-500/25 to-indigo-500/5',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Delivered Orders',
      value: isAdmin ? dashboardData.deliveredOrders.toLocaleString() : '---',
      change: '+5.4%',
      trend: 'up',
      icon: Package,
      color: 'from-purple-500/25 to-pink-500/5',
      iconColor: 'text-purple-400'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-amazon-orange animate-spin" />
        <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider animate-pulse">Loading Analytics Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
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

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div 
              key={i}
              className={`rounded-2xl p-5 border border-slate-800 glass-card shadow-xl transition-all hover:translate-y-[-2px] hover:border-slate-700 relative overflow-hidden`}
            >
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
                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold ${metric.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {metric.change}
                    </span>
                    <span className="text-[9px] font-medium text-slate-500 uppercase">
                      vs last period
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Widgets (Charts & Lists) */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Sales Representation */}
          <div className="glass-card rounded-2xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amazon-orange" />
                Monthly Sales
              </h4>
            </div>
            
            <div className="space-y-3">
              {dashboardData.monthlySales.length > 0 ? (
                dashboardData.monthlySales.slice(-5).map((sale, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/50">
                    <div>
                      <p className="text-sm font-bold text-slate-200">{sale.period}</p>
                      <p className="text-xs text-slate-500">{sale.totalOrders} orders processed</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-400">${sale.grossSales.toLocaleString()}</p>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">{sale.totalItemsSold} items</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 text-slate-500 text-sm">No sales data available for this year.</div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="glass-card rounded-2xl border border-slate-800 p-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-6 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-amber-500" />
              Top Products (Est)
            </h4>
            <div className="space-y-3">
              {dashboardData.topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{product.name}</p>
                      <p className="text-[10px] uppercase font-semibold text-slate-500">{product.units} Units Sold</p>
                    </div>
                  </div>
                  <div className="text-right text-sm font-black text-slate-100">
                    {product.revenue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid: Lower sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User context card info */}
        <div className="glass-card rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
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
            
            <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
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
        {isAdmin && dashboardData.systemHealth && (
          <div className="lg:col-span-2 glass-card rounded-2xl border border-slate-800 p-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-5">
              Architecture Nodes Health
            </h4>
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${dashboardData.systemHealth.status === 'healthy' ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`}></span>
                  <span className="font-bold text-slate-200">Express API Node Server</span>
                </div>
                <span className={`text-[10px] ${dashboardData.systemHealth.status === 'healthy' ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' : 'bg-red-950/40 border-red-500/20 text-red-400'} border px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider`}>
                  {dashboardData.systemHealth.status === 'healthy' ? 'Online - 200 OK' : 'Degraded'}
                </span>
              </div>
              
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${dashboardData.systemHealth.database?.state === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></span>
                  <span className="font-bold text-slate-200">MongoDB Atlas Database</span>
                </div>
                <span className={`text-[10px] ${dashboardData.systemHealth.database?.state === 'connected' ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' : 'bg-amber-950/40 border-amber-500/20 text-amber-400'} border px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider`}>
                  {dashboardData.systemHealth.database?.state || 'Unknown'}
                </span>
              </div>
              
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-200">System Telemetry</span>
                  <span className="text-[10px] text-slate-500">Platform: {dashboardData.systemHealth.system?.platform} | Arch: {dashboardData.systemHealth.system?.arch}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Mem: {dashboardData.systemHealth.system?.memory?.usagePercent}
                  </span>
                  <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Uptime: {Math.floor(dashboardData.systemHealth.process?.uptime / 3600)}h
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
