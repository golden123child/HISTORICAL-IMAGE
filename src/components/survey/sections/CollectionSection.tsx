import { useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import type { PictureMetadata, PictureSlot } from '../../../types';
import PictureModal from '../PictureModal';

export default function CollectionSection() {
  const { state, setSection, updatePictureImage, updatePictureMetadata, removePictureImage, clearPictureSlot, uploadedCount } = useApp();
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [previewSlot, setPreviewSlot] = useState<number | null>(null);

  const pictures = state.pictures;
  const progressPct = Math.round((uploadedCount / 26) * 100);

  const activeSlot = useMemo(() => pictures.find((p) => p.slotNumber === editingSlot) || null, [pictures, editingSlot]);
  const previewed = useMemo(() => pictures.find((p) => p.slotNumber === previewSlot) || null, [pictures, previewSlot]);

  const openSlot = (slotNumber: number) => setEditingSlot(slotNumber);
  const closeModal = () => setEditingSlot(null);

  const handleSave = (slotNumber: number, data: { imageDataUrl: string | null; fileName: string | null; fileSize: number | null; metadata: PictureMetadata }) => {
    if (data.imageDataUrl) {
      updatePictureImage(slotNumber, { imageDataUrl: data.imageDataUrl, fileName: data.fileName || 'image', fileSize: data.fileSize || 0 });
    } else {
      removePictureImage(slotNumber);
    }
    updatePictureMetadata(slotNumber, data.metadata);
    setEditingSlot(null);
  };

  const handleRemove = (slotNumber: number) => {
    clearPictureSlot(slotNumber);
  };

  const nextSlotToFill = pictures.find((p) => !p.imageDataUrl);

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
        <div>
          <p className="text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-3">Section 3 of 5</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal leading-[1.1] mb-3">Your picture collection</h1>
          <p className="text-muted max-w-2xl leading-relaxed">
            Help preserve history by sharing photographs and the stories behind them. Add up to 26 images — each one contributes to the archive.
          </p>
        </div>
        <div className="bg-white border border-border-light rounded-xl px-5 py-4 min-w-[240px]">
          <div className="flex items-end justify-between gap-4 mb-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted mb-1">Collection progress</p>
              <p className="font-serif text-3xl text-charcoal leading-none">{uploadedCount} <span className="text-lg text-muted font-sans font-normal">of 26</span></p>
            </div>
            <p className="text-sm font-medium text-olive">{progressPct}%</p>
          </div>
          <div className="h-2 bg-ivory-deep rounded-full overflow-hidden">
            <div className="h-full bg-olive rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs text-muted mt-2">{uploadedCount === 0 ? 'No photographs added yet.' : uploadedCount === 26 ? 'Collection complete — all slots filled.' : `${26 - uploadedCount} slot${26 - uploadedCount === 1 ? '' : 's'} remaining.`}</p>
        </div>
      </div>

      <div className="bg-olive-pale/30 border border-olive/10 rounded-lg px-4 py-3 text-sm text-charcoal-soft mb-7 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <p><span className="font-medium text-charcoal">Tip:</span> Click any slot to upload a photograph and add its story. You can edit or replace images at any time before submission.</p>
        {nextSlotToFill && (
          <button type="button" onClick={() => openSlot(nextSlotToFill.slotNumber)} className="shrink-0 inline-flex items-center justify-center gap-2 rounded-md bg-olive text-white px-4 py-2 text-sm font-medium hover:bg-olive-light transition">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Add photograph
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {pictures.map((slot) => (
          <PictureCard
            key={slot.id}
            slot={slot}
            onEdit={() => openSlot(slot.slotNumber)}
            onPreview={() => slot.imageDataUrl && setPreviewSlot(slot.slotNumber)}
            onRemove={() => handleRemove(slot.slotNumber)}
          />
        ))}
      </div>

      <div className="mt-10 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
        <button type="button" onClick={() => { setSection('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white text-charcoal px-6 py-3 font-medium text-[15px] hover:bg-ivory-deep/40 transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Previous
        </button>
        <button type="button" onClick={() => { setSection('details'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-olive text-white px-7 py-3 font-medium text-[15px] hover:bg-olive-light transition">
          Continue to Picture Details
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      {activeSlot && (
        <PictureModal
          slot={activeSlot}
          onClose={closeModal}
          onSave={handleSave}
          onRemoveImage={removePictureImage}
        />
      )}

      {previewed && previewed.imageDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Picture preview" onClick={() => setPreviewSlot(null)}>
          <div className="absolute inset-0 bg-charcoal/70 backdrop-blur-sm" />
          <div className="relative max-w-5xl w-full max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3 border-b border-border-light">
              <div className="min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">{previewed.metadata.title || previewed.suggestedLabel}</p>
                <p className="text-xs text-muted">Picture {String(previewed.slotNumber).padStart(2, '0')}</p>
              </div>
              <button type="button" onClick={() => setPreviewSlot(null)} className="w-8 h-8 rounded-full border border-border text-muted hover:text-charcoal flex items-center justify-center" aria-label="Close preview">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
              </button>
            </div>
            <div className="bg-[#e9e4db] flex items-center justify-center max-h-[calc(90vh-60px)] overflow-auto">
              <img src={previewed.imageDataUrl} alt={previewed.metadata.title || `Picture ${previewed.slotNumber}`} className="max-w-full max-h-[calc(90vh-60px)] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PictureCard({ slot, onEdit, onPreview, onRemove }: { slot: PictureSlot; onEdit: () => void; onPreview: () => void; onRemove: () => void }) {
  const hasImage = !!slot.imageDataUrl;
  const title = slot.metadata.title || slot.suggestedLabel;

  return (
    <div className={`group bg-white border rounded-xl overflow-hidden transition hover:shadow-[0_2px_12px_rgba(44,44,44,0.06)] ${hasImage ? 'border-border-light' : 'border-border border-dashed'}`}>
      <button
        type="button"
        onClick={hasImage ? onPreview : onEdit}
        className="w-full text-left"
        aria-label={hasImage ? `Preview ${title}` : `Add photograph to slot ${slot.slotNumber}`}
      >
        <div className={`relative aspect-[4/3] overflow-hidden ${hasImage ? 'bg-[#e9e4db]' : 'bg-ivory/70'}`}>
          {hasImage ? (
            <>
              <img src={slot.imageDataUrl!} alt={title} className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.02]" />
              <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/10 transition" />
              <div className="absolute top-2.5 left-2.5">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/92 backdrop-blur text-[10px] font-semibold tracking-wider text-charcoal uppercase">
                  {String(slot.slotNumber).padStart(2, '0')}
                </span>
              </div>
              <div className="absolute top-2.5 right-2.5">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-olive/90 text-white text-[10px] font-medium">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  Added
                </span>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-10 h-10 rounded-full border border-border bg-white text-muted flex items-center justify-center mb-2.5 group-hover:border-olive/30 group-hover:text-olive transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <p className="text-[11px] font-medium tracking-wider uppercase text-muted">Picture {String(slot.slotNumber).padStart(2, '0')}</p>
              <p className="text-xs text-muted/80 mt-1">Empty slot</p>
            </div>
          )}
        </div>
      </button>
      <div className="px-3.5 py-3">
        <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">{slot.suggestedLabel}</p>
        <p className="text-sm font-medium text-charcoal truncate" title={title}>{title}</p>
        <div className="flex items-center gap-2 mt-3">
          <button type="button" onClick={onEdit} className="flex-1 inline-flex items-center justify-center rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-charcoal hover:bg-ivory-deep/40 transition">
            {hasImage ? 'Edit' : 'Add photo'}
          </button>
          {hasImage && (
            <button type="button" onClick={onRemove} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-muted hover:text-danger hover:border-danger/20 hover:bg-danger-pale/30 transition" aria-label={`Remove picture ${slot.slotNumber}`}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
