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
    <div className="max-w-3xl mx-auto py-4 sm:py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-18 h-18 rounded-full bg-olive-pale text-olive mb-6 shadow-sm" style={{ width: 72, height: 72 }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <p className="text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-3">Demonstration submission complete</p>
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal leading-[1.1] mb-4">Thank you for contributing.</h1>
        <p className="text-muted text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Your participation helps preserve memories, photographs, and stories for future generations.
        </p>
      </div>

      <div className="bg-white border border-border-light rounded-lg overflow-hidden mb-6 shadow-sm">
        <div className="px-6 sm:px-8 py-5 border-b border-border-light bg-ivory/40">
          <h2 className="font-serif text-2xl text-charcoal">Submission summary</h2>
          <p className="text-sm text-muted mt-1">Simulated submission record for demonstration purposes.</p>
        </div>
        <dl className="divide-y divide-border-light">
          {[
            { label: 'Reference number', value: sub?.referenceNumber || '—', mono: true },
            { label: 'Participant', value: sub?.participantName || state.participantInfo.fullName || '—' },
            { label: 'Questionnaire', value: 'Complete', status: true },
            { label: 'Photographs contributed', value: `${sub?.pictureCount ?? 0} of 26` },
            { label: 'Confirmation date', value: sub?.submittedAt ? formatDate(sub.submittedAt) : '—' },
          ].map((row) => (
            <div key={row.label} className="px-6 sm:px-8 py-4 sm:grid sm:grid-cols-3 gap-4">
              <dt className="text-sm text-muted">{row.label}</dt>
              <dd className={`text-sm font-medium text-charcoal sm:col-span-2 mt-1 sm:mt-0 ${row.mono ? 'font-mono tracking-wide' : ''}`}>
                {row.status ? <span className="inline-flex items-center gap-1.5 text-success"><span className="w-1.5 h-1.5 rounded-full bg-success" />{row.value}</span> : row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-lg border border-bronze/20 bg-bronze-pale/40 px-5 py-4 text-sm text-charcoal-soft leading-relaxed mb-8 flex gap-3">
        <svg className="w-5 h-5 text-bronze shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <p><span className="font-medium text-charcoal">Demonstration prototype notice.</span> This submission has been simulated locally in your browser. No data has been transmitted to a production system, database, or server.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center no-print">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white text-charcoal px-6 py-3 font-medium text-[15px] hover:bg-ivory-deep/40 transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
          Print summary
        </button>
        <button type="button" onClick={() => { setSection('review'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white text-charcoal px-6 py-3 font-medium text-[15px] hover:bg-ivory-deep/40 transition">
          Review submission
        </button>
        <button type="button" onClick={resetDemo} className="inline-flex items-center justify-center gap-2 rounded-md bg-olive text-white px-7 py-3 font-medium text-[15px] hover:bg-olive-light transition shadow-sm">
          Restart demonstration
        </button>
      </div>
    </div>
  );
}
