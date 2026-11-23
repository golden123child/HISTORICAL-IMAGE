import { useApp } from '../../../context/AppContext';

export default function IntroductionSection() {
  const { setSection, uploadedCount } = useApp();

  return (
    <div className="max-w-5xl">
      <div className="mb-12">
        <p className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-4">
          <span className="w-6 h-px bg-bronze/60" />
          Section 1 of 5
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl xl:text-6xl text-charcoal leading-[1.05] mb-6 max-w-4xl">
          Every photograph<br />
          <span className="italic text-olive">tells a story.</span>
        </h1>
        <p className="text-base sm:text-lg text-charcoal-soft leading-relaxed max-w-3xl mb-8">
          We invite you to contribute photographs that help preserve memories, experiences, people, and places from the past. Your images and the stories behind them become part of a living historical archive, handled with care and respect.
        </p>
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border-light px-4 py-2 text-sm text-charcoal-soft">
            <span className="w-2 h-2 rounded-full bg-olive" /> Up to 26 photographs
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border-light px-4 py-2 text-sm text-charcoal-soft">
            <span className="w-2 h-2 rounded-full bg-bronze" /> Stories and context welcomed
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border-light px-4 py-2 text-sm text-charcoal-soft">
            <span className="w-2 h-2 rounded-full bg-olive-light" /> {uploadedCount} added so far
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
          <p className="text-xs text-muted">Approximately 10–15 minutes, depending on the photographs you choose to share.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        <div className="bg-white border border-border-light rounded-lg p-6">
          <div className="w-11 h-11 rounded-lg bg-olive-pale text-olive flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          </div>
          <h3 className="font-serif text-2xl text-charcoal mb-2">Share your context</h3>
          <p className="text-sm text-charcoal-soft leading-relaxed">Provide names, places, dates, or memories where known. Approximate details are welcome.</p>
        </div>
        <div className="bg-white border border-border-light rounded-lg p-6">
          <div className="w-11 h-11 rounded-lg bg-bronze-pale text-bronze flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-4-4 3-2-1.5L3 17"/></svg>
          </div>
          <h3 className="font-serif text-2xl text-charcoal mb-2">Contribute photographs</h3>
          <p className="text-sm text-charcoal-soft leading-relaxed">Add up to <span className="font-semibold text-charcoal">26 photographs</span>. You may upload, review, replace, or remove images before submission.</p>
        </div>
        <div className="bg-white border border-border-light rounded-lg p-6 sm:col-span-2 lg:col-span-1">
          <div className="w-11 h-11 rounded-lg bg-olive-pale text-olive flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3 className="font-serif text-2xl text-charcoal mb-2">Preserve with care</h3>
          <p className="text-sm text-charcoal-soft leading-relaxed">Your progress is saved locally in this demonstration so you can review and refine your contribution before submitting.</p>
        </div>
      </div>

      <div className="bg-olive text-ivory rounded-lg p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6 justify-between">
        <div>
          <p className="text-[11px] tracking-[0.24em] uppercase text-bronze-light mb-2">Before you begin</p>
          <h3 className="font-serif text-2xl sm:text-3xl mb-2">Prepare your photographs</h3>
          <p className="text-ivory/75 text-sm sm:text-base max-w-2xl leading-relaxed">Digital copies in JPG, PNG, or WEBP format are recommended. Exact dates and locations are helpful, but not required.</p>
        </div>
        <button
          type="button"
          onClick={() => { setSection('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-md bg-ivory text-olive px-6 py-3 font-medium text-[15px] hover:bg-white transition"
        >
          Start now
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}
