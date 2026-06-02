import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useDocumentTitle from '../hooks/useDocumentTitle';
import analyticsService from '../services/analyticsService';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Calendar,
  Loader2,
  AlertCircle,
  ShieldAlert,
  ShoppingCart,
  Award
} from 'lucide-react';

const Analytics = () => {
  useDocumentTitle('Financial Analytics');
  const { user } = useAuth();
  const isUserAdmin = user?.role === 'admin';

  // Date Filters State (Default: Last 12 Months)
  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setFullYear(defaultStart.getFullYear() - 1);
  
  const [startDate, setStartDate] = useState(defaultStart.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().split('T')[0]);
  const [interval, setInterval] = useState('month'); // 'day', 'month', 'year'

  // Data State
  const [salesData, setSalesData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Aggregated Totals
  const [totals, setTotals] = useState({
    grossRevenue: 0,
    netRevenue: 0,
    taxCollected: 0,
    shippingFees: 0,
    totalOrders: 0,
    totalItemsSold: 0
  });

  // Simulated Top Products (since no backend endpoint exists)
  const topProducts = [
    { name: 'Amazon Echo Dot (5th Gen)', revenue: 4290, units: 143, trend: '+12%' },
    { name: 'Kindle Paperwhite 16GB', revenue: 3180, units: 82, trend: '+8%' },
    { name: 'Sony WH-1000XM5', revenue: 2850, units: 19, trend: '-2%' },
    { name: 'MacBook Air M2', revenue: 8400, units: 7, trend: '+15%' },
    { name: 'Logitech MX Master 3S', revenue: 1490, units: 38, trend: '+5%' }
  ];

  const fetchAnalytics = async () => {
    if (!isUserAdmin) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Fetch both reports in parallel
      const [salesRes, revenueRes] = await Promise.all([
        analyticsService.getSalesReport(startDate, endDate, interval),
        analyticsService.getRevenueReport(startDate, endDate, interval)
      ]);

      const sales = salesRes.data || salesRes;
      const revenue = revenueRes.data || revenueRes;

      setSalesData(sales);
      setRevenueData(revenue);

      // Compute Totals from Revenue Array
      const computedTotals = revenue.reduce((acc, curr) => ({
        grossRevenue: acc.grossRevenue + (curr.grossRevenue || 0),
        netRevenue: acc.netRevenue + (curr.netRevenue || 0),
        taxCollected: acc.taxCollected + (curr.taxCollected || 0),
        shippingFees: acc.shippingFees + (curr.shippingFees || 0),
        totalOrders: acc.totalOrders + (curr.totalOrders || 0)
      }), { grossRevenue: 0, netRevenue: 0, taxCollected: 0, shippingFees: 0, totalOrders: 0 });

      // Add Items Sold from Sales Array
      computedTotals.totalItemsSold = sales.reduce((sum, curr) => sum + (curr.totalItemsSold || 0), 0);

      setTotals(computedTotals);

    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Unable to fetch analytics data. Ensure your date range is valid.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, interval]);

  if (!isUserAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in p-4">
        <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-red-500/20 shadow-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-950/50 border border-red-500/30 text-red-400 mb-6">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight mb-2">
            Access Restricted
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            The Financial Analytics dashboard is strictly limited to administrative accounts.
          </p>
        </div>
      </div>
    );
  }

  // Helper for Chart Maximums
  const maxSales = Math.max(...salesData.map(d => d.grossSales || 0), 1);
  const maxRevenue = Math.max(...revenueData.map(d => d.netRevenue || 0), 1);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amazon-orange/10 border border-amazon-orange/20 text-amazon-orange shadow-inner">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Financial Analytics</h2>
            <p className="text-xs text-slate-400 font-medium">Aggregated sales and revenue reports over time</p>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 glass-card p-3 rounded-2xl border border-slate-800">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase px-1">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amazon-orange/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase px-1">End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amazon-orange/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase px-1">Grouping</label>
            <select 
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amazon-orange/50 appearance-none min-w-[100px]"
            >
              <option value="day">Daily</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-slate-950/60 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-amazon-orange animate-spin" />
          </div>
        )}
        
        <div className="glass-card rounded-2xl border border-slate-800 p-5 relative overflow-hidden">
          <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-emerald-500/10 blur-xl"></div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</p>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-100">${totals.grossRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
        </div>

        <div className="glass-card rounded-2xl border border-slate-800 p-5 relative overflow-hidden">
          <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-cyan-500/10 blur-xl"></div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Revenue</p>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-100">${totals.netRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
        </div>

        <div className="glass-card rounded-2xl border border-slate-800 p-5 relative overflow-hidden">
          <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-amazon-orange/10 blur-xl"></div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <ShoppingCart className="h-4 w-4 text-amazon-orange" />
          </div>
          <h3 className="text-2xl font-black text-slate-100">{totals.totalOrders.toLocaleString()}</h3>
        </div>

        <div className="glass-card rounded-2xl border border-slate-800 p-5 relative overflow-hidden">
          <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-purple-500/10 blur-xl"></div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Items Sold</p>
            <Package className="h-4 w-4 text-purple-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-100">{totals.totalItemsSold.toLocaleString()}</h3>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-slate-950/60 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-amazon-orange animate-spin" />
          </div>
        )}

        {/* Sales Chart */}
        <div className="glass-card rounded-2xl border border-slate-800 p-6 flex flex-col h-[400px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-6 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amazon-orange" />
            Gross Sales Over Time
          </h3>
          
          <div className="flex-1 flex items-end gap-2 mt-4 relative pt-10">
            {salesData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 italic">No sales data for this period</div>
            ) : (
              salesData.slice(-12).map((data, idx) => {
                const heightPercentage = Math.max((data.grossSales / maxSales) * 100, 2);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded shadow-xl whitespace-nowrap transition-opacity z-10 pointer-events-none">
                      ${data.grossSales.toLocaleString()}
                      <div className="text-[9px] text-slate-400">{data.period}</div>
                    </div>
                    {/* Bar */}
                    <div 
                      className="w-full bg-gradient-to-t from-amazon-orange/80 to-amber-400/80 rounded-t-sm transition-all duration-500 group-hover:opacity-80"
                      style={{ height: `${heightPercentage}%` }}
                    ></div>
                    {/* X-Axis Label */}
                    <span className="text-[9px] font-semibold text-slate-500 mt-2 truncate max-w-full block transform -rotate-45 origin-top-left translate-y-1">
                      {data.period}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="glass-card rounded-2xl border border-slate-800 p-6 flex flex-col h-[400px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Net Revenue Over Time
          </h3>
          
          <div className="flex-1 flex items-end gap-2 mt-4 relative pt-10">
            {revenueData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 italic">No revenue data for this period</div>
            ) : (
              revenueData.slice(-12).map((data, idx) => {
                const heightPercentage = Math.max((data.netRevenue / maxRevenue) * 100, 2);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded shadow-xl whitespace-nowrap transition-opacity z-10 pointer-events-none">
                      ${data.netRevenue.toLocaleString()}
                      <div className="text-[9px] text-slate-400">{data.period}</div>
                    </div>
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-500/80 to-teal-400/80 rounded-t-sm transition-all duration-500 group-hover:opacity-80"
                      style={{ height: `${heightPercentage}%` }}
                    ></div>
                    <span className="text-[9px] font-semibold text-slate-500 mt-2 truncate max-w-full block transform -rotate-45 origin-top-left translate-y-1">
                      {data.period}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="glass-card rounded-2xl border border-slate-800 p-6 shadow-xl max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Award className="h-5 w-5 text-amazon-yellow" />
            Top Performing Products (Estimated)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/50 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-bold">Product Name</th>
                <th className="px-4 py-3 font-bold text-center">Units Sold</th>
                <th className="px-4 py-3 font-bold text-right">Revenue Generated</th>
                <th className="px-4 py-3 font-bold text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {topProducts.map((product, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                        #{idx + 1}
                      </div>
                      <span className="font-bold text-slate-200">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400 font-semibold">
                    {product.units}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-100">
                    ${product.revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-[10px] font-bold ${product.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {product.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
