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

type RhythmStatus = 'aprendiendo' | 'practicando' | 'dominada';
type InstrumentType = 'piano' | 'guitarra' | 'ambos';

interface RhythmFolder {
  id: string;
  name: string;
  color: string | null;
  sort_order: number | null;
}

interface Rhythm {
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

interface RhythmImage {
  id: string;
  rhythm_id: string;
  storage_path: string;
  file_name: string;
  sort_order: number | null;
}

interface PracticeLog {
  id: string;
  rhythm_id: string;
  date: string;
  instrument: string;
}

const STATUS_LABELS: Record<RhythmStatus, string> = {
  aprendiendo: '🔄 Aprendiendo',
  practicando: '🎯 Practicando',
  dominada: '✅ Dominado',
};

export default function RhythmsPage() {
  const [sessions, setSessions] = useSessions();
  const [folders, setFolders] = useState<RhythmFolder[]>([]);
  const [rhythms, setRhythms] = useState<Rhythm[]>([]);
  const [images, setImages] = useState<RhythmImage[]>([]);
  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<InstrumentType>('piano');
  const [status, setStatus] = useState<RhythmStatus>('aprendiendo');
  const [bpm, setBpm] = useState(0);
  const [rhythmKey, setRhythmKey] = useState('');
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
  const [editImages, setEditImages] = useState<RhythmImage[]>([]);
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
    const [fRes, rRes, iRes, pRes] = await Promise.all([
      supabase.from('rhythm_folders').select('*').order('sort_order'),
      supabase.from('rhythms').select('*').order('created_at'),
      supabase.from('rhythm_images').select('*').order('sort_order'),
      supabase.from('rhythm_practice_logs').select('*').eq('date', today),
    ]);
    if (fRes.data) setFolders(fRes.data);
    if (rRes.data) setRhythms(rRes.data);
    if (iRes.data) setImages(iRes.data);
    if (pRes.data) setPracticeLogs(pRes.data);
    setLoading(false);
  }, [today]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Folder CRUD ───
  const saveFolder = async () => {
    if (!folderName.trim()) { toast.error('Nombre requerido'); return; }
    if (editingFolderId) {
      await supabase.from('rhythm_folders').update({ name: folderName, color: folderColor }).eq('id', editingFolderId);
      toast.success('Carpeta actualizada');
    } else {
      await supabase.from('rhythm_folders').insert({ name: folderName, color: folderColor, sort_order: folders.length });
      toast.success('Carpeta creada');
    }
    setShowFolderForm(false);
    setFolderName('');
    setEditingFolderId(null);
    fetchAll();
  };

  const deleteFolder = async (id: string) => {
    await supabase.from('rhythm_folders').delete().eq('id', id);
    toast.success('Carpeta eliminada');
    fetchAll();
  };

