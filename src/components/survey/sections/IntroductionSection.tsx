import { useApp } from '../../../context/AppContext';

export default function IntroductionSection() {
  const { setSection } = useApp();

  return (
    <div className="max-w-4xl">
      <p className="text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-4">Section 1 of 5</p>
      <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] text-charcoal leading-[1.1] mb-6">
        Every photograph<br />
        <span className="italic text-olive">tells a story.</span>
      </h1>
      <div className="max-w-2xl space-y-4 text-[15px] sm:text-base text-charcoal-soft leading-relaxed mb-10">
        <p>
          We invite you to contribute photographs that help preserve memories, experiences, people, and places from the past. Through this collection, we aim to gather historical images and the stories, context, and memories connected to them.
        </p>
        <p>
          Your contribution becomes part of a shared archive — one that honours everyday lives, significant moments, and the communities that shaped them.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-10">
        <div className="bg-white border border-border-light rounded-xl p-6">
          <div className="w-10 h-10 rounded-full bg-olive-pale text-olive flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          </div>
          <h3 className="font-serif text-2xl text-charcoal mb-2">What you may need</h3>
          <ul className="space-y-2.5 text-sm text-charcoal-soft">
            <li className="flex gap-2.5"><span className="mt-1.5 w-1 h-1 rounded-full bg-bronze shrink-0" />Photographs you wish to contribute, in digital form.</li>
            <li className="flex gap-2.5"><span className="mt-1.5 w-1 h-1 rounded-full bg-bronze shrink-0" />Any information you know about the people, places, or events shown.</li>
            <li className="flex gap-2.5"><span className="mt-1.5 w-1 h-1 rounded-full bg-bronze shrink-0" />Approximate dates or locations, where known — exact details are not required.</li>
          </ul>
        </div>

        <div className="bg-white border border-border-light rounded-xl p-6">
          <div className="w-10 h-10 rounded-full bg-bronze-pale text-bronze flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-4-4 3-2-1.5L3 17"/></svg>
          </div>
          <h3 className="font-serif text-2xl text-charcoal mb-2">Picture collection</h3>
          <p className="text-sm text-charcoal-soft leading-relaxed mb-4">
            You may contribute up to <span className="font-semibold text-charcoal">26 photographs</span>. Each picture can include its own title, description, approximate date, and location context.
          </p>
          <p className="text-sm text-charcoal-soft leading-relaxed">
            You do not need to fill every slot — share as many as you are comfortable with.
          </p>
        </div>
      </div>

      <div className="bg-olive-pale/40 border border-olive/10 rounded-xl p-5 sm:p-6 mb-10 flex gap-4">
        <div className="w-9 h-9 rounded-full bg-white text-olive flex items-center justify-center shrink-0 border border-olive/10">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </div>
        <div className="text-sm text-charcoal-soft leading-relaxed">
          <p className="font-medium text-charcoal mb-1">A note about your contribution</p>
          <p>Take your time. You can move between sections, return to earlier answers, and edit picture details before submitting. Your progress is saved locally in this demonstration.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <button
          type="button"
          onClick={() => setSection('about')}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-olive text-white px-7 py-3.5 font-medium text-[15px] hover:bg-olive-light transition"
        >
          Begin Survey
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </button>
        <p className="text-xs text-muted">Approximately 10–15 minutes, depending on the number of photographs.</p>
      </div>
    </div>
  );
}
