import { useState, type FormEvent } from 'react';
import { useApp } from '../../context/AppContext';

export default function ForgotPasswordForm() {
  const { setAuthView } = useApp();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!trimmed) { setError('Email address is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError('Please enter a valid email address.'); return; }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div>
      <p className="text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-3">Account recovery</p>
      <h2 className="font-serif text-4xl text-charcoal leading-tight mb-3">Reset your password</h2>
      <p className="text-muted leading-relaxed mb-8">
        Enter the email address associated with your account and we'll send a reset link.
      </p>

      {submitted ? (
        <div className="rounded-lg border border-olive/20 bg-olive-pale/50 px-5 py-5 text-sm text-charcoal animate-fade-in-scale">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-olive/10 text-olive flex items-center justify-center shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div>
              <p className="font-medium text-charcoal mb-1">Reset link sent (demonstration)</p>
              <p className="text-muted text-sm leading-relaxed">
                If an account exists for <span className="text-charcoal font-medium">{email}</span>, a password reset link would be sent. Because this is a frontend prototype, no email is actually delivered.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-charcoal mb-1.5">Email address</label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-md border px-3.5 py-2.5 text-[15px] bg-white outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10 ${error ? 'border-danger/50' : 'border-border'}`}
              placeholder="you@example.com"
              aria-invalid={!!error}
            />
            {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-olive text-white py-3 px-4 font-medium text-[15px] hover:bg-olive-light transition disabled:opacity-60">
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="mt-8 text-sm text-center text-muted">
        Remembered your password?{' '}
        <button type="button" onClick={() => setAuthView('login')} className="text-olive font-medium hover:text-olive-light">Back to login</button>
      </p>
    </div>
  );
}
