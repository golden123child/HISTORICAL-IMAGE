import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { SurveySection } from '../../types';
import IntroductionSection from './sections/IntroductionSection';
import AboutSection from './sections/AboutSection';
import CollectionSection from './sections/CollectionSection';
import DetailsSection from './sections/DetailsSection';
import ReviewSection from './sections/ReviewSection';
import ConfirmationSection from './sections/ConfirmationSection';

const NAV_ITEMS: { id: SurveySection; label: string; description: string }[] = [
  { id: 'introduction', label: 'Introduction', description: 'Purpose & overview' },
  { id: 'about', label: 'About You', description: 'Participant information' },
  { id: 'collection', label: 'Picture Collection', description: 'Upload photographs' },
  { id: 'details', label: 'Picture Details', description: 'Stories & context' },
  { id: 'review', label: 'Review & Submit', description: 'Confirm your contribution' },
];

function sectionIndex(id: SurveySection): number {
  return NAV_ITEMS.findIndex((n) => n.id === id);
}

export default function SurveyLayout() {
  const { state, setSection, logout, resetDemo, overallProgress, uploadedCount } = useApp();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const current = state.currentSection;
  const isConfirmation = current === 'confirmation';
  const currentIdx = sectionIndex(current);

  const canNavigateTo = (target: SurveySection) => {
    if (isConfirmation) return target === 'confirmation';
    // Allow navigation to any non-confirmation section; confirmation only via submit
    return target !== 'confirmation';
  };

  const goTo = (target: SurveySection) => {
    if (!canNavigateTo(target)) return;
    setSection(target);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderSection = () => {
    switch (current) {
      case 'introduction': return <IntroductionSection />;
      case 'about': return <AboutSection />;
      case 'collection': return <CollectionSection />;
      case 'details': return <DetailsSection />;
      case 'review': return <ReviewSection />;
      case 'confirmation': return <ConfirmationSection />;
      default: return <IntroductionSection />;
    }
  };

  const NavContent = ({ onNavigate }: { onNavigate?: (s: SurveySection) => void }) => (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-7 pb-6 border-b border-border-light">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-olive text-ivory flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <path d="M21 16l-5-4-4 3-2-1.5L3 17" />
            </svg>
          </div>
          <div>
            <p className="font-serif text-[17px] text-charcoal leading-tight">Historical Image Collection</p>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted">Archive Survey</p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span>Overall progress</span>
            <span className="font-medium text-charcoal">{overallProgress}%</span>
          </div>
          <div className="h-1.5 bg-ivory-deep rounded-full overflow-hidden">
            <div className="h-full bg-olive rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
          </div>
          <p className="text-[11px] text-muted mt-2">{uploadedCount} of 26 photographs contributed</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Survey sections">
        {NAV_ITEMS.map((item, idx) => {
          const active = current === item.id;
          const done = !isConfirmation && currentIdx > idx;
          const completedBySubmission = isConfirmation;
          const isDone = done || completedBySubmission;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => (onNavigate || goTo)(item.id)}
              className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition group ${
                active ? 'bg-olive-pale/70' : 'hover:bg-ivory-deep/60'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 border transition ${
                active
                  ? 'bg-olive text-white border-olive'
                  : isDone
                  ? 'bg-olive/10 text-olive border-olive/20'
                  : 'bg-white text-muted border-border'
              }`}>
                {isDone && !active ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                ) : (
                  idx + 1
                )}
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${active ? 'text-olive' : 'text-charcoal'}`}>{item.label}</span>
                <span className="block text-xs text-muted mt-0.5">{item.description}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border-light space-y-1">
        {state.lastSavedAt && (
          <p className="px-2 pb-2 text-[11px] text-muted">
            Progress saved locally
          </p>
        )}
        <button type="button" onClick={resetDemo} className="w-full text-left px-3 py-2 text-sm text-muted hover:text-charcoal hover:bg-ivory-deep/60 rounded-md transition">
          Restart demonstration
        </button>
        <button type="button" onClick={logout} className="w-full text-left px-3 py-2 text-sm text-muted hover:text-charcoal hover:bg-ivory-deep/60 rounded-md transition">
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[290px] xl:w-[320px] bg-cream border-r border-border-light flex-col z-30 no-print">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-border-light no-print">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-olive text-ivory flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 16l-5-4-4 3-2-1.5L3 17" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-serif text-base text-charcoal leading-tight truncate">Historical Image Collection</p>
              <p className="text-[10px] text-muted tracking-wide uppercase">
                {isConfirmation ? 'Submitted' : `Step ${Math.max(1, currentIdx + 1)} of ${NAV_ITEMS.length}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-white text-sm text-charcoal"
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-survey-nav"
          >
            <span>Menu</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d={mobileNavOpen ? 'M6 6l12 12M18 6l-12 12' : 'M4 7h16M4 12h16M4 17h16'} /></svg>
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-[11px] text-muted mb-1">
            <span>{overallProgress}% complete</span>
            <span>{uploadedCount}/26 photos</span>
          </div>
          <div className="h-1 bg-ivory-deep rounded-full overflow-hidden">
            <div className="h-full bg-olive rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>
        {mobileNavOpen && (
          <div id="mobile-survey-nav" className="border-t border-border-light bg-cream px-2 py-2 animate-fade-in">
            {NAV_ITEMS.map((item, idx) => {
              const active = current === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm ${active ? 'bg-olive-pale/70 text-olive font-medium' : 'text-charcoal'}`}
                >
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center border ${active ? 'bg-olive text-white border-olive' : 'border-border text-muted'}`}>{idx + 1}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="border-t border-border-light mt-2 pt-2 flex gap-2 px-1">
              <button type="button" onClick={resetDemo} className="flex-1 text-xs text-muted py-2 hover:text-charcoal">Restart demo</button>
              <button type="button" onClick={logout} className="flex-1 text-xs text-muted py-2 hover:text-charcoal">Log out</button>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="lg:pl-[290px] xl:pl-[320px] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-10 lg:py-14">
          <div key={current} className="animate-fade-in">
            {renderSection()}
          </div>
        </div>
      </main>
    </div>
  );
}
