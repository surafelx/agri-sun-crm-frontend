import { useRef, useState } from 'react';
import { Camera, Paperclip, X, FileText, Download, Loader2 } from 'lucide-react';
import { uploads } from '../lib/api';

export type Attachment = {
  name:       string;
  url:        string;
  publicId:   string;
  mimeType:   string;
  size:       number;
  uploadedAt?: string;
};

type Props = {
  value:    Attachment[];
  onChange: (items: Attachment[]) => void;
  folder?:  string;   // e.g. "installations" or "customers"
  label?:   string;
};

function isImage(mime: string) {
  return mime.startsWith('image/');
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Attachments({ value, onChange, folder = 'misc', label = 'Attachments' }: Props) {
  const fileRef   = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [preview, setPreview]     = useState<Attachment | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    const results: Attachment[] = [];
    for (const file of Array.from(files)) {
      try {
        const res = await uploads.upload(file, folder);
        results.push({
          name:     res.data.name,
          url:      res.data.url,
          publicId: res.data.publicId,
          mimeType: res.data.mimeType,
          size:     res.data.size,
        });
      } catch {
        setError(`Failed to upload ${file.name}`);
      }
    }
    if (results.length) onChange([...value, ...results]);
    setUploading(false);
  };

  const remove = async (idx: number) => {
    const item = value[idx];
    try {
      await uploads.delete(item.publicId);
    } catch { /* ignore — Cloudinary might 404 if already gone */ }
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>

      {/* Upload buttons */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-card border border-surface-border text-gray-300 hover:text-white hover:border-primary/50 transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-3.5 h-3.5" />
          Attach file
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-card border border-surface-border text-gray-300 hover:text-white hover:border-primary/50 transition-colors disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5" />
          Scan / Photo
        </button>
        {uploading && <Loader2 className="w-4 h-4 text-primary animate-spin self-center" />}
      </div>

      {/* Hidden inputs */}
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
      />
      <input
        ref={cameraRef}
        type="file"
        multiple
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
      />

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      {/* Attachment grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {value.map((att, idx) => (
            <div
              key={idx}
              className="relative group bg-surface-card border border-surface-border rounded-lg overflow-hidden"
            >
              {/* Thumbnail or doc icon */}
              {isImage(att.mimeType) ? (
                <button
                  type="button"
                  onClick={() => setPreview(att)}
                  className="w-full aspect-video bg-black/30 flex items-center justify-center overflow-hidden"
                >
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ) : (
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full aspect-video bg-black/30 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-primary transition-colors"
                >
                  <FileText className="w-7 h-7" />
                  <span className="text-[10px] uppercase tracking-wider">
                    {att.mimeType.split('/')[1]?.split('.').pop()?.toUpperCase() || 'FILE'}
                  </span>
                </a>
              )}

              {/* Footer */}
              <div className="px-2 py-1 flex items-center justify-between gap-1">
                <p className="text-[10px] text-gray-400 truncate flex-1" title={att.name}>{att.name}</p>
                <span className="text-[9px] text-gray-600 shrink-0">{fmtSize(att.size)}</span>
              </div>

              {/* Hover actions */}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isImage(att.mimeType) && (
                  <a
                    href={att.url}
                    download={att.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 bg-black/60 rounded text-white hover:text-primary"
                    title="Download"
                  >
                    <Download className="w-3 h-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="p-1 bg-black/60 rounded text-white hover:text-red-400"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox preview */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={preview.url} alt={preview.name} className="w-full max-h-[80vh] object-contain rounded-lg" />
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-sm text-gray-300 truncate">{preview.name}</p>
              <div className="flex gap-2 shrink-0">
                <a
                  href={preview.url}
                  download={preview.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-surface-card border border-surface-border rounded-lg text-gray-300 hover:text-primary"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreview(null)}
                  className="p-1.5 bg-surface-card border border-surface-border rounded-lg text-gray-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact read-only viewer used in list cards (shows thumbnail strip + count)
export function AttachmentStrip({ items }: { items: Attachment[] }) {
  const [preview, setPreview] = useState<Attachment | null>(null);
  if (!items?.length) return null;
  const images = items.filter((a) => isImage(a.mimeType));
  const docs   = items.filter((a) => !isImage(a.mimeType));

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {images.slice(0, 4).map((a, i) => (
        <button
          key={i}
          onClick={() => setPreview(a)}
          className="w-10 h-10 rounded overflow-hidden border border-surface-border flex-shrink-0"
        >
          <img src={a.url} alt={a.name} className="w-full h-full object-cover" loading="lazy" />
        </button>
      ))}
      {images.length > 4 && (
        <span className="text-[10px] text-gray-500 bg-surface-card border border-surface-border rounded px-1.5 py-0.5">
          +{images.length - 4}
        </span>
      )}
      {docs.map((d, i) => (
        <a
          key={i}
          href={d.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-primary bg-surface-card border border-surface-border rounded px-1.5 py-0.5"
        >
          <FileText className="w-3 h-3" />
          {d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name}
        </a>
      ))}

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={preview.url} alt={preview.name} className="w-full max-h-[80vh] object-contain rounded-lg" />
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-sm text-gray-300 truncate">{preview.name}</p>
              <div className="flex gap-2">
                <a href={preview.url} download={preview.name} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 bg-surface-card border border-surface-border rounded-lg text-gray-300 hover:text-primary">
                  <Download className="w-4 h-4" />
                </a>
                <button onClick={() => setPreview(null)}
                  className="p-1.5 bg-surface-card border border-surface-border rounded-lg text-gray-300 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
