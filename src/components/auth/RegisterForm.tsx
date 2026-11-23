import { useState, type FormEvent } from 'react';
import { useApp } from '../../context/AppContext';

export default function RegisterForm() {
  const { setAuthView, register } = useApp();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agree: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required.';
    const email = form.email.trim();
    if (!email) next.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Please enter a valid email address.';
    if (!form.phone.trim()) next.phone = 'Phone number is required.';
    else if (form.phone.replace(/\D/g, '').length < 7) next.phone = 'Please enter a valid phone number.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password.';
    else if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    if (!form.agree) next.agree = 'You must agree to the demonstration terms to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    const result = register({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });
    if (!result.ok) {
      setErrors({ form: result.error || 'Unable to create account.' });
      setIsSubmitting(false);
    }
  };

  const inputCls = (err?: string) =>
    `w-full rounded-md border px-3.5 py-2.5 text-[15px] bg-white outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10 ${err ? 'border-danger/50' : 'border-border'}`;

  return (
    <div>
      <p className="text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-3">Create account</p>
      <h2 className="font-serif text-4xl text-charcoal leading-tight mb-3">Join the collection</h2>
      <p className="text-muted leading-relaxed mb-8">Create an account to begin contributing photographs and memories to the historical archive.</p>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {errors.form && <div className="rounded-md border border-danger/20 bg-danger-pale px-4 py-3 text-sm text-danger" role="alert">{errors.form}</div>}

        <div>
          <label htmlFor="reg-name" className="block text-sm font-medium text-charcoal mb-1.5">Full name <span className="text-danger">*</span></label>
          <input id="reg-name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className={inputCls(errors.fullName)} autoComplete="name" placeholder="Your full name" aria-invalid={!!errors.fullName} />
          {errors.fullName && <p className="mt-1.5 text-xs text-danger">{errors.fullName}</p>}
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-charcoal mb-1.5">Email address <span className="text-danger">*</span></label>
          <input id="reg-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls(errors.email)} autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} />
          {errors.email && <p className="mt-1.5 text-xs text-danger">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="reg-phone" className="block text-sm font-medium text-charcoal mb-1.5">Phone number <span className="text-danger">*</span></label>
          <input id="reg-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls(errors.phone)} autoComplete="tel" placeholder="+234 800 000 0000" aria-invalid={!!errors.phone} />
          {errors.phone && <p className="mt-1.5 text-xs text-danger">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-charcoal mb-1.5">Password <span className="text-danger">*</span></label>
          <div className="relative">
            <input id="reg-password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} className={`${inputCls(errors.password)} pr-11`} autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={!!errors.password} />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal p-1" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-danger">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="reg-confirm" className="block text-sm font-medium text-charcoal mb-1.5">Confirm password <span className="text-danger">*</span></label>
          <div className="relative">
            <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} className={`${inputCls(errors.confirmPassword)} pr-11`} autoComplete="new-password" placeholder="Re-enter your password" aria-invalid={!!errors.confirmPassword} />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal p-1" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
              {showConfirm ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1.5 text-xs text-danger">{errors.confirmPassword}</p>}
        </div>

        <div className="pt-1">
          <label className="flex items-start gap-2.5 text-sm text-charcoal-soft cursor-pointer select-none">
            <input type="checkbox" checked={form.agree} onChange={(e) => set('agree', e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-border accent-[#3D4A3A]" />
            <span>
              I understand this is a demonstration prototype and agree to the illustrative <span className="text-olive font-medium">Terms</span> and <span className="text-olive font-medium">Privacy Notice</span>. <span className="text-danger">*</span>
            </span>
          </label>
          {errors.agree && <p className="mt-1.5 text-xs text-danger">{errors.agree}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-olive text-white py-3 px-4 font-medium text-[15px] hover:bg-olive-light transition disabled:opacity-60 disabled:cursor-not-allowed mt-2">
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-8 text-sm text-center text-muted">
        Already have an account?{' '}
        <button type="button" onClick={() => setAuthView('login')} className="text-olive font-medium hover:text-olive-light">Log in</button>
      </p>
    </div>
  );
}
