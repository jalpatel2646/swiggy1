import { Layers3, ShieldCheck } from 'lucide-react';

const BulkOperations = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amazon-orange/10 border border-amazon-orange/20 text-amazon-orange">
          <Layers3 className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Bulk Transactions & Operations</h2>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amazon-orange/10 border border-amazon-orange/20 text-[9px] font-extrabold text-amazon-orange uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3" />
              <span>Admin Exclusive</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">Trigger multi-record updates and batch dispatches</p>
        </div>
      </div>
      
      <div className="glass-card rounded-2xl border border-slate-850 p-12 text-center text-slate-400">
        <div className="max-w-md mx-auto space-y-4">
          <Layers3 className="h-12 w-12 text-slate-600 mx-auto animate-pulse" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Batch Operations Engine Synced</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Role validation middleware is active. Administrative actions here are audited by backend logging layers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BulkOperations;
