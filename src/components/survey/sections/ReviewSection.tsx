import { useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function ReviewSection() {
  const { state, setSection, submitSurvey, uploadedCount, requiredQuestionnaireMissing } = useApp();
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const p = state.participantInfo;
  const uploaded = useMemo(() => state.pictures.filter((pic) => pic.imageDataUrl), [state.pictures]);

  const questionnaireRows: { label: string; value: string; missing?: boolean }[] = [
    { label: 'Full name', value: p.fullName, missing: !p.fullName.trim() },
    { label: 'Age range', value: p.ageRange, missing: !p.ageRange },
    { label: 'Country', value: p.country, missing: !p.country },
    { label: 'State / region', value: p.stateRegion },
    { label: 'City / town', value: p.cityTown },
    { label: 'Preferred language', value: p.preferredLanguage, missing: !p.preferredLanguage },
    { label: 'Connection to history', value: p.connectionToHistory, missing: !p.connectionToHistory },
    { label: 'Eras of interest', value: p.eraOfInterest.join(', ') },
    { label: 'Contribution consent', value: p.consentToShare ? 'Confirmed' : 'Not confirmed', missing: !p.consentToShare },
  ];

  const onSubmit = async () => {
    setSubmitErrors([]);
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    const result = submitSurvey();
    if (!result.ok) {
      setSubmitErrors(result.errors);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-5xl">
      <p className="text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-3">Section 5 of 5</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-charcoal leading-[1.1] mb-3">Review & submit</h1>
      <p className="text-muted max-w-2xl leading-relaxed mb-8">
        Review your information and photographs before submitting. You can return to any section to make changes.
      </p>

      {submitErrors.length > 0 && (
        <div className="mb-6 rounded-lg border border-danger/20 bg-danger-pale px-5 py-4" role="alert">
          <p className="font-medium text-danger mb-2">Please resolve the following before submitting:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-danger/90">
            {submitErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        <section className="bg-white border border-border-light rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-ivory/30">
            <div>
              <h2 className="font-serif text-2xl text-charcoal">Participant information</h2>
              <p className="text-sm text-muted">Your questionnaire responses.</p>
            </div>
            <button type="button" onClick={() => { setSection('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-sm font-medium text-olive hover:text-olive-light">Edit section</button>
          </div>
          <dl className="divide-y divide-border-light">
            {questionnaireRows.map((row) => (
              <div key={row.label} className="px-6 py-3.5 sm:grid sm:grid-cols-3 gap-4">
                <dt className="text-sm text-muted">{row.label}</dt>
                <dd className={`text-sm sm:col-span-2 mt-1 sm:mt-0 ${row.missing ? 'text-danger' : 'text-charcoal'}`}>
                  {row.value ? row.value : <span className={row.missing ? 'text-danger' : 'text-muted/70 italic'}>{row.missing ? 'Required — missing' : 'Not provided'}</span>}
                </dd>
              </div>
            ))}
          </dl>
          {requiredQuestionnaireMissing.length > 0 && (
            <div className="px-6 py-3 bg-danger-pale/30 border-t border-danger/10 text-sm text-danger">
              {requiredQuestionnaireMissing.length} required questionnaire {requiredQuestionnaireMissing.length === 1 ? 'field is' : 'fields are'} missing.
            </div>
          )}
        </section>

        <section className="bg-white border border-border-light rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-ivory/30">
            <div>
              <h2 className="font-serif text-2xl text-charcoal">Picture collection</h2>
              <p className="text-sm text-muted">{uploadedCount} of 26 photographs contributed.</p>
            </div>
            <div className="flex gap-3 text-sm font-medium">
              <button type="button" onClick={() => { setSection('collection'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-olive hover:text-olive-light">Edit collection</button>
              <button type="button" onClick={() => { setSection('details'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-olive hover:text-olive-light">Edit details</button>
            </div>
          </div>

          {uploaded.length === 0 ? (
            <div className="px-6 py-10 text-center text-muted">
              <p className="mb-2">No photographs have been added yet.</p>
              <p className="text-sm">At least one photograph is required before submission.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {uploaded.map((slot) => {
                const m = slot.metadata;
                const missingOptional: string[] = [];
                if (!m.category) missingOptional.push('category');
                if (!m.approxYear && !m.yearUnknown) missingOptional.push('year');
                if (!m.country && !m.locationUnknown) missingOptional.push('location');
                if (!m.historicalContext) missingOptional.push('historical context');
                return (
                  <div key={slot.id} className="px-6 py-4 flex gap-4">
                    <img src={slot.imageDataUrl!} alt={m.title || slot.suggestedLabel} className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg bg-[#e9e4db] border border-border-light shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">Picture {String(slot.slotNumber).padStart(2, '0')} · {slot.suggestedLabel}</p>
                      <h3 className="font-medium text-charcoal truncate">{m.title || 'Untitled photograph'}</h3>
                      <p className="text-sm text-charcoal-soft mt-1 line-clamp-2">{m.description || <span className="text-muted/70 italic">No description</span>}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted">
                        <span>{m.yearUnknown ? 'Year unknown' : m.approxYear ? `${m.yearIsApproximate ? 'c. ' : ''}${m.approxYear}` : 'Year not specified'}</span>
                        <span>{m.locationUnknown ? 'Location unknown' : [m.cityTown, m.stateRegion, m.country].filter(Boolean).join(', ') || 'Location not specified'}</span>
                      </div>
                      {missingOptional.length > 0 && (
                        <p className="text-xs text-bronze mt-2">Optional details missing: {missingOptional.join(', ')}.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-olive-pale/30 border border-olive/10 rounded-xl px-6 py-5">
          <h2 className="font-serif text-xl text-charcoal mb-1">Ready to submit?</h2>
          <p className="text-sm text-charcoal-soft leading-relaxed">
            Submitting will create a simulated demonstration submission. No data is sent to a real server. You can restart the demonstration after submission.
          </p>
        </section>
      </div>

      <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-between gap-3 no-print">
        <button type="button" onClick={() => { setSection('details'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white text-charcoal px-6 py-3 font-medium text-[15px] hover:bg-ivory-deep/40 transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Previous
        </button>
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white text-charcoal px-6 py-3 font-medium text-[15px] hover:bg-ivory-deep/40 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
            Print summary
          </button>
          <button type="button" onClick={onSubmit} disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-md bg-olive text-white px-7 py-3 font-medium text-[15px] hover:bg-olive-light transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                Submitting...
              </>
            ) : (
              'Submit demonstration survey'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
