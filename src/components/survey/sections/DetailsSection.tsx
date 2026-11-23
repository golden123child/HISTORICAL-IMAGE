import { useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import type { PictureMetadata, PictureSlot } from '../../../types';
import PictureModal from '../PictureModal';

export default function DetailsSection() {
  const { state, setSection, updatePictureImage, updatePictureMetadata, removePictureImage, clearPictureSlot } = useApp();
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  const uploaded = useMemo(() => state.pictures.filter((p) => p.imageDataUrl), [state.pictures]);
  const activeSlot = useMemo(() => state.pictures.find((p) => p.slotNumber === editingSlot) || null, [state.pictures, editingSlot]);

  const handleSave = (slotNumber: number, data: { imageDataUrl: string | null; fileName: string | null; fileSize: number | null; metadata: PictureMetadata }) => {
    if (data.imageDataUrl) {
      updatePictureImage(slotNumber, { imageDataUrl: data.imageDataUrl, fileName: data.fileName || 'image', fileSize: data.fileSize || 0 });
    } else {
      removePictureImage(slotNumber);
    }
    updatePictureMetadata(slotNumber, data.metadata);
    setEditingSlot(null);
  };

  const completionFor = (slot: PictureSlot) => {
    const m = slot.metadata;
    const checks = [m.title, m.description, m.category, m.approxYear || m.yearUnknown ? 'ok' : '', m.country || m.locationUnknown ? 'ok' : '', m.historicalContext];
    const filled = checks.filter((v) => String(v).trim()).length;
    return Math.round((filled / checks.length) * 100);
  };

  return (
    <div className="max-w-5xl">
      <p className="text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-3">Section 4 of 5</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-charcoal leading-[1.1] mb-3">Picture details</h1>
      <p className="text-[15px] sm:text-base text-muted max-w-2xl leading-relaxed mb-10">
        Add context to the photographs you've contributed. Titles, dates, locations, and stories help future viewers understand what each image represents.
      </p>

      {uploaded.length === 0 ? (
        <div className="bg-white border border-border-light rounded-lg px-6 py-14 text-center">
          <div className="w-14 h-14 rounded-full bg-ivory-deep text-muted flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-4-4 3-2-1.5L3 17"/></svg>
          </div>
          <h2 className="font-serif text-2xl text-charcoal mb-2">No photographs added yet</h2>
          <p className="text-muted max-w-md mx-auto mb-6">Once you add photographs to your collection, you'll be able to review and enrich their details here.</p>
          <button type="button" onClick={() => { setSection('collection'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center justify-center rounded-md bg-olive text-white px-6 py-3 text-sm font-medium hover:bg-olive-light transition">
            Go to Picture Collection
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {uploaded.map((slot) => {
            const m = slot.metadata;
            const pct = completionFor(slot);
            return (
              <article key={slot.id} className="bg-white border border-border-light rounded-lg overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-56 md:w-64 shrink-0 bg-[#e9e4db]">
                    <img src={slot.imageDataUrl!} alt={m.title || slot.suggestedLabel} className="w-full h-52 sm:h-full object-cover" />
                  </div>
                  <div className="flex-1 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div>
                        <p className="text-[11px] tracking-[0.18em] uppercase text-muted mb-1">Picture {String(slot.slotNumber).padStart(2, '0')} · {slot.suggestedLabel}</p>
                        <h3 className="font-serif text-2xl text-charcoal leading-tight">{m.title || 'Untitled photograph'}</h3>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs text-muted">{pct}% detailed</span>
                        <div className="w-20 h-1.5 bg-ivory-deep rounded-full overflow-hidden"><div className="h-full bg-olive rounded-full" style={{ width: `${pct}%` }} /></div>
                      </div>
                    </div>

                    <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
                      <div><dt className="text-muted inline">Category: </dt><dd className="inline text-charcoal">{m.category || <span className="text-muted/70 italic">Not specified</span>}</dd></div>
                      <div><dt className="text-muted inline">Year: </dt><dd className="inline text-charcoal">{m.yearUnknown ? 'Unknown' : m.approxYear ? `${m.yearIsApproximate ? 'c. ' : ''}${m.approxYear}` : <span className="text-muted/70 italic">Not specified</span>}</dd></div>
                      <div className="sm:col-span-2"><dt className="text-muted inline">Location: </dt><dd className="inline text-charcoal">{m.locationUnknown ? 'Unknown' : [m.cityTown, m.stateRegion, m.country].filter(Boolean).join(', ') || <span className="text-muted/70 italic">Not specified</span>}</dd></div>
                    </dl>

                    <p className="text-sm text-charcoal-soft leading-relaxed mb-4 line-clamp-3">
                      {m.description || <span className="text-muted/70 italic">No description added yet.</span>}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setEditingSlot(slot.slotNumber)} className="inline-flex items-center justify-center rounded-md bg-olive text-white px-4 py-2 text-sm font-medium hover:bg-olive-light transition">Edit details</button>
                      <button type="button" onClick={() => clearPictureSlot(slot.slotNumber)} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-muted hover:text-danger hover:border-danger/20 hover:bg-danger-pale/30 transition">Remove</button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-10 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
        <button type="button" onClick={() => { setSection('collection'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white text-charcoal px-6 py-3 font-medium text-[15px] hover:bg-ivory-deep/40 transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Previous
        </button>
        <button type="button" onClick={() => { setSection('review'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-olive text-white px-7 py-3 font-medium text-[15px] hover:bg-olive-light transition">
          Continue to Review
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      {activeSlot && (
        <PictureModal slot={activeSlot} onClose={() => setEditingSlot(null)} onSave={handleSave} onRemoveImage={removePictureImage} />
      )}
    </div>
  );
}
