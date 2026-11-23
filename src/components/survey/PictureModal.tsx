import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { PICTURE_CATEGORIES } from '../../data/demoData';
import type { PictureMetadata, PictureSlot } from '../../types';
import { formatFileSize, isAcceptedImage, readImageAsDataUrl } from '../../utils/image';

interface Props {
  slot: PictureSlot;
  onClose: () => void;
  onSave: (slotNumber: number, data: { imageDataUrl: string | null; fileName: string | null; fileSize: number | null; metadata: PictureMetadata }) => void;
  onRemoveImage: (slotNumber: number) => void;
}

export default function PictureModal({ slot, onClose, onSave, onRemoveImage }: Props) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(slot.imageDataUrl);
  const [fileName, setFileName] = useState<string | null>(slot.fileName);
  const [fileSize, setFileSize] = useState<number | null>(slot.fileSize);
  const [meta, setMeta] = useState<PictureMetadata>({ ...slot.metadata });
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    // focus dialog
    dialogRef.current?.focus();
  }, []);

  const setField = <K extends keyof PictureMetadata>(key: K, value: PictureMetadata[K]) => {
    setMeta((m) => ({ ...m, [key]: value }));
    if (errors[key as string]) setErrors((e) => { const n = { ...e }; delete n[key as string]; return n; });
  };

  const handleFile = async (file: File | undefined) => {
    setFileError('');
    if (!file) return;
    if (!isAcceptedImage(file)) {
      setFileError('Unsupported file format. Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setFileError('This file is too large for the demonstration. Please choose an image under 20 MB.');
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setImageDataUrl(dataUrl);
      setFileName(file.name);
      setFileSize(file.size);
      if (!meta.title) {
        const base = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
        if (base) setField('title', base.charAt(0).toUpperCase() + base.slice(1));
      }
    } catch {
      setFileError('We could not read that image. Please try another file.');
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    void handleFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0]);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!imageDataUrl) next.image = 'Please upload an image for this slot, or cancel to leave it empty.';
    if (!meta.title.trim()) next.title = 'Picture title is required.';
    if (!meta.description.trim()) next.description = 'A short description is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    onSave(slot.slotNumber, { imageDataUrl, fileName, fileSize, metadata: meta });
  };

  const removeImage = () => {
    setImageDataUrl(null);
    setFileName(null);
    setFileSize(null);
    setFileError('');
    onRemoveImage(slot.slotNumber);
  };

  const inputCls = (err?: boolean) => `w-full rounded-md border px-3.5 py-2.5 text-sm bg-white outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10 ${err ? 'border-danger/50' : 'border-border'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={`Edit picture ${slot.slotNumber}`}>
      <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px]" onClick={onClose} />
      <div ref={dialogRef} tabIndex={-1} className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl bg-ivory shadow-2xl border border-border-light animate-fade-in-scale flex flex-col">
        <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-4 border-b border-border-light bg-cream/80">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-bronze font-medium">Picture {String(slot.slotNumber).padStart(2, '0')}</p>
            <h2 className="font-serif text-2xl text-charcoal leading-tight">{slot.suggestedLabel}</h2>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full border border-border bg-white text-muted hover:text-charcoal hover:bg-ivory-deep/40 flex items-center justify-center" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6">
          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Image panel */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <p className="text-sm font-medium text-charcoal mb-2">Photograph <span className="text-danger">*</span></p>
                {!imageDataUrl ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    className={`relative rounded-xl border-2 border-dashed px-5 py-10 text-center transition ${dragOver ? 'border-olive bg-olive-pale/40' : errors.image ? 'border-danger/40 bg-danger-pale/20' : 'border-border bg-white hover:border-olive/40 hover:bg-ivory/40'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-ivory-deep text-muted flex items-center justify-center mx-auto mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-4-4 3-2-1.5L3 17"/></svg>
                    </div>
                    <p className="text-sm text-charcoal font-medium mb-1">Drag and drop a photograph here</p>
                    <p className="text-xs text-muted mb-4">JPG, PNG, or WEBP</p>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center rounded-md bg-olive text-white px-4 py-2 text-sm font-medium hover:bg-olive-light transition">
                      Browse files
                    </button>
                    <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-white overflow-hidden">
                    <div className="bg-[#e9e4db] aspect-[4/3] flex items-center justify-center overflow-hidden">
                      <img src={imageDataUrl} alt={meta.title || `Picture ${slot.slotNumber} preview`} className="w-full h-full object-contain" />
                    </div>
                    <div className="px-4 py-3 border-t border-border-light">
                      <p className="text-sm text-charcoal font-medium truncate" title={fileName || ''}>{fileName || 'Uploaded image'}</p>
                      <p className="text-xs text-muted mt-0.5">{fileSize ? formatFileSize(fileSize) : 'Local preview'}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-white hover:bg-ivory-deep/40 text-charcoal transition">Replace image</button>
                        <button type="button" onClick={removeImage} className="px-3 py-1.5 text-xs font-medium rounded-md border border-danger/20 bg-danger-pale/30 text-danger hover:bg-danger-pale transition">Remove image</button>
                      </div>
                      <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
                    </div>
                  </div>
                )}
                {(fileError || errors.image) && <p className="mt-2 text-xs text-danger">{fileError || errors.image}</p>}
              </div>
              <div className="rounded-lg bg-ivory-deep/40 border border-border-light px-4 py-3 text-xs text-muted leading-relaxed">
                Images are processed locally in your browser for this demonstration. No files are uploaded to a server.
              </div>
            </div>

            {/* Metadata panel */}
            <div className="lg:col-span-3 space-y-5">
              <div>
                <h3 className="font-serif text-xl text-charcoal mb-1">Tell us about this photograph</h3>
                <p className="text-sm text-muted">Share what you know. Unknown details can be left blank or marked as unknown.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor={`title-${slot.id}`} className="block text-sm font-medium text-charcoal mb-1.5">Picture title <span className="text-danger">*</span></label>
                  <input id={`title-${slot.id}`} value={meta.title} onChange={(e) => setField('title', e.target.value)} className={inputCls(!!errors.title)} placeholder="e.g. Family gathering in Enugu, 1974" />
                  {errors.title && <p className="mt-1.5 text-xs text-danger">{errors.title}</p>}
                </div>

                <div>
                  <label htmlFor={`cat-${slot.id}`} className="block text-sm font-medium text-charcoal mb-1.5">Category</label>
                  <select id={`cat-${slot.id}`} value={meta.category} onChange={(e) => setField('category', e.target.value)} className={inputCls(false)}>
                    <option value="">Select category</option>
                    {PICTURE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor={`year-${slot.id}`} className="block text-sm font-medium text-charcoal mb-1.5">Approximate year</label>
                  <input id={`year-${slot.id}`} value={meta.approxYear} onChange={(e) => setField('approxYear', e.target.value)} className={inputCls(false)} placeholder="e.g. 1968" disabled={meta.yearUnknown} />
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <label className="inline-flex items-center gap-2 text-xs text-muted cursor-pointer"><input type="checkbox" checked={meta.yearIsApproximate} onChange={(e) => setField('yearIsApproximate', e.target.checked)} className="accent-[#3D4A3A]" />Approximate</label>
                    <label className="inline-flex items-center gap-2 text-xs text-muted cursor-pointer"><input type="checkbox" checked={meta.yearUnknown} onChange={(e) => { setField('yearUnknown', e.target.checked); if (e.target.checked) setField('approxYear', ''); }} className="accent-[#3D4A3A]" />Year unknown</label>
                  </div>
                </div>

                <div>
                  <label htmlFor={`country-${slot.id}`} className="block text-sm font-medium text-charcoal mb-1.5">Country</label>
                  <input id={`country-${slot.id}`} value={meta.country} onChange={(e) => setField('country', e.target.value)} className={inputCls(false)} placeholder="Country" disabled={meta.locationUnknown} />
                </div>
                <div>
                  <label htmlFor={`state-${slot.id}`} className="block text-sm font-medium text-charcoal mb-1.5">State / region</label>
                  <input id={`state-${slot.id}`} value={meta.stateRegion} onChange={(e) => setField('stateRegion', e.target.value)} className={inputCls(false)} placeholder="State or region" disabled={meta.locationUnknown} />
                </div>
                <div>
                  <label htmlFor={`city-${slot.id}`} className="block text-sm font-medium text-charcoal mb-1.5">City / town</label>
                  <input id={`city-${slot.id}`} value={meta.cityTown} onChange={(e) => setField('cityTown', e.target.value)} className={inputCls(false)} placeholder="City or town" disabled={meta.locationUnknown} />
                </div>
                <div>
                  <label htmlFor={`loc-${slot.id}`} className="block text-sm font-medium text-charcoal mb-1.5">Location details</label>
                  <input id={`loc-${slot.id}`} value={meta.locationDetails} onChange={(e) => setField('locationDetails', e.target.value)} className={inputCls(false)} placeholder="e.g. near the old market square" disabled={meta.locationUnknown} />
                </div>
                <div className="sm:col-span-2 -mt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-muted cursor-pointer"><input type="checkbox" checked={meta.locationUnknown} onChange={(e) => setField('locationUnknown', e.target.checked)} className="accent-[#3D4A3A]" />Location unknown</label>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor={`desc-${slot.id}`} className="block text-sm font-medium text-charcoal mb-1.5">Description <span className="text-danger">*</span></label>
                  <textarea id={`desc-${slot.id}`} value={meta.description} onChange={(e) => setField('description', e.target.value)} className={`${inputCls(!!errors.description)} min-h-[96px] resize-y`} placeholder="What is happening in this photograph?" />
                  {errors.description && <p className="mt-1.5 text-xs text-danger">{errors.description}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor={`ctx-${slot.id}`} className="block text-sm font-medium text-charcoal mb-1.5">Historical context <span className="text-muted font-normal">(optional)</span></label>
                  <textarea id={`ctx-${slot.id}`} value={meta.historicalContext} onChange={(e) => setField('historicalContext', e.target.value)} className={`${inputCls(false)} min-h-[80px] resize-y`} placeholder="Why is this photograph historically meaningful?" />
                </div>

                <div>
                  <label htmlFor={`people-${slot.id}`} className="block text-sm font-medium text-charcoal mb-1.5">People / subjects shown <span className="text-muted font-normal">(optional)</span></label>
                  <input id={`people-${slot.id}`} value={meta.peopleSubjects} onChange={(e) => setField('peopleSubjects', e.target.value)} className={inputCls(false)} placeholder="Names, roles, or descriptions" />
                </div>
                <div>
                  <label htmlFor={`notes-${slot.id}`} className="block text-sm font-medium text-charcoal mb-1.5">Additional notes <span className="text-muted font-normal">(optional)</span></label>
                  <input id={`notes-${slot.id}`} value={meta.additionalNotes} onChange={(e) => setField('additionalNotes', e.target.value)} className={inputCls(false)} placeholder="Any other details" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-7 py-4 border-t border-border-light bg-cream/80 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Cancel</button>
          <button type="button" onClick={save} className="inline-flex items-center justify-center rounded-md bg-olive px-5 py-2.5 text-sm font-medium text-white hover:bg-olive-light transition">Save photograph</button>
        </div>
      </div>
    </div>
  );
}
