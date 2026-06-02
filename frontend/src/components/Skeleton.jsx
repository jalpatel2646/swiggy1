import React from 'react';

const Skeleton = ({ className, variant = 'rectangular', ...props }) => {
  const baseClasses = 'animate-pulse bg-slate-800/80 border border-slate-700/50';
  
  const variants = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4'
  };

  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${className}`} 
      {...props} 
    />
  );
};

// Reusable preset for table rows
export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr className="border-b border-slate-800/60">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <Skeleton variant="text" className="w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

export default Skeleton;
