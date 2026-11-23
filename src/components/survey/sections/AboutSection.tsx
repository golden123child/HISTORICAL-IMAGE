import { useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { AGE_RANGES, CONNECTION_OPTIONS, COUNTRIES, ERA_OPTIONS, LANGUAGES } from '../../../data/demoData';

export default function AboutSection() {
  const { state, updateParticipantInfo, setSection } = useApp();
  const p = state.participantInfo;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof p, value: string | boolean | string[]) => {
    updateParticipantInfo({ [key]: value } as Partial<typeof p>);
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const toggleEra = (era: string) => {
    const next = p.eraOfInterest.includes(era)
      ? p.eraOfInterest.filter((x) => x !== era)
      : [...p.eraOfInterest, era];
    set('eraOfInterest', next);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!p.fullName.trim()) next.fullName = 'Full name is required.';
    if (!p.ageRange) next.ageRange = 'Please select an age range.';
    if (!p.country) next.country = 'Please select a country.';
    if (!p.preferredLanguage) next.preferredLanguage = 'Please select a preferred language.';
    if (!p.connectionToHistory) next.connectionToHistory = 'Please select an option.';
    if (!p.consentToShare) next.consentToShare = 'Please confirm this to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onNext = () => {
    if (validate()) {
      setSection('collection');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const completion = useMemo(() => {
    const required = ['fullName', 'ageRange', 'country', 'preferredLanguage', 'connectionToHistory', 'consentToShare'] as const;
    const done = required.filter((k) => {
      const v = p[k];
      if (typeof v === 'boolean') return v;
      return String(v).trim().length > 0;
    }).length;
    return Math.round((done / required.length) * 100);
  }, [p]);

  const inputCls = (key: string) => `w-full rounded-md border px-3.5 py-2.5 text-[15px] bg-white outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10 ${errors[key] ? 'border-danger/50' : 'border-border'}`;

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-3">Section 2 of 5</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal leading-[1.1] mb-3">About the participant</h1>
          <p className="text-muted max-w-2xl leading-relaxed">
            Tell us a little about yourself. This context helps us understand the voices and communities represented in the collection.
          </p>
        </div>
        <div className="shrink-0 bg-white border border-border-light rounded-lg px-4 py-3 sm:min-w-[160px]">
          <p className="text-[11px] uppercase tracking-wider text-muted mb-1">Section completion</p>
          <p className="font-serif text-2xl text-charcoal">{completion}%</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-white border border-border-light rounded-xl p-6 sm:p-8">
          <h2 className="font-serif text-2xl text-charcoal mb-1">Personal information</h2>
          <p className="text-sm text-muted mb-6">Fields marked with <span className="text-danger">*</span> are required.</p>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-charcoal mb-1.5">Full name <span className="text-danger">*</span></label>
              <input id="fullName" value={p.fullName} onChange={(e) => set('fullName', e.target.value)} className={inputCls('fullName')} placeholder="Your full name" autoComplete="name" />
              {errors.fullName && <p className="mt-1.5 text-xs text-danger">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="ageRange" className="block text-sm font-medium text-charcoal mb-1.5">Age range <span className="text-danger">*</span></label>
              <select id="ageRange" value={p.ageRange} onChange={(e) => set('ageRange', e.target.value)} className={inputCls('ageRange')}>
                <option value="">Select age range</option>
                {AGE_RANGES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.ageRange && <p className="mt-1.5 text-xs text-danger">{errors.ageRange}</p>}
            </div>

            <div>
              <label htmlFor="preferredLanguage" className="block text-sm font-medium text-charcoal mb-1.5">Preferred language <span className="text-danger">*</span></label>
              <select id="preferredLanguage" value={p.preferredLanguage} onChange={(e) => set('preferredLanguage', e.target.value)} className={inputCls('preferredLanguage')}>
                <option value="">Select language</option>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              {errors.preferredLanguage && <p className="mt-1.5 text-xs text-danger">{errors.preferredLanguage}</p>}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-charcoal mb-1.5">Country <span className="text-danger">*</span></label>
              <select id="country" value={p.country} onChange={(e) => set('country', e.target.value)} className={inputCls('country')}>
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.country && <p className="mt-1.5 text-xs text-danger">{errors.country}</p>}
            </div>

            <div>
              <label htmlFor="stateRegion" className="block text-sm font-medium text-charcoal mb-1.5">State / region</label>
              <input id="stateRegion" value={p.stateRegion} onChange={(e) => set('stateRegion', e.target.value)} className={inputCls('stateRegion')} placeholder="e.g. Lagos" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cityTown" className="block text-sm font-medium text-charcoal mb-1.5">City / town</label>
              <input id="cityTown" value={p.cityTown} onChange={(e) => set('cityTown', e.target.value)} className={inputCls('cityTown')} placeholder="e.g. Ikeja" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-border-light rounded-xl p-6 sm:p-8">
          <h2 className="font-serif text-2xl text-charcoal mb-1">Your connection to history</h2>
          <p className="text-sm text-muted mb-6">These answers help us understand the perspective behind your contributions.</p>

          <div className="space-y-6">
            <div>
              <label htmlFor="connectionToHistory" className="block text-sm font-medium text-charcoal mb-1.5">What best describes your connection to the photographs or history you're sharing? <span className="text-danger">*</span></label>
              <select id="connectionToHistory" value={p.connectionToHistory} onChange={(e) => set('connectionToHistory', e.target.value)} className={inputCls('connectionToHistory')}>
                <option value="">Select an option</option>
                {CONNECTION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {errors.connectionToHistory && <p className="mt-1.5 text-xs text-danger">{errors.connectionToHistory}</p>}
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-charcoal mb-2">Which time periods are most represented in the photographs you plan to share? <span className="text-muted font-normal">(optional)</span></legend>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {ERA_OPTIONS.map((era) => {
                  const checked = p.eraOfInterest.includes(era);
                  return (
                    <label key={era} className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md border text-sm cursor-pointer transition ${checked ? 'border-olive/30 bg-olive-pale/40 text-charcoal' : 'border-border bg-white text-charcoal-soft hover:border-border'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleEra(era)} className="w-4 h-4 accent-[#3D4A3A]" />
                      <span>{era}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="pt-2">
              <label className={`flex items-start gap-3 p-4 rounded-lg border text-sm cursor-pointer ${errors.consentToShare ? 'border-danger/30 bg-danger-pale/30' : 'border-border bg-ivory/40'}`}>
                <input type="checkbox" checked={p.consentToShare} onChange={(e) => set('consentToShare', e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#3D4A3A]" />
                <span className="text-charcoal-soft leading-relaxed">
                  <span className="font-medium text-charcoal">Contribution consent (demonstration).</span> I confirm that I have the right to share the photographs and information I contribute, and I understand this prototype is for demonstration purposes only. <span className="text-danger">*</span>
                </span>
              </label>
              {errors.consentToShare && <p className="mt-1.5 text-xs text-danger">{errors.consentToShare}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
        <button type="button" onClick={() => { setSection('introduction'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white text-charcoal px-6 py-3 font-medium text-[15px] hover:bg-ivory-deep/40 transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Previous
        </button>
        <button type="button" onClick={onNext} className="inline-flex items-center justify-center gap-2 rounded-md bg-olive text-white px-7 py-3 font-medium text-[15px] hover:bg-olive-light transition">
          Continue to Picture Collection
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}
