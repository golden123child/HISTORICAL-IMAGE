import { useApp } from '../../context/AppContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

export default function AuthLayout() {
  const { state } = useApp();

  return (
    <div className="min-h-screen bg-ivory flex">
      <div className="hidden lg:flex lg:w-[48%] xl:w-[46%] relative overflow-hidden bg-olive text-ivory p-12 xl:p-16 flex-col justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(139,111,71,0.25),_transparent_60%),radial-gradient(ellipse_at_bottom_right,_rgba(247,244,239,0.08),_transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(247,244,239,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(247,244,239,.5) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-full border border-ivory/30 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 16l-5-4-4 3-2-1.5L3 17" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-xl tracking-wide text-ivory">Historical Image Collection</p>
              <p className="text-[11px] tracking-[0.2em] uppercase text-ivory/60">Archive Survey</p>
            </div>
          </div>
          <p className="text-[11px] tracking-[0.28em] uppercase text-bronze-light mb-5">A community archive initiative</p>
          <h1 className="font-serif text-4xl xl:text-5xl leading-[1.15] text-ivory mb-6 max-w-xl">
            Preserving photographs,<br />
            <span className="italic text-ivory/85">honouring the stories behind them.</span>
          </h1>
          <p className="text-ivory/70 text-base leading-relaxed max-w-lg">
            Every image holds a fragment of history — a face, a place, a moment that deserves to be remembered. Your contribution helps build a living archive for future generations.
          </p>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="grid grid-cols-3 gap-6 max-w-lg pt-8 border-t border-ivory/15">
            <div>
              <p className="font-serif text-3xl text-ivory">26</p>
              <p className="text-xs tracking-wide uppercase text-ivory/55 mt-1">Photographs per participant</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-ivory">20k</p>
              <p className="text-xs tracking-wide uppercase text-ivory/55 mt-1">Voices in the collection</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-ivory">1</p>
              <p className="text-xs tracking-wide uppercase text-ivory/55 mt-1">Shared history preserved</p>
            </div>
          </div>
          <p className="text-[11px] text-ivory/40 leading-relaxed max-w-lg">
            Demonstration prototype — for presentation and feedback purposes only. No data is transmitted to a production system.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        <div className="lg:hidden px-6 pt-8 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-olive text-ivory flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 16l-5-4-4 3-2-1.5L3 17" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-lg text-charcoal leading-tight">Historical Image Collection</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted">Archive Survey</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[460px] animate-fade-in">
            {state.authView === 'login' && <LoginForm />}
            {state.authView === 'register' && <RegisterForm />}
            {state.authView === 'forgot' && <ForgotPasswordForm />}
          </div>
        </div>
        <div className="px-6 py-6 text-center lg:text-left lg:px-12">
          <p className="text-xs text-muted">&copy; {new Date().getFullYear()} Historical Image Collection. Demonstration prototype.</p>
        </div>
      </div>
    </div>
  );
}
