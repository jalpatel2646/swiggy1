import React from 'react';
import { SearchX } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = SearchX, 
  title = "No Records Found", 
  message = "Try adjusting your search filters or dates to find what you're looking for.",
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="h-16 w-16 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-200 tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
        {message}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
