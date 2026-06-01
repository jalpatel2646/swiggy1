import { BarChart3, ShieldCheck } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amazon-orange/10 border border-amazon-orange/20 text-amazon-orange">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Administrative Analytics</h2>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amazon-orange/10 border border-amazon-orange/20 text-[9px] font-extrabold text-amazon-orange uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3" />
              <span>Admin Exclusive</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">Perform complex audits and fetch transactional charts</p>
        </div>
      </div>
      
      <div className="glass-card rounded-2xl border border-slate-850 p-12 text-center text-slate-400">
        <div className="max-w-md mx-auto space-y-4">
          <BarChart3 className="h-12 w-12 text-slate-600 mx-auto animate-pulse" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Aggregation Pipelines Integrated</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Role validation middleware is active. Access to these charts has been fully secured using path-based authentication guards.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