  // ─── Rhythm CRUD ───
  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setFolderId(null);
    setInstrument('piano');
    setStatus('aprendiendo');
    setBpm(0);
    setRhythmKey('');
    setTimeSignature('4/4');
    setDescription('');
    setProgress(0);
    setEditImages([]);
  };

  const openEdit = (r: Rhythm) => {
    setEditingId(r.id);
    setName(r.name);
    setFolderId(r.folder_id);
    setInstrument(r.instrument as InstrumentType);
    setStatus(r.status as RhythmStatus);
    setBpm(r.bpm ?? 0);
    setRhythmKey(r.key ?? '');
    setTimeSignature(r.time_signature ?? '4/4');
    setDescription(r.description ?? '');
    setProgress(r.progress ?? 0);
    setEditImages(images.filter(i => i.rhythm_id === r.id));
    setShowForm(true);
  };

  const saveRhythm = async () => {
    if (!name.trim()) { toast.error('Nombre requerido'); return; }
    const data = {
      name, folder_id: folderId, instrument, status, bpm,
      key: rhythmKey, time_signature: timeSignature, description, progress,
    };
    if (editingId) {
      await supabase.from('rhythms').update(data).eq('id', editingId);
      toast.success('Ritmo actualizado');
    } else {
      await supabase.from('rhythms').insert(data);
      toast.success('Ritmo agregado');
    }
    resetForm();
    fetchAll();
  };

  const deleteRhythm = async () => {
    if (!editingId) return;
    const rhythmImages = images.filter(i => i.rhythm_id === editingId);
    if (rhythmImages.length > 0) {
      await supabase.storage.from('rhythm-images').remove(rhythmImages.map(i => i.storage_path));
    }
    await supabase.from('rhythms').delete().eq('id', editingId);
    toast.success('Ritmo eliminado');
    resetForm();
    fetchAll();
  };

  // ─── Image Upload ───
  const uploadFile = async (file: File, rhythmId: string) => {
    const ext = file.name.split('.').pop() || 'png';
    const path = `${rhythmId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('rhythm-images').upload(path, file);
    if (error) { toast.error(`Error subiendo ${file.name}`); return null; }
    const { error: dbErr } = await supabase.from('rhythm_images').insert({
      rhythm_id: rhythmId,
      storage_path: path,
      file_name: file.name,
      sort_order: editImages.length,
    });
    if (dbErr) { toast.error('Error guardando referencia'); return null; }
    return path;
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!editingId) { toast.error('Guarda el ritmo primero antes de subir imágenes'); return; }
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

  const deleteImage = async (img: RhythmImage) => {
    await supabase.storage.from('rhythm-images').remove([img.storage_path]);
    await supabase.from('rhythm_images').delete().eq('id', img.id);
    toast.success('Imagen eliminada');
    fetchAll();
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('rhythm-images').getPublicUrl(path);
    return data.publicUrl;
  };

  // ─── Practice Check ───
  const isCheckedToday = (rhythmId: string) =>
    practiceLogs.some(l => l.rhythm_id === rhythmId && l.instrument === practiceInstrument);

  const togglePractice = async (rhythmId: string) => {
    const existing = practiceLogs.find(l => l.rhythm_id === rhythmId && l.instrument === practiceInstrument);
    if (existing) {
      await supabase.from('rhythm_practice_logs').delete().eq('id', existing.id);
      setPracticeLogs(prev => prev.filter(l => l.id !== existing.id));
    } else {
      const { data } = await supabase.from('rhythm_practice_logs').insert({
        rhythm_id: rhythmId, date: today, instrument: practiceInstrument,
      }).select().single();
      if (data) setPracticeLogs(prev => [...prev, data]);
    }
  };

  const saveSession = () => {
    const checkedToday = practiceLogs.filter(l => l.instrument === practiceInstrument);
    if (checkedToday.length === 0) { toast.error('Marca al menos un ritmo'); return; }
    const rhythmNames = checkedToday
      .map(l => rhythms.find(r => r.id === l.rhythm_id)?.name)
      .filter(Boolean)
      .join(', ');
    const notesText = `Ritmos (${checkedToday.length}): ${rhythmNames}`;
    const duration = checkedToday.length * 5;
    const existingIdx = sessions.findIndex(
      s => s.date === today && s.instrument === practiceInstrument && s.categories.includes('ritmos')
    );
    if (existingIdx >= 0) {
      setSessions(prev => prev.map((s, i) => i === existingIdx
        ? { ...s, durationMinutes: duration, notes: notesText }
        : s
      ));
    } else {
      setSessions(prev => [...prev, {
        id: generateId(), date: today, instrument: practiceInstrument,
        durationMinutes: duration, categories: ['ritmos'],
        notes: notesText, rating: 3, goal: '',
      }]);
    }
    toast.success('Sesión de ritmos guardada en historial');
  };

  const toggleFolder = (id: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Group rhythms by folder
  const unfoldered = rhythms.filter(r => !r.folder_id);
  const grouped = folders.map(f => ({
    folder: f,
    items: rhythms.filter(r => r.folder_id === f.id),
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
          <h1 className="page-title">🥁 Ritmos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rhythms.length} ritmos · {folders.length} carpetas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowFolderForm(true); setEditingFolderId(null); setFolderName(''); }}>
            <FolderPlus className="h-4 w-4 mr-1" /> Carpeta
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Ritmo
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
              {practiceLogs.filter(l => l.instrument === practiceInstrument).length} marcados hoy
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
            Todos
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

      {/* Rhythm list by folder */}
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
              {items.map(r => (
                <RhythmCard key={r.id} rhythm={r} images={images} isChecked={isCheckedToday(r.id)}
                  onToggle={() => togglePractice(r.id)} onEdit={() => openEdit(r)} getImageUrl={getImageUrl} />
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
            {unfoldered.map(r => (
              <RhythmCard key={r.id} rhythm={r} images={images} isChecked={isCheckedToday(r.id)}
                onToggle={() => togglePractice(r.id)} onEdit={() => openEdit(r)} getImageUrl={getImageUrl} />
            ))}
          </div>
        </div>
      )}

      {rhythms.length === 0 && (
        <div className="stat-card py-12 text-center">
          <p className="text-muted-foreground">No hay ritmos. Crea una carpeta y agrega tu primer ritmo.</p>
        </div>
      )}

      {/* ─── Rhythm Form Dialog ─── */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? 'Editar' : 'Nuevo'} Ritmo</DialogTitle>
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
                <select value={status} onChange={e => setStatus(e.target.value as RhythmStatus)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-2 py-2 text-sm border border-border">
                  {(Object.keys(STATUS_LABELS) as RhythmStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
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
                <Input value={rhythmKey} onChange={e => setRhythmKey(e.target.value)} placeholder="Dm" />
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
                {images.filter(i => i.rhythm_id === editingId).length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.filter(i => i.rhythm_id === editingId).map(img => (
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
              <p className="text-xs text-muted-foreground italic">💡 Guarda el ritmo primero, luego podrás subir imágenes editándolo.</p>
            )}

            <div className="flex justify-between pt-2 border-t border-border">
              {editingId ? <Button variant="destructive" size="sm" onClick={deleteRhythm}><Trash2 className="h-3 w-3 mr-1" /> Eliminar</Button> : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
                <Button size="sm" onClick={saveRhythm}>Guardar</Button>
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
              <Input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Ej: Grooves, Fills..." />
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
            <img src={viewingImage} alt="Rhythm" className="w-full h-auto max-h-[85vh] object-contain rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Rhythm Card Component ───
function RhythmCard({ rhythm, images, isChecked, onToggle, onEdit, getImageUrl }: {
  rhythm: Rhythm;
  images: RhythmImage[];
  isChecked: boolean;
  onToggle: () => void;
  onEdit: () => void;
  getImageUrl: (path: string) => string;
}) {
  const rhythmImages = images.filter(i => i.rhythm_id === rhythm.id);
  const firstImage = rhythmImages[0];

  return (
    <div className="stat-card overflow-hidden">
      {firstImage && (
        <div className="relative -mx-4 -mt-4 mb-3">
          <img src={getImageUrl(firstImage.storage_path)} alt={rhythm.name}
            className="w-full h-32 object-cover" />
          {rhythmImages.length > 1 && (
            <span className="absolute bottom-2 right-2 bg-background/80 text-foreground text-[10px] px-1.5 py-0.5 rounded-full">
              +{rhythmImages.length - 1}
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
            <h4 className="font-medium text-sm truncate">{rhythm.name}</h4>
            <span className="text-[10px] shrink-0 ml-2">
              {STATUS_LABELS[rhythm.status as RhythmStatus]}
            </span>
          </div>
          {(rhythm.progress ?? 0) > 0 && (
            <div className="h-1 bg-secondary rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-primary rounded-full" style={{ width: `${rhythm.progress}%` }} />
            </div>
          )}
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>
              {rhythm.instrument === 'piano' ? '🎹' : rhythm.instrument === 'guitarra' ? '🎸' : '🎼'}
              {rhythm.key && ` · ${rhythm.key}`}
              {rhythm.time_signature && ` · ${rhythm.time_signature}`}
            </span>
            {(rhythm.bpm ?? 0) > 0 && <span className="font-mono">{rhythm.bpm} BPM</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
