import { useState, type FormEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_ACCOUNT } from '../../data/demoData';

export default function LoginForm() {
  const { setAuthView, login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    const trimmed = email.trim();
    if (!trimmed) next.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) next.email = 'Please enter a valid email address.';
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 450));
    const result = login(email, password);
    if (!result.ok) {
      setErrors({ form: result.error || 'Unable to log in. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    setErrors({});
  };

  return (
    <div>
      <p className="text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-3">Participant access</p>
      <h2 className="font-serif text-4xl text-charcoal leading-tight mb-3">Welcome back</h2>
      <p className="text-muted leading-relaxed mb-8">Continue your participation in the historical picture collection.</p>

      <div className="mb-6 rounded-lg border border-border bg-cream/70 px-4 py-3 text-sm text-charcoal-soft flex items-start gap-3">
        <svg className="w-4 h-4 mt-0.5 text-bronze shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <div>
          <p className="font-medium text-charcoal text-[13px]">Demonstration access</p>
          <p className="text-xs text-muted mt-0.5">
            Use <button type="button" onClick={fillDemo} className="text-olive underline underline-offset-2 hover:text-olive-light">demo credentials</button> or any email with a password of 6+ characters.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {errors.form && (
          <div className="rounded-md border border-danger/20 bg-danger-pale px-4 py-3 text-sm text-danger" role="alert">{errors.form}</div>
        )}
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-charcoal mb-1.5">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full rounded-md border px-3.5 py-2.5 text-[15px] bg-white outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10 ${errors.email ? 'border-danger/50' : 'border-border'}`}
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
          />
          {errors.email && <p id="login-email-error" className="mt-1.5 text-xs text-danger">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-charcoal mb-1.5">Password</label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-md border px-3.5 py-2.5 pr-11 text-[15px] bg-white outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10 ${errors.password ? 'border-danger/50' : 'border-border'}`}
              placeholder="Enter your password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          {errors.password && <p id="login-password-error" className="mt-1.5 text-xs text-danger">{errors.password}</p>}
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="inline-flex items-center gap-2 text-charcoal-soft cursor-pointer select-none">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 rounded border-border accent-[#3D4A3A]" />
            Remember me
          </label>
          <button type="button" onClick={() => setAuthView('forgot')} className="text-olive hover:text-olive-light font-medium">Forgot password?</button>
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-olive text-white py-3 px-4 font-medium text-[15px] hover:bg-olive-light transition disabled:opacity-60 disabled:cursor-not-allowed">
          {isSubmitting ? 'Signing in...' : 'Log In'}
        </button>
      </form>

      <p className="mt-8 text-sm text-center text-muted">
        Don't have an account?{' '}
        <button type="button" onClick={() => setAuthView('register')} className="text-olive font-medium hover:text-olive-light">Create one</button>
      </p>
    </div>
  );
}
