/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { PhotoItem } from '@/types';
import {
  Upload, Download, Trash2, X, Search, Filter,
  ImageIcon, Grid3X3, List, ZoomIn, FolderOpen, Tag,
} from 'lucide-react';

const STORAGE_KEY = 'schiever-photo-bank';

const CATEGORIES = [
  'Wszystkie',
  'Social Media',
  'Produkty',
  'Gazetki',
  'Kampanie',
  'Branding',
  'Eventy',
  'Inne',
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadPhotos(): PhotoItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePhotos(photos: PhotoItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  } catch {
    alert('Brak miejsca w pamięci przeglądarki. Usuń niektóre zdjęcia.');
  }
}

export default function PhotosPanel() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [uploadCategory, setUploadCategory] = useState('Inne');
  const [uploadTags, setUploadTags] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhotos(loadPhotos());
  }, []);

  const processFiles = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const tags = uploadTags.split(',').map(t => t.trim()).filter(Boolean);

    const promises = imageFiles.map(file => {
      return new Promise<PhotoItem>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: generateId(),
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: e.target?.result as string,
            category: uploadCategory,
            uploadedAt: new Date().toISOString(),
            tags,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(newPhotos => {
      const updated = [...newPhotos, ...photos];
      setPhotos(updated);
      savePhotos(updated);
    });
  }, [photos, uploadCategory, uploadTags]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const deletePhoto = (id: string) => {
    const updated = photos.filter(p => p.id !== id);
    setPhotos(updated);
    savePhotos(updated);
    if (selectedPhoto?.id === id) setSelectedPhoto(null);
    selectedIds.delete(id);
    setSelectedIds(new Set(selectedIds));
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    const updated = photos.filter(p => !selectedIds.has(p.id));
    setPhotos(updated);
    savePhotos(updated);
    setSelectedIds(new Set());
    setSelectedPhoto(null);
  };

  const downloadPhoto = (photo: PhotoItem) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = photo.name;
    link.click();
  };

  const downloadSelected = () => {
    const toDownload = photos.filter(p => selectedIds.has(p.id));
    toDownload.forEach((photo, i) => {
      setTimeout(() => downloadPhoto(photo), i * 200);
    });
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const filteredPhotos = photos.filter(p => {
    const matchCategory = selectedCategory === 'Wszystkie' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)) || p.category.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  const categoryCounts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = cat === 'Wszystkie' ? photos.length : photos.filter(p => p.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Bank zdjęć</h2>
          <p className="text-sm text-muted">{photos.length} zdjęć w bibliotece</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted">Zaznaczono: {selectedIds.size}</span>
              <button onClick={downloadSelected} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
                <Download size={14} /> Pobierz
              </button>
              <button onClick={deleteSelected} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
                <Trash2 size={14} /> Usuń
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`bg-white rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragActive ? 'border-primary bg-blue-50' : 'border-border'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            <Upload size={24} className="text-primary" />
          </div>
          <div>
            <p className="font-medium">Przeciągnij zdjęcia tutaj lub <button onClick={() => fileInputRef.current?.click()} className="text-primary hover:underline font-semibold">wybierz pliki</button></p>
            <p className="text-sm text-muted mt-1">PNG, JPG, WEBP, SVG</p>
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted">Kategoria:</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="px-2 py-1 border border-border rounded-lg text-xs"
              >
                {CATEGORIES.filter(c => c !== 'Wszystkie').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted">Tagi:</label>
              <input
                type="text"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="np. logo, baner, promo"
                className="px-2 py-1 border border-border rounded-lg text-xs w-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj po nazwie, tagu lub kategorii..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-muted" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-foreground hover:bg-gray-50'
              }`}
            >
              {cat} {categoryCounts[cat] > 0 && <span className="opacity-70">({categoryCounts[cat]})</span>}
            </button>
          ))}
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button onClick={() => setView('grid')} className={`p-1.5 ${view === 'grid' ? 'bg-primary text-white' : 'bg-white text-muted'}`}>
            <Grid3X3 size={16} />
          </button>
          <button onClick={() => setView('list')} className={`p-1.5 ${view === 'list' ? 'bg-primary text-white' : 'bg-white text-muted'}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filteredPhotos.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <ImageIcon size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-foreground">
            {photos.length === 0 ? 'Brak zdjęć' : 'Brak wyników'}
          </p>
          <p className="text-sm text-muted mt-1">
            {photos.length === 0
              ? 'Wgraj pierwsze zdjęcia, przeciągając je na strefę powyżej.'
              : 'Zmień filtry lub szukane hasło.'}
          </p>
        </div>
      )}

      {/* Grid View */}
      {filteredPhotos.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredPhotos.map(photo => {
            const isSelected = selectedIds.has(photo.id);
            return (
              <div
                key={photo.id}
                className={`group relative bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                }`}
              >
                {/* Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(photo.id)}
                    className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                  />
                </div>

                {/* Image */}
                <div
                  className="aspect-square bg-gray-50 overflow-hidden"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs font-medium truncate" title={photo.name}>{photo.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted">{formatFileSize(photo.size)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-primary rounded">{photo.category}</span>
                  </div>
                </div>

                {/* Hover actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setSelectedPhoto(photo)} className="p-1 bg-white/90 rounded-lg shadow hover:bg-white">
                    <ZoomIn size={14} className="text-foreground" />
                  </button>
                  <button onClick={() => downloadPhoto(photo)} className="p-1 bg-white/90 rounded-lg shadow hover:bg-white">
                    <Download size={14} className="text-accent" />
                  </button>
                  <button onClick={() => deletePhoto(photo.id)} className="p-1 bg-white/90 rounded-lg shadow hover:bg-white">
                    <Trash2 size={14} className="text-danger" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {filteredPhotos.length > 0 && view === 'list' && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="py-2 px-3 text-left w-8">
                  <input
                    type="checkbox"
                    checked={filteredPhotos.length > 0 && filteredPhotos.every(p => selectedIds.has(p.id))}
                    onChange={() => {
                      const allSelected = filteredPhotos.every(p => selectedIds.has(p.id));
                      const next = new Set(selectedIds);
                      filteredPhotos.forEach(p => allSelected ? next.delete(p.id) : next.add(p.id));
                      setSelectedIds(next);
                    }}
                    className="w-4 h-4 rounded"
                  />
                </th>
                <th className="py-2 px-3 text-left text-muted font-medium w-12"></th>
                <th className="py-2 px-3 text-left text-muted font-medium">Nazwa</th>
                <th className="py-2 px-3 text-left text-muted font-medium">Kategoria</th>
                <th className="py-2 px-3 text-left text-muted font-medium">Tagi</th>
                <th className="py-2 px-3 text-right text-muted font-medium">Rozmiar</th>
                <th className="py-2 px-3 text-left text-muted font-medium">Data</th>
                <th className="py-2 px-3 text-center text-muted font-medium">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredPhotos.map(photo => (
                <tr key={photo.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(photo.id)}
                      onChange={() => toggleSelect(photo.id)}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                      <img src={photo.dataUrl} alt={photo.name} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="py-2 px-3 font-medium truncate max-w-[200px]">{photo.name}</td>
                  <td className="py-2 px-3">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-primary rounded">{photo.category}</span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex gap-1 flex-wrap">
                      {photo.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-muted rounded">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right text-muted">{formatFileSize(photo.size)}</td>
                  <td className="py-2 px-3 text-muted text-xs">{new Date(photo.uploadedAt).toLocaleDateString('pl-PL')}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => downloadPhoto(photo)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Pobierz">
                        <Download size={14} className="text-accent" />
                      </button>
                      <button onClick={() => deletePhoto(photo.id)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Usuń">
                        <Trash2 size={14} className="text-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Lightbox header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold truncate">{selectedPhoto.name}</h3>
                <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                  <span className="flex items-center gap-1"><FolderOpen size={12} /> {selectedPhoto.category}</span>
                  <span>{formatFileSize(selectedPhoto.size)}</span>
                  <span>{new Date(selectedPhoto.uploadedAt).toLocaleDateString('pl-PL')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() => downloadPhoto(selectedPhoto)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-light transition-colors"
                >
                  <Download size={14} /> Pobierz
                </button>
                <button
                  onClick={() => { deletePhoto(selectedPhoto.id); setSelectedPhoto(null); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <Trash2 size={14} /> Usuń
                </button>
                <button onClick={() => setSelectedPhoto(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Lightbox image */}
            <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
              <img
                src={selectedPhoto.dataUrl}
                alt={selectedPhoto.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow"
              />
            </div>

            {/* Tags */}
            {selectedPhoto.tags.length > 0 && (
              <div className="px-5 py-3 border-t border-border flex items-center gap-2">
                <Tag size={14} className="text-muted" />
                {selectedPhoto.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-muted rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
