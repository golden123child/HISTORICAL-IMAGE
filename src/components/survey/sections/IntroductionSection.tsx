import { useApp } from '../../../context/AppContext';

export default function IntroductionSection() {
  const { setSection, uploadedCount } = useApp();

  return (
    <div className="max-w-6xl">
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center mb-12">
        <div className="lg:col-span-7">
          <p className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-4">
            <span className="w-6 h-px bg-bronze/60" />
            Section 1 of 5
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl xl:text-[4rem] text-charcoal leading-[1.05] mb-6">
            Every photograph<br />
            <span className="italic text-olive">tells a story.</span>
          </h1>
          <p className="text-base sm:text-lg text-charcoal-soft leading-relaxed max-w-2xl mb-6">
            We invite you to contribute photographs that help preserve memories, experiences, people, and places from the past. Your images and the stories behind them become part of a living historical archive.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border-light px-4 py-2 text-sm text-charcoal-soft">
              <span className="w-2 h-2 rounded-full bg-olive" /> Up to 26 photographs
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border-light px-4 py-2 text-sm text-charcoal-soft">
              <span className="w-2 h-2 rounded-full bg-bronze" /> Stories & context welcomed
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border-light px-4 py-2 text-sm text-charcoal-soft">
              <span className="w-2 h-2 rounded-full bg-olive-light" /> {uploadedCount} already added
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <button
              type="button"
              onClick={() => { setSection('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-olive text-white px-7 py-3.5 font-medium text-[15px] hover:bg-olive-light transition shadow-sm"
            >
              Begin Survey
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </button>
            <p className="text-xs text-muted">Approximately 10–15 minutes, depending on photos shared.</p>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative">
            <div className="absolute -inset-3 sm:-inset-4 border border-bronze/20 rounded-[1.75rem] -rotate-1" aria-hidden="true" />
            <div className="relative rounded-[1.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(44,44,44,0.25)] border border-white/60">
              <img src="/images/archive-moments.jpg" alt="Vintage historical photographs arranged on a table" className="w-full h-[280px] sm:h-[360px] lg:h-[440px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/55 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-ivory">
                <p className="text-[11px] tracking-[0.22em] uppercase text-ivory/70 mb-1">The archive</p>
                <p className="font-serif text-2xl sm:text-3xl leading-tight">Memories worth preserving.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        <div className="bg-white border border-border-light rounded-xl p-6 hover:shadow-[0_8px_30px_-12px_rgba(44,44,44,0.12)] transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-olive-pale text-olive flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          </div>
          <h3 className="font-serif text-2xl text-charcoal mb-2">Share your context</h3>
          <p className="text-sm text-charcoal-soft leading-relaxed">Tell us who, where, and when — even approximate details help bring each photograph to life.</p>
        </div>
        <div className="bg-white border border-border-light rounded-xl p-6 hover:shadow-[0_8px_30px_-12px_rgba(44,44,44,0.12)] transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-bronze-pale text-bronze flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-4-4 3-2-1.5L3 17"/></svg>
          </div>
          <h3 className="font-serif text-2xl text-charcoal mb-2">Contribute photographs</h3>
          <p className="text-sm text-charcoal-soft leading-relaxed">Add up to <span className="font-semibold text-charcoal">26 photographs</span>. Upload, describe, replace, or remove them at any time before submitting.</p>
        </div>
        <div className="bg-white border border-border-light rounded-xl p-6 hover:shadow-[0_8px_30px_-12px_rgba(44,44,44,0.12)] transition-shadow sm:col-span-2 lg:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-olive-pale text-olive flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3 className="font-serif text-2xl text-charcoal mb-2">Preserve with care</h3>
          <p className="text-sm text-charcoal-soft leading-relaxed">Your progress is saved locally in this demonstration. Review everything before submitting your contribution.</p>
        </div>
      </div>

      <div className="bg-olive text-ivory rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6 justify-between overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative">
          <p className="text-[11px] tracking-[0.24em] uppercase text-bronze-light mb-2">Before you begin</p>
          <h3 className="font-serif text-2xl sm:text-3xl mb-2">Have your photographs ready</h3>
          <p className="text-ivory/75 text-sm sm:text-base max-w-2xl leading-relaxed">Digital copies (JPG, PNG, or WEBP) work best. Approximate dates and locations are welcome — exact details are not required.</p>
        </div>
        <button
          type="button"
          onClick={() => { setSection('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="relative shrink-0 inline-flex items-center justify-center gap-2 rounded-md bg-ivory text-olive px-6 py-3 font-medium text-[15px] hover:bg-white transition"
        >
          Start now
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}
