import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

const SLIDES = [
  { src: '/images/archive-hero.jpg', alt: 'Historical archival photograph from a West African community' },
  { src: '/images/archive-africa.jpg', alt: 'Historical archival photograph of an African neighbourhood' },
  { src: '/images/archive-heritage.jpg', alt: 'Historical archival photograph from an African archive' },
];

export default function AuthLayout() {
  const { state } = useApp();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveSlide((s) => (s + 1) % SLIDES.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[50%] relative overflow-hidden bg-charcoal text-ivory flex-col">
        {SLIDES.map((slide, idx) => (
          <img
            key={slide.src}
            src={slide.src}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === activeSlide ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal/72 via-charcoal/45 to-olive/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-charcoal/40" />

        <div className="relative z-10 p-10 xl:p-14 pb-0 xl:pb-0">
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

        <div className="relative z-10 px-10 xl:px-14 pt-6 xl:pt-10 max-w-2xl">
          <p className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-bronze-light/90 font-medium mb-5">
            <span className="w-8 h-px bg-bronze-light/60" />
            Community Archive Initiative
          </p>
          <h1 className="font-serif text-4xl xl:text-[3.5rem] leading-[1.08] text-ivory mb-5 max-w-xl">
            Every photograph holds a piece of <span className="italic text-ivory/90">history.</span>
          </h1>
          <p className="text-ivory/78 text-base xl:text-lg leading-relaxed max-w-lg mb-7">
            Contribute photographs and the stories behind them to a carefully curated historical archive, preserved with respect for the people and communities they represent.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4 max-w-xl pt-6 border-t border-white/15">
            {[
              { title: 'Curated Contributions', desc: 'A structured process for sharing photographs and their context.' },
              { title: 'Meaningful Context', desc: 'Capture the stories, places, and memories behind each image.' },
              { title: 'Preserved with Care', desc: 'Designed to honour history through a respectful, professional experience.' },
            ].map((item) => (
              <div key={item.title}>
                <p className="text-sm font-medium text-ivory mb-1 leading-snug">{item.title}</p>
                <p className="text-[12px] leading-relaxed text-ivory/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-auto px-10 xl:px-14 pb-10 pt-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-[11px] text-ivory/45">
              <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />Secure demonstration environment</span>
              <span className="hidden xl:inline w-1 h-1 rounded-full bg-ivory/20" />
              <span className="hidden xl:inline">Prototype for presentation only</span>
            </div>
            <div className="flex items-center gap-2" aria-label="Slideshow controls">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all ${idx === activeSlide ? 'w-6 bg-ivory/80' : 'w-1.5 bg-ivory/35 hover:bg-ivory/55'}`}
                  aria-label={`Show slide ${idx + 1}`}
                  aria-current={idx === activeSlide}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        <div className="lg:hidden relative h-48 sm:h-56 overflow-hidden">
          {SLIDES.map((slide, idx) => (
            <img
              key={slide.src}
              src={slide.src}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === activeSlide ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-ivory via-charcoal/35 to-charcoal/45" />
          <div className="relative z-10 px-6 pt-7 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-1.5">
              {SLIDES.map((_, idx) => (
                <span key={idx} className={`h-1.5 rounded-full ${idx === activeSlide ? 'w-4 bg-ivory/80' : 'w-1.5 bg-ivory/40'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8 sm:py-12 lg:px-12">
          <div className="w-full max-w-[480px] animate-fade-in">
            <div className="bg-white lg:bg-white rounded-lg p-5 sm:p-7 lg:p-10 border border-border-light">
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
