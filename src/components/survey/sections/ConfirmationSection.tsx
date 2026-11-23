import { useApp } from '../../../context/AppContext';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function ConfirmationSection() {
  const { state, resetDemo, setSection } = useApp();
  const sub = state.submission;

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-olive-pale text-olive mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <p className="text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-3">Demonstration submission complete</p>
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal leading-[1.1] mb-4">Thank you for contributing.</h1>
        <p className="text-muted text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Your participation helps preserve memories, photographs, and stories for future generations.
        </p>
      </div>

      <div className="bg-white border border-border-light rounded-xl overflow-hidden mb-6">
        <div className="px-6 sm:px-8 py-5 border-b border-border-light bg-ivory/30">
          <h2 className="font-serif text-2xl text-charcoal">Submission summary</h2>
          <p className="text-sm text-muted mt-1">This is a simulated submission record for demonstration purposes.</p>
        </div>
        <dl className="divide-y divide-border-light">
          <div className="px-6 sm:px-8 py-4 sm:grid sm:grid-cols-3 gap-4">
            <dt className="text-sm text-muted">Reference number</dt>
            <dd className="text-sm font-medium text-charcoal sm:col-span-2 mt-1 sm:mt-0 font-mono tracking-wide">{sub?.referenceNumber || '—'}</dd>
          </div>
          <div className="px-6 sm:px-8 py-4 sm:grid sm:grid-cols-3 gap-4">
            <dt className="text-sm text-muted">Participant</dt>
            <dd className="text-sm font-medium text-charcoal sm:col-span-2 mt-1 sm:mt-0">{sub?.participantName || state.participantInfo.fullName || '—'}</dd>
          </div>
          <div className="px-6 sm:px-8 py-4 sm:grid sm:grid-cols-3 gap-4">
            <dt className="text-sm text-muted">Questionnaire</dt>
            <dd className="text-sm font-medium text-charcoal sm:col-span-2 mt-1 sm:mt-0">
              <span className="inline-flex items-center gap-1.5 text-success"><span className="w-1.5 h-1.5 rounded-full bg-success" />Complete</span>
            </dd>
          </div>
          <div className="px-6 sm:px-8 py-4 sm:grid sm:grid-cols-3 gap-4">
            <dt className="text-sm text-muted">Photographs contributed</dt>
            <dd className="text-sm font-medium text-charcoal sm:col-span-2 mt-1 sm:mt-0">{sub?.pictureCount ?? 0} of 26</dd>
          </div>
          <div className="px-6 sm:px-8 py-4 sm:grid sm:grid-cols-3 gap-4">
            <dt className="text-sm text-muted">Confirmation date</dt>
            <dd className="text-sm font-medium text-charcoal sm:col-span-2 mt-1 sm:mt-0">{sub?.submittedAt ? formatDate(sub.submittedAt) : '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-bronze/20 bg-bronze-pale/40 px-5 py-4 text-sm text-charcoal-soft leading-relaxed mb-8 flex gap-3">
        <svg className="w-5 h-5 text-bronze shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <p>
          <span className="font-medium text-charcoal">Demonstration prototype notice.</span> This submission has been simulated locally in your browser. No data has been transmitted to a production system, database, or server.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button type="button" onClick={() => { setSection('review'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white text-charcoal px-6 py-3 font-medium text-[15px] hover:bg-ivory-deep/40 transition">
          Review submission
        </button>
        <button type="button" onClick={resetDemo} className="inline-flex items-center justify-center gap-2 rounded-md bg-olive text-white px-7 py-3 font-medium text-[15px] hover:bg-olive-light transition">
          Restart demonstration
        </button>
      </div>
    </div>
  );
}
