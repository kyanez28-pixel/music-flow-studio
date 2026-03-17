import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSessions } from '@/hooks/use-music-data';
import { getTodayEC, generateId } from '@/lib/music-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, FolderPlus, Trash2, Upload, Image, Check, Save, X, ChevronDown, ChevronRight } from 'lucide-react';

type MelodyStatus = 'aprendiendo' | 'practicando' | 'dominada';
type InstrumentType = 'piano' | 'guitarra' | 'ambos';

interface MelodyFolder {
  id: string;
  name: string;
  color: string | null;
  sort_order: number | null;
}

interface Melody {
  id: string;
  folder_id: string | null;
  name: string;
  instrument: string;
  status: string;
  bpm: number | null;
  key: string | null;
  time_signature: string | null;
  description: string | null;
  progress: number | null;
}

interface MelodyImage {
  id: string;
  melody_id: string;
  storage_path: string;
  file_name: string;
  sort_order: number | null;
}

interface PracticeLog {
  id: string;
  melody_id: string;
  date: string;
  instrument: string;
}

const STATUS_LABELS: Record<MelodyStatus, string> = {
  aprendiendo: '🔄 Aprendiendo',
  practicando: '🎯 Practicando',
  dominada: '✅ Dominada',
};

export default function MelodiesPage() {
  const [sessions, setSessions] = useSessions();
  const [folders, setFolders] = useState<MelodyFolder[]>([]);
  const [melodies, setMelodies] = useState<Melody[]>([]);
  const [images, setImages] = useState<MelodyImage[]>([]);
  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<InstrumentType>('piano');
  const [status, setStatus] = useState<MelodyStatus>('aprendiendo');
  const [bpm, setBpm] = useState(0);
  const [melodyKey, setMelodyKey] = useState('');
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);

  // Folder form
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#d4a843');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  // Image upload
  const [uploadingImages, setUploadingImages] = useState(false);
  const [editImages, setEditImages] = useState<MelodyImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Practice
  const [practiceInstrument, setPracticeInstrument] = useState<'piano' | 'guitarra'>('piano');
  const today = getTodayEC();

  // Collapsed folders
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  // Image viewer
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Filters
  const [filterFolder, setFilterFolder] = useState<string | 'todos'>('todos');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [fRes, mRes, iRes, pRes] = await Promise.all([
      supabase.from('melody_folders').select('*').order('sort_order'),
      supabase.from('melodies').select('*').order('created_at'),
      supabase.from('melody_images').select('*').order('sort_order'),
      supabase.from('melody_practice_logs').select('*').eq('date', today),
    ]);
    if (fRes.data) setFolders(fRes.data);
    if (mRes.data) setMelodies(mRes.data);
    if (iRes.data) setImages(iRes.data);
    if (pRes.data) setPracticeLogs(pRes.data);
    setLoading(false);
  }, [today]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Folder CRUD ───
  const saveFolder = async () => {
    if (!folderName.trim()) { toast.error('Nombre requerido'); return; }
    if (editingFolderId) {
      await supabase.from('melody_folders').update({ name: folderName, color: folderColor }).eq('id', editingFolderId);
      toast.success('Carpeta actualizada');
    } else {
      await supabase.from('melody_folders').insert({ name: folderName, color: folderColor, sort_order: folders.length });
      toast.success('Carpeta creada');
    }
    setShowFolderForm(false);
    setFolderName('');
    setEditingFolderId(null);
    fetchAll();
  };

  const deleteFolder = async (id: string) => {
    await supabase.from('melody_folders').delete().eq('id', id);
    toast.success('Carpeta eliminada');
    fetchAll();
  };

  // ─── Melody CRUD ───
  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setFolderId(null);
    setInstrument('piano');
    setStatus('aprendiendo');
    setBpm(0);
    setMelodyKey('');
    setTimeSignature('4/4');
    setDescription('');
    setProgress(0);
    setEditImages([]);
  };

  const openEdit = (m: Melody) => {
    setEditingId(m.id);
    setName(m.name);
    setFolderId(m.folder_id);
    setInstrument(m.instrument as InstrumentType);
    setStatus(m.status as MelodyStatus);
    setBpm(m.bpm ?? 0);
    setMelodyKey(m.key ?? '');
    setTimeSignature(m.time_signature ?? '4/4');
    setDescription(m.description ?? '');
    setProgress(m.progress ?? 0);
    setEditImages(images.filter(i => i.melody_id === m.id));
    setShowForm(true);
  };

  const saveMelody = async () => {
    if (!name.trim()) { toast.error('Nombre requerido'); return; }
    const data = {
      name, folder_id: folderId, instrument, status, bpm,
      key: melodyKey, time_signature: timeSignature, description, progress,
    };
    if (editingId) {
      await supabase.from('melodies').update(data).eq('id', editingId);
      toast.success('Melodía actualizada');
    } else {
      await supabase.from('melodies').insert(data);
      toast.success('Melodía agregada');
    }
    resetForm();
    fetchAll();
  };

  const deleteMelody = async () => {
    if (!editingId) return;
    // Delete images from storage
    const melodyImages = images.filter(i => i.melody_id === editingId);
    if (melodyImages.length > 0) {
      await supabase.storage.from('melody-images').remove(melodyImages.map(i => i.storage_path));
    }
    await supabase.from('melodies').delete().eq('id', editingId);
    toast.success('Melodía eliminada');
    resetForm();
    fetchAll();
  };

  // ─── Image Upload ───
  const uploadFile = async (file: File, melodyId: string) => {
    const ext = file.name.split('.').pop() || 'png';
    const path = `${melodyId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('melody-images').upload(path, file);
    if (error) { toast.error(`Error subiendo ${file.name}`); return null; }
    const { error: dbErr } = await supabase.from('melody_images').insert({
      melody_id: melodyId,
      storage_path: path,
      file_name: file.name,
      sort_order: editImages.length,
    });
    if (dbErr) { toast.error('Error guardando referencia'); return null; }
    return path;
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!editingId) { toast.error('Guarda la melodía primero antes de subir imágenes'); return; }
    setUploadingImages(true);
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      await uploadFile(file, editingId);
    }
    setUploadingImages(false);
    toast.success(`${fileArray.length} imagen(es) subida(s)`);
    fetchAll();
  };

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (!showForm || !editingId) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      await handleFileUpload(imageFiles);
    }
  }, [showForm, editingId]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const deleteImage = async (img: MelodyImage) => {
    await supabase.storage.from('melody-images').remove([img.storage_path]);
    await supabase.from('melody_images').delete().eq('id', img.id);
    toast.success('Imagen eliminada');
    fetchAll();
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('melody-images').getPublicUrl(path);
    return data.publicUrl;
  };

  // ─── Practice Check ───
  const isCheckedToday = (melodyId: string) =>
    practiceLogs.some(l => l.melody_id === melodyId && l.instrument === practiceInstrument);

  const togglePractice = async (melodyId: string) => {
    const existing = practiceLogs.find(l => l.melody_id === melodyId && l.instrument === practiceInstrument);
    if (existing) {
      await supabase.from('melody_practice_logs').delete().eq('id', existing.id);
      setPracticeLogs(prev => prev.filter(l => l.id !== existing.id));
    } else {
      const { data } = await supabase.from('melody_practice_logs').insert({
        melody_id: melodyId, date: today, instrument: practiceInstrument,
      }).select().single();
      if (data) setPracticeLogs(prev => [...prev, data]);
    }
  };

  const saveSession = () => {
    const checkedToday = practiceLogs.filter(l => l.instrument === practiceInstrument);
    if (checkedToday.length === 0) { toast.error('Marca al menos una melodía'); return; }
    const melodyNames = checkedToday
      .map(l => melodies.find(m => m.id === l.melody_id)?.name)
      .filter(Boolean)
      .join(', ');
    const notesText = `Melodías (${checkedToday.length}): ${melodyNames}`;
    const duration = checkedToday.length * 5;
    const existingIdx = sessions.findIndex(
      s => s.date === today && s.instrument === practiceInstrument && s.categories.includes('melodias')
    );
    if (existingIdx >= 0) {
      setSessions(prev => prev.map((s, i) => i === existingIdx
        ? { ...s, durationMinutes: duration, notes: notesText }
        : s
      ));
    } else {
      setSessions(prev => [...prev, {
        id: generateId(), date: today, instrument: practiceInstrument,
        durationMinutes: duration, categories: ['melodias'],
        notes: notesText, rating: 3, goal: '',
      }]);
    }
    toast.success('Sesión de melodías guardada en historial');
  };

  const toggleFolder = (id: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Group melodies by folder
  const unfoldered = melodies.filter(m => !m.folder_id);
  const grouped = folders.map(f => ({
    folder: f,
    items: melodies.filter(m => m.folder_id === f.id),
  }));

  const visibleGroups = filterFolder === 'todos'
    ? grouped
    : grouped.filter(g => g.folder.id === filterFolder);
  const showUnfoldered = filterFolder === 'todos';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">🎵 Melodías</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {melodies.length} melodías · {folders.length} carpetas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowFolderForm(true); setEditingFolderId(null); setFolderName(''); }}>
            <FolderPlus className="h-4 w-4 mr-1" /> Carpeta
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Melodía
          </Button>
        </div>
      </div>

      {/* Practice controls */}
      <div className="stat-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Practicar como:</span>
            <div className="flex gap-1">
              {(['piano', 'guitarra'] as const).map(i => (
                <button key={i} onClick={() => setPracticeInstrument(i)}
                  className={`chip text-xs ${practiceInstrument === i ? 'chip-active' : ''}`}>
                  {i === 'piano' ? '🎹' : '🎸'} {i}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {practiceLogs.filter(l => l.instrument === practiceInstrument).length} marcadas hoy
            </span>
            <Button size="sm" onClick={saveSession}>
              <Save className="h-4 w-4 mr-1" /> Guardar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Filter */}
      {folders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterFolder('todos')}
            className={`chip text-xs ${filterFolder === 'todos' ? 'chip-active' : ''}`}>
            Todas
          </button>
          {folders.map(f => (
            <button key={f.id} onClick={() => setFilterFolder(f.id)}
              className={`chip text-xs ${filterFolder === f.id ? 'chip-active' : ''}`}
              style={filterFolder === f.id ? {} : { borderLeft: `3px solid ${f.color}` }}>
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Melody list by folder */}
      {visibleGroups.map(({ folder, items }) => (
        <div key={folder.id} className="space-y-2">
          <button onClick={() => toggleFolder(folder.id)}
            className="flex items-center gap-2 group w-full text-left">
            {collapsedFolders.has(folder.id)
              ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color ?? '#d4a843' }} />
            <span className="section-title text-base">{folder.name}</span>
            <span className="text-xs text-muted-foreground">({items.length})</span>
            <button onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setFolderName(folder.name); setFolderColor(folder.color ?? '#d4a843'); setShowFolderForm(true); }}
              className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground">
              editar
            </button>
          </button>
          {!collapsedFolders.has(folder.id) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-6">
              {items.map(m => (
                <MelodyCard key={m.id} melody={m} images={images} isChecked={isCheckedToday(m.id)}
                  onToggle={() => togglePractice(m.id)} onEdit={() => openEdit(m)} getImageUrl={getImageUrl} />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Unfoldered */}
      {showUnfoldered && unfoldered.length > 0 && (
        <div className="space-y-2">
          <p className="section-title text-base text-muted-foreground">Sin carpeta</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unfoldered.map(m => (
              <MelodyCard key={m.id} melody={m} images={images} isChecked={isCheckedToday(m.id)}
                onToggle={() => togglePractice(m.id)} onEdit={() => openEdit(m)} getImageUrl={getImageUrl} />
            ))}
          </div>
        </div>
      )}

      {melodies.length === 0 && (
        <div className="stat-card py-12 text-center">
          <p className="text-muted-foreground">No hay melodías. Crea una carpeta y agrega tu primera melodía.</p>
        </div>
      )}

      {/* ─── Melody Form Dialog ─── */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? 'Editar' : 'Nueva'} Melodía</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Nombre *</label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Carpeta</label>
                <select value={folderId ?? ''} onChange={e => setFolderId(e.target.value || null)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-2 py-2 text-sm border border-border">
                  <option value="">Sin carpeta</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Instrumento</label>
                <div className="flex gap-1">
                  {(['piano', 'guitarra', 'ambos'] as const).map(i => (
                    <button key={i} onClick={() => setInstrument(i)}
                      className={`chip flex-1 justify-center text-xs ${instrument === i ? 'chip-active' : ''}`}>
                      {i === 'piano' ? '🎹' : i === 'guitarra' ? '🎸' : '🎼'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Estado</label>
                <select value={status} onChange={e => setStatus(e.target.value as MelodyStatus)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-2 py-2 text-sm border border-border">
                  {(Object.keys(STATUS_LABELS) as MelodyStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">BPM</label>
                <Input type="number" value={bpm} onChange={e => setBpm(parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tonalidad</label>
                <Input value={melodyKey} onChange={e => setMelodyKey(e.target.value)} placeholder="Dm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Compás</label>
                <Input value={timeSignature} onChange={e => setTimeSignature(e.target.value)} placeholder="4/4" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Descripción</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Progreso — {progress}%</label>
              <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(parseInt(e.target.value))}
                className="w-full accent-primary" />
            </div>

            {/* Images section */}
            {editingId && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Image className="h-3 w-3" /> Imágenes (pega con Ctrl+V o sube archivos)
                </label>
                <div
                  ref={dropZoneRef}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
                  onDragLeave={e => e.currentTarget.classList.remove('border-primary')}
                  onDrop={async e => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-primary');
                    if (e.dataTransfer.files.length) await handleFileUpload(e.dataTransfer.files);
                  }}
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center transition-colors cursor-pointer hover:border-muted-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImages ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      <span className="text-sm text-muted-foreground">Subiendo...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Arrastra, haz clic, o pega (Ctrl+V)
                      </span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => { if (e.target.files) handleFileUpload(e.target.files); e.target.value = ''; }} />

                {/* Image preview grid */}
                {images.filter(i => i.melody_id === editingId).length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.filter(i => i.melody_id === editingId).map(img => (
                      <div key={img.id} className="relative group rounded-md overflow-hidden border border-border">
                        <img src={getImageUrl(img.storage_path)} alt={img.file_name}
                          className="w-full h-24 object-cover cursor-pointer"
                          onClick={() => setViewingImage(getImageUrl(img.storage_path))} />
                        <button onClick={() => deleteImage(img)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-[10px] text-muted-foreground truncate p-1">{img.file_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!editingId && (
              <p className="text-xs text-muted-foreground italic">💡 Guarda la melodía primero, luego podrás subir imágenes editándola.</p>
            )}

            <div className="flex justify-between pt-2 border-t border-border">
              {editingId ? <Button variant="destructive" size="sm" onClick={deleteMelody}><Trash2 className="h-3 w-3 mr-1" /> Eliminar</Button> : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
                <Button size="sm" onClick={saveMelody}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Folder Form Dialog ─── */}
      <Dialog open={showFolderForm} onOpenChange={open => { if (!open) { setShowFolderForm(false); setEditingFolderId(null); } }}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{editingFolderId ? 'Editar' : 'Nueva'} Carpeta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nombre</label>
              <Input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Ej: Worship, Himnos..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Color</label>
              <div className="flex gap-2 items-center mt-1">
                <input type="color" value={folderColor} onChange={e => setFolderColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-none" />
                <span className="text-xs text-muted-foreground font-mono">{folderColor}</span>
              </div>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              {editingFolderId ? (
                <Button variant="destructive" size="sm" onClick={() => { deleteFolder(editingFolderId); setShowFolderForm(false); setEditingFolderId(null); }}>
                  <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                </Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowFolderForm(false); setEditingFolderId(null); }}>Cancelar</Button>
                <Button size="sm" onClick={saveFolder}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Image Viewer ─── */}
      <Dialog open={!!viewingImage} onOpenChange={open => { if (!open) setViewingImage(null); }}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] p-2">
          {viewingImage && (
            <img src={viewingImage} alt="Melody" className="w-full h-auto max-h-[85vh] object-contain rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Melody Card Component ───
function MelodyCard({ melody, images, isChecked, onToggle, onEdit, getImageUrl }: {
  melody: Melody;
  images: MelodyImage[];
  isChecked: boolean;
  onToggle: () => void;
  onEdit: () => void;
  getImageUrl: (path: string) => string;
}) {
  const melodyImages = images.filter(i => i.melody_id === melody.id);
  const firstImage = melodyImages[0];

  return (
    <div className="stat-card overflow-hidden">
      {/* Image preview */}
      {firstImage && (
        <div className="relative -mx-4 -mt-4 mb-3">
          <img src={getImageUrl(firstImage.storage_path)} alt={melody.name}
            className="w-full h-32 object-cover" />
          {melodyImages.length > 1 && (
            <span className="absolute bottom-2 right-2 bg-background/80 text-foreground text-[10px] px-1.5 py-0.5 rounded-full">
              +{melodyImages.length - 1}
            </span>
          )}
        </div>
      )}
      <div className="flex items-start gap-3">
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            isChecked ? 'bg-primary border-primary' : 'border-muted-foreground/40 hover:border-primary'
          }`}>
          {isChecked && <Check className="h-3 w-3 text-primary-foreground" />}
        </button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm truncate">{melody.name}</h4>
            <span className="text-[10px] shrink-0 ml-2">
              {STATUS_LABELS[melody.status as MelodyStatus]}
            </span>
          </div>
          {(melody.progress ?? 0) > 0 && (
            <div className="h-1 bg-secondary rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-primary rounded-full" style={{ width: `${melody.progress}%` }} />
            </div>
          )}
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>
              {melody.instrument === 'piano' ? '🎹' : melody.instrument === 'guitarra' ? '🎸' : '🎼'}
              {melody.key && ` · ${melody.key}`}
            </span>
            {(melody.bpm ?? 0) > 0 && <span className="font-mono">{melody.bpm} BPM</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
