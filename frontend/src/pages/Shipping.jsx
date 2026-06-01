import { Truck } from 'lucide-react';

const Shipping = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amazon-orange/10 border border-amazon-orange/20 text-amazon-orange">
          <Truck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Shipping Logs & Tracking</h2>
          <p className="text-xs text-slate-400">Track shipments and update delivery milestones</p>
        </div>
      </div>
      
      <div className="glass-card rounded-2xl border border-slate-855 p-12 text-center text-slate-400">
        <div className="max-w-md mx-auto space-y-4">
          <Truck className="h-12 w-12 text-slate-600 mx-auto animate-pulse" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Shipping Engine Ready</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Shipping and dispatch components route verified. Future phase expansion will bind the Courier API and logistics tracking logs here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Shipping;
