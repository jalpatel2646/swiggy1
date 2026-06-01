import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { KeyRound, Mail, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine redirection route (default is /dashboard)
  const from = location.state?.from?.pathname || '/dashboard';

  // If already logged in, redirect away proactively
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please supply both email and password values.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Authentication request failed:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper trigger to auto fill seeded developer accounts
  const fillCredentials = (selectedEmail, selectedPassword) => {
    setEmail(selectedEmail);
    setPassword(selectedPassword);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Visual background ambient circles */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-amazon-orange/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md animate-slide-up z-10">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amazon-orange to-amber-500 shadow-xl shadow-amazon-orange/10 text-slate-950 font-bold mb-4">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-100 uppercase">
            Amazon Portal
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold tracking-wider uppercase">
            Orders Management System
          </p>
        </div>

        {/* Glass Login Form */}
        <div className="glass-effect rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          <h3 className="text-lg font-bold text-slate-200 mb-6">
            Sign In
          </h3>

          {errorMsg && (
            <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs animate-pulse">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <span className="font-bold">Error:</span> {errorMsg}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@amazon.com"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 focus:outline-none focus:border-amazon-orange/70 focus:ring-1 focus:ring-amazon-orange/50 transition-all placeholder-slate-600"
                  required
                />
                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 focus:outline-none focus:border-amazon-orange/70 focus:ring-1 focus:ring-amazon-orange/50 transition-all placeholder-slate-600"
                  required
                />
                <KeyRound className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amazon-orange to-amber-500 hover:from-amazon-orange hover:to-amber-600 text-slate-950 text-sm font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-amazon-orange/15 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In Securely</span>
              )}
            </button>
          </form>

          {/* Seed credentials utility for developer evaluation */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-3 text-amazon-yellow">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Developer Credentials Preset Seeder
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillCredentials('admin@amazon.com', 'Password123!')}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800/80 rounded-xl p-2.5 text-left text-[10px] transition-all cursor-pointer group"
              >
                <p className="font-bold text-slate-300 group-hover:text-amazon-orange">Admin Account</p>
                <p className="text-slate-500">role: admin</p>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('john@example.com', 'Password123!')}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800/80 rounded-xl p-2.5 text-left text-[10px] transition-all cursor-pointer group"
              >
                <p className="font-bold text-slate-300 group-hover:text-amazon-orange">Customer Account</p>
                <p className="text-slate-500">role: customer</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
