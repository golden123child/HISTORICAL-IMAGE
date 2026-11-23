import { useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import type { PictureMetadata, PictureSlot } from '../../../types';
import PictureModal from '../PictureModal';

type Filter = 'all' | 'added' | 'empty';

const DEMO_SAMPLES: Array<{ title: string; category: string; approxYear: string; yearIsApproximate: boolean; country: string; stateRegion: string; cityTown: string; description: string; historicalContext: string; peopleSubjects: string; imageUrl: string; suggestedLabel: string }> = [
  {
    title: 'Community life in a historic neighbourhood',
    category: 'Family',
    approxYear: '1968',
    yearIsApproximate: true,
    country: 'Nigeria',
    stateRegion: 'Lagos',
    cityTown: 'Lagos Island',
    description: 'A street scene capturing everyday movement, local architecture, and community life in a historic African neighbourhood.',
    historicalContext: 'Photographs like this preserve valuable context about place, daily routines, and community memory.',
    peopleSubjects: 'Local residents and passersby',
    imageUrl: '/images/archive-africa.jpg',
    suggestedLabel: 'Street Scene',
  },
  {
    title: 'Community album of remembered places',
    category: 'Community',
    approxYear: '1955',
    yearIsApproximate: true,
    country: 'Ghana',
    stateRegion: 'Greater Accra',
    cityTown: 'Accra',
    description: 'A collection of preserved photographs showing local streets, gatherings, and landmarks kept in a family album over many years.',
    historicalContext: 'Personal albums often serve as informal archives, preserving images that might otherwise be lost.',
    peopleSubjects: 'Community members and local residents',
    imageUrl: '/images/archive-album.jpg',
    suggestedLabel: 'Community Gathering',
  },
  {
    title: 'Street scene from a historic neighbourhood',
    category: 'Place / Landmark',
    approxYear: '1942',
    yearIsApproximate: false,
    country: 'United Kingdom',
    stateRegion: 'England',
    cityTown: 'London',
    description: 'A street scene showing buildings, pedestrians, and daily movement through a historic neighbourhood.',
    historicalContext: 'Urban photographs provide valuable evidence of architecture, transport, and social life in a specific period.',
    peopleSubjects: 'Pedestrians and local workers',
    imageUrl: '/images/archive-collection.jpg',
    suggestedLabel: 'Street Scene',
  },
];

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}

