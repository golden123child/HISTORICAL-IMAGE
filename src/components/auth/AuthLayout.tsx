import { useApp } from '../../context/AppContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

export default function AuthLayout() {
  const { state } = useApp();

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[50%] relative overflow-hidden bg-charcoal text-ivory flex-col">
        <img
          src="/images/archive-hero.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal/75 via-charcoal/45 to-olive/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-charcoal/35" />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(247,244,239,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(247,244,239,.6) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />

        <div className="relative z-10 p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full border border-ivory/30 bg-white/5 backdrop-blur-sm flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 16l-5-4-4 3-2-1.5L3 17" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-[22px] tracking-wide text-ivory leading-tight">Historical Image Collection</p>
              <p className="text-[11px] tracking-[0.24em] uppercase text-ivory/60">Archive Survey Platform</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-start px-10 xl:px-14 pt-10 xl:pt-16 pb-8 max-w-2xl">
          <p className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-bronze-light/90 font-medium mb-5">
            <span className="w-8 h-px bg-bronze-light/60" />
            Community Archive Initiative
          </p>
          <h1 className="font-serif text-4xl xl:text-[3.5rem] leading-[1.08] text-ivory mb-5 max-w-xl">
            Every photograph holds a piece of <span className="italic text-ivory/90">history.</span>
          </h1>
          <p className="text-ivory/78 text-base xl:text-lg leading-relaxed max-w-lg mb-8">
            Help preserve memories, people, and places for future generations. Contribute your photographs and the stories behind them to a living historical archive.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-xl">
            {[
              { value: '26', label: 'Photos per participant' },
              { value: '20,000', label: 'Voices to be heard' },
              { value: '1', label: 'Shared legacy' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm px-4 py-4">
                <p className="font-serif text-3xl xl:text-4xl text-ivory leading-none mb-1.5">{stat.value}</p>
                <p className="text-[11px] tracking-wide uppercase text-ivory/55 leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-auto px-10 xl:px-14 pb-10">
          <div className="flex items-center gap-4 text-[11px] text-ivory/45">
            <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />Secure demonstration environment</span>
            <span className="w-1 h-1 rounded-full bg-ivory/20" />
            <span>Prototype for presentation only</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        <div className="lg:hidden relative h-44 sm:h-52 overflow-hidden">
          <img src="/images/archive-hero.jpg" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ivory via-charcoal/40 to-charcoal/50" />
          <div className="relative z-10 px-6 pt-7 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur border border-white/20 text-ivory flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 16l-5-4-4 3-2-1.5L3 17" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-lg text-ivory leading-tight">Historical Image Collection</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-ivory/65">Archive Survey</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8 sm:py-12 lg:px-12">
          <div className="w-full max-w-[480px] animate-fade-in">
            <div className="bg-white/70 lg:bg-white/55 backdrop-blur-[2px] lg:backdrop-blur-sm rounded-2xl lg:rounded-2xl p-1 sm:p-0 lg:p-10 lg:border lg:border-border-light/70 lg:shadow-[0_8px_40px_-12px_rgba(44,44,44,0.08)]">
              {state.authView === 'login' && <LoginForm />}
              {state.authView === 'register' && <RegisterForm />}
              {state.authView === 'forgot' && <ForgotPasswordForm />}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} Historical Image Collection. Demonstration prototype.
        </div>
      </div>
    </div>
  );
}
