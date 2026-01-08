import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2, ShieldCheck, Globe, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  error?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'user' | 'pass' | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    // Add a small artificial delay for the button animation to be felt if response is instant
    const minTime = new Promise(r => setTimeout(r, 800));
    try {
      await Promise.all([onLogin(username.trim(), password), minTime]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden font-sans">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-[#0f1c3a] to-black opacity-100" />
        <div className="absolute -top-[20%] -left-[10%] w-[70vh] h-[70vh] rounded-full bg-purple-600/20 blur-[100px] animate-pulse" />
        <div className="absolute top-[40%] -right-[10%] w-[80vh] h-[80vh] rounded-full bg-blue-600/10 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-[420px] mx-4 animate-in fade-in zoom-in-95 duration-500">
        {/* Glass Container */}
        <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-3xl p-8 overflow-hidden z-10">

          {/* Decorative shine */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent to-orange-500 shadow-lg shadow-orange-500/20 mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Welcome Back</h1>
            <p className="text-slate-400 text-sm font-medium">Enter your credentials to access the console.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 animate-in slide-in-from-top-2">
              <div className="bg-red-500/20 p-1 rounded-full shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h3 className="text-red-400 text-sm font-bold">Authentication Failed</h3>
                <p className="text-red-400/80 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={submit} className="space-y-5">
            {/* Username Field */}
            <div className={`group relative transition-all duration-300 ${focusedField === 'user' ? 'scale-[1.02]' : ''}`}>
              <div className={`absolute inset-0 bg-gradient-to-r from-accent to-purple-600 rounded-xl blur opacity-20 transition-opacity duration-300 ${focusedField === 'user' ? 'opacity-40' : 'opacity-0'}`}></div>
              <div className="relative bg-slate-900/50 rounded-xl border border-white/10 flex items-center p-1 transition-colors group-hover:border-white/20">
                <div className="p-3 text-slate-400 group-hover:text-white transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 ml-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('user')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent text-white font-medium focus:outline-none placeholder-slate-600/50 pb-2 pl-1"
                    placeholder="Enter username"
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className={`group relative transition-all duration-300 ${focusedField === 'pass' ? 'scale-[1.02]' : ''}`}>
              <div className={`absolute inset-0 bg-gradient-to-r from-accent to-purple-600 rounded-xl blur opacity-20 transition-opacity duration-300 ${focusedField === 'pass' ? 'opacity-40' : 'opacity-0'}`}></div>
              <div className="relative bg-slate-900/50 rounded-xl border border-white/10 flex items-center p-1 transition-colors group-hover:border-white/20">
                <div className="p-3 text-slate-400 group-hover:text-white transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="flex-1 relative">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 ml-1">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('pass')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent text-white font-medium focus:outline-none placeholder-slate-600/50 pb-2 pl-1 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-6 text-slate-500 hover:text-white transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className={`
                w-full relative group overflow-hidden rounded-xl p-4 font-bold text-white shadow-lg transition-all duration-300
                ${loading || !username || !password ? 'opacity-70 cursor-not-allowed grayscale-[0.5]' : 'hover:scale-[1.02] hover:shadow-accent/25'}
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-orange-500 transition-transform duration-300 group-hover:scale-[1.05]"></div>
              <div className="relative flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white/90" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 text-center flex items-center justify-center space-x-4 text-xs font-medium text-slate-500">
            <div className="flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Secure Connection</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
            <div className="flex items-center space-x-1">
              <Globe className="w-3 h-3" />
              <span>Global Login</span>
            </div>
          </div>
        </div>

        {/* Floating background blur elements for depth */}
        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-black/40 blur-3xl rounded-full"></div>
      </div>
    </div>
  );
};

export default Login;
