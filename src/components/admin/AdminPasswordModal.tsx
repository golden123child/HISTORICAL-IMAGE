import { useEffect, useState } from 'react';

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onUnlock: (password: string) => boolean;
}

export default function AdminPasswordModal({ open, title = 'Administrator access', description = 'Enter the administrative password to continue.', onClose, onUnlock }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setPassword(''); setError(''); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onUnlock(password);
    if (!ok) setError('Incorrect password. Please try again.');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg bg-white border border-border-light shadow-2xl p-6 sm:p-7 animate-fade-in-scale">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] tracking-[0.24em] uppercase text-bronze font-medium mb-1">Protected action</p>
            <h2 className="font-serif text-2xl text-charcoal">{title}</h2>
            <p className="text-sm text-muted mt-1">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full border border-border text-muted hover:text-charcoal flex items-center justify-center" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-charcoal mb-1.5">Administrative password</label>
            <input id="admin-password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} className={`w-full rounded-md border px-3.5 py-2.5 text-[15px] bg-white outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10 ${error ? 'border-danger/50' : 'border-border'}`} autoFocus />
            {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-1">
            <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Cancel</button>
            <button type="submit" className="inline-flex items-center justify-center rounded-md bg-olive px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-light transition">Unlock access</button>
          </div>
        </form>
      </div>
    </div>
  );
}