export default function CollectionSection() {
  const { state, setSection, updatePictureImage, updatePictureMetadata, removePictureImage, clearPictureSlot, uploadedCount } = useApp();
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [previewSlot, setPreviewSlot] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [loadingSamples, setLoadingSamples] = useState(false);

  const pictures = state.pictures;
  const progressPct = Math.round((uploadedCount / 26) * 100);

  const activeSlot = useMemo(() => pictures.find((p) => p.slotNumber === editingSlot) || null, [pictures, editingSlot]);
  const previewed = useMemo(() => pictures.find((p) => p.slotNumber === previewSlot) || null, [pictures, previewSlot]);

  const filtered = useMemo(() => {
    if (filter === 'added') return pictures.filter((p) => p.imageDataUrl);
    if (filter === 'empty') return pictures.filter((p) => !p.imageDataUrl);
    return pictures;
  }, [pictures, filter]);

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

  const handleRemove = (slotNumber: number) => clearPictureSlot(slotNumber);

  const nextSlotToFill = pictures.find((p) => !p.imageDataUrl);

  const loadDemoSamples = async () => {
    if (loadingSamples) return;
    setLoadingSamples(true);
    try {
      const emptySlots = pictures.filter((p) => !p.imageDataUrl).slice(0, DEMO_SAMPLES.length);
      for (let i = 0; i < emptySlots.length; i++) {
        const slot = emptySlots[i];
        const sample = DEMO_SAMPLES[i];
        try {
          const dataUrl = await urlToDataUrl(sample.imageUrl);
          updatePictureImage(slot.slotNumber, { imageDataUrl: dataUrl, fileName: sample.imageUrl.split('/').pop() || 'sample.jpg', fileSize: 0 });
          updatePictureMetadata(slot.slotNumber, {
            title: sample.title,
            category: sample.category,
            approxYear: sample.approxYear,
            yearIsApproximate: sample.yearIsApproximate,
            yearUnknown: false,
            country: sample.country,
            stateRegion: sample.stateRegion,
            cityTown: sample.cityTown,
            locationDetails: '',
            locationUnknown: false,
            description: sample.description,
            historicalContext: sample.historicalContext,
            peopleSubjects: sample.peopleSubjects,
            additionalNotes: 'Sample entry loaded for demonstration purposes.',
          });
        } catch {
          // skip failed sample
        }
      }
    } finally {
      setLoadingSamples(false);
    }
  };

  const filterBtn = (id: Filter, label: string, count: number) => (
    <button
      type="button"
      onClick={() => setFilter(id)}
      className={`px-3.5 py-2 rounded-md text-sm font-medium transition ${filter === id ? 'bg-olive text-white shadow-sm' : 'bg-white text-charcoal-soft border border-border hover:bg-ivory-deep/40'}`}
    >
      {label} <span className={`${filter === id ? 'text-white/75' : 'text-muted'}`}>({count})</span>
    </button>
  );

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6 mb-10">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-3">
            <span className="w-6 h-px bg-bronze/60" /> Section 3 of 5
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal leading-[1.1] mb-3">Your picture collection</h1>
          <p className="text-[15px] sm:text-base text-muted max-w-2xl leading-relaxed">
            Help preserve history by sharing photographs and the stories behind them. Add up to 26 images — each one contributes to the archive.
          </p>
        </div>
        <div className="bg-white border border-border-light rounded-lg px-5 py-4 w-full xl:w-auto xl:min-w-[280px]">
          <div className="flex items-end justify-between gap-4 mb-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted mb-1">Collection progress</p>
              <p className="font-serif text-3xl text-charcoal leading-none">{uploadedCount} <span className="text-lg text-muted font-sans font-normal">of 26</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-olive">{progressPct}%</p>
              <p className="text-[11px] text-muted">complete</p>
            </div>
          </div>
          <div className="h-2 bg-ivory-deep rounded-full overflow-hidden">
            <div className="h-full bg-olive rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs text-muted mt-2">{uploadedCount === 0 ? 'No photographs added yet.' : uploadedCount === 26 ? 'Collection complete — all slots filled.' : `${26 - uploadedCount} slot${26 - uploadedCount === 1 ? '' : 's'} remaining.`}</p>
        </div>
      </div>

      <div className="bg-white border border-border-light rounded-lg p-4 sm:p-5 mb-8 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterBtn('all', 'All slots', 26)}
          {filterBtn('added', 'Added', uploadedCount)}
          {filterBtn('empty', 'Empty', 26 - uploadedCount)}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadDemoSamples}
            disabled={loadingSamples || uploadedCount >= 26}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-bronze/30 bg-bronze-pale/40 text-bronze px-4 py-2 text-sm font-medium hover:bg-bronze-pale transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingSamples ? 'Loading samples...' : 'Load demo samples'}
          </button>
          {nextSlotToFill && (
            <button type="button" onClick={() => openSlot(nextSlotToFill.slotNumber)} className="inline-flex items-center justify-center gap-2 rounded-md bg-olive text-white px-4 py-2 text-sm font-medium hover:bg-olive-light transition">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Add photograph
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {filtered.map((slot) => (
          <PictureCard
            key={slot.id}
            slot={slot}
            onEdit={() => openSlot(slot.slotNumber)}
            onPreview={() => slot.imageDataUrl && setPreviewSlot(slot.slotNumber)}
            onRemove={() => handleRemove(slot.slotNumber)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-border-light rounded-lg py-14 text-center text-muted">
          <p className="font-serif text-2xl text-charcoal mb-2">No slots in this view</p>
          <p className="text-sm">Try a different filter to see your collection.</p>
        </div>
      )}

      <div className="mt-10 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
        <button type="button" onClick={() => { setSection('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white text-charcoal px-6 py-3 font-medium text-[15px] hover:bg-ivory-deep/40 transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Previous
        </button>
        <button type="button" onClick={() => { setSection('details'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-olive text-white px-7 py-3 font-medium text-[15px] hover:bg-olive-light transition shadow-sm">
          Continue to Picture Details
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      {activeSlot && (
        <PictureModal slot={activeSlot} onClose={closeModal} onSave={handleSave} onRemoveImage={removePictureImage} />
      )}

      {previewed && previewed.imageDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Picture preview" onClick={() => setPreviewSlot(null)}>
          <div className="absolute inset-0 bg-charcoal/75 backdrop-blur-sm" />
          <div className="relative max-w-5xl w-full max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3 border-b border-border-light">
              <div className="min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">{previewed.metadata.title || previewed.suggestedLabel}</p>
                <p className="text-xs text-muted">Picture {String(previewed.slotNumber).padStart(2, '0')}</p>
              </div>
              <button type="button" onClick={() => setPreviewSlot(null)} className="w-8 h-8 rounded-full border border-border text-muted hover:text-charcoal flex items-center justify-center" aria-label="Close preview">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
              </button>
            </div>
            <div className="bg-[#F5F5F5] flex items-center justify-center max-h-[calc(90vh-60px)] overflow-auto">
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
    <div className={`group bg-white border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-sm ${hasImage ? 'border-border-light' : 'border-border border-dashed'}`}>
      <button type="button" onClick={hasImage ? onPreview : onEdit} className="w-full text-left" aria-label={hasImage ? `Preview ${title}` : `Add photograph to slot ${slot.slotNumber}`}>
        <div className={`relative aspect-[4/3] overflow-hidden ${hasImage ? 'bg-[#F5F5F5]' : 'bg-ivory/60'}`}>
          {hasImage ? (
            <>
              <img src={slot.imageDataUrl!} alt={title} className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/10 transition" />
              <div className="absolute top-2.5 left-2.5">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/92 backdrop-blur text-[10px] font-semibold tracking-wider text-charcoal uppercase">{String(slot.slotNumber).padStart(2, '0')}</span>
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
              <div className="w-11 h-11 rounded-full border border-border bg-white text-muted flex items-center justify-center mb-2.5 group-hover:border-olive/30 group-hover:text-olive group-hover:bg-olive-pale/30 transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <p className="text-[11px] font-medium tracking-wider uppercase text-muted">Picture {String(slot.slotNumber).padStart(2, '0')}</p>
              <p className="text-xs text-muted/80 mt-1">Add photograph</p>
            </div>
          )}
        </div>
      </button>
      <div className="px-3.5 py-3.5">
        <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5 truncate">{slot.suggestedLabel}</p>
        <p className="text-sm font-medium text-charcoal truncate" title={title}>{title}</p>
        <div className="flex items-center gap-2 mt-3">
          <button type="button" onClick={onEdit} className="flex-1 inline-flex items-center justify-center rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-charcoal hover:bg-ivory-deep/40 transition">{hasImage ? 'Edit' : 'Add photo'}</button>
          {hasImage && (
            <button type="button" onClick={onRemove} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-muted hover:text-danger hover:border-danger/20 hover:bg-danger-pale/30 transition" aria-label={`Remove picture ${slot.slotNumber}`}>Remove</button>
          )}
        </div>
      </div>
    </div>
  );
}
