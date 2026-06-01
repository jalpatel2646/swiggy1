import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* Dynamic Collapsible Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300
          ${isCollapsed ? 'pl-20' : 'pl-64'}`}
      >
        {/* Sticky Glass Navbar */}
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        {/* Dynamic Page Routes Outlet Container */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in overflow-y-auto">
          <Outlet />
        </main>
        
        {/* Mini layout footer */}
        <footer className="py-4 px-6 border-t border-slate-900/80 bg-slate-950/20 text-center text-[10px] text-slate-500">
          Amazon Orders Admin Portal &copy; {new Date().getFullYear()} — Engineered by Jal Patel
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
