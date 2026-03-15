import { useState } from 'react';
import { useMelodies } from '@/hooks/use-music-data';
import { generateId } from '@/lib/music-utils';
import { type Melody, type MelodyStatus } from '@/types/music';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const STATUS_LABELS: Record<MelodyStatus, string> = {
  aprendiendo: '🔄 Aprendiendo',
  practicando: '🎯 Practicando',
  dominada: '✅ Dominada',
};

export default function MelodiesPage() {
  const [melodies, setMelodies] = useMelodies();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<MelodyStatus | 'todos'>('todos');
  const [filterInst, setFilterInst] = useState<'piano' | 'guitarra' | 'ambos' | 'todos'>('todos');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState<'piano' | 'guitarra' | 'ambos'>('piano');
  const [status, setStatus] = useState<MelodyStatus>('aprendiendo');
  const [bpm, setBpm] = useState(0);
  const [key, setKey] = useState('');
  const [timeSignature, setTimeSignature] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setName(''); setInstrument('piano'); setStatus('aprendiendo');
    setBpm(0); setKey(''); setTimeSignature(''); setDescription(''); setProgress(0);
  };

  const openEdit = (m: Melody) => {
    setEditingId(m.id); setName(m.name); setInstrument(m.instrument);
    setStatus(m.status); setBpm(m.bpm); setKey(m.key);
    setTimeSignature(m.timeSignature); setDescription(m.description);
    setProgress(m.progress); setShowForm(true);
  };

  const save = () => {
    if (!name.trim()) { toast.error('El nombre es requerido'); return; }
    const melody: Melody = {
      id: editingId || generateId(), name, instrument, status, bpm, key,
      timeSignature, description, progress, files: [],
    };
    if (editingId) {
      setMelodies(prev => prev.map(m => m.id === editingId ? { ...melody, files: m.files } : m));
      toast.success('Melodía actualizada');
    } else {
      setMelodies(prev => [...prev, melody]);
      toast.success('Melodía agregada');
    }
    resetForm();
  };

  const deleteItem = () => {
    setMelodies(prev => prev.filter(m => m.id !== editingId));
    resetForm(); toast.success('Melodía eliminada');
  };

  const filtered = melodies
    .filter(m => filterStatus === 'todos' || m.status === filterStatus)
    .filter(m => filterInst === 'todos' || m.instrument === filterInst || m.instrument === 'ambos');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">🎵 Melodías</h1>
          <p className="text-sm text-muted-foreground mt-1">Tu colección de melodías — base de datos personal</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Nueva Melodía</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border">
          <option value="todos">Todos los estados</option>
          {(Object.keys(STATUS_LABELS) as MelodyStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={filterInst} onChange={e => setFilterInst(e.target.value as any)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border">
          <option value="todos">Ambos instrumentos</option>
          <option value="piano">Piano</option>
          <option value="guitarra">Guitarra</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="stat-card py-12 text-center"><p className="text-muted-foreground">No hay melodías registradas</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(m => (
            <div key={m.id} onClick={() => openEdit(m)} className="stat-card cursor-pointer hover:border-primary/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{m.name}</h4>
                <span className="text-xs">{STATUS_LABELS[m.status]}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary rounded-full" style={{ width: `${m.progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{m.instrument === 'piano' ? '🎹' : m.instrument === 'guitarra' ? '🎸' : '🎼'} {m.key && `· ${m.key}`}</span>
                {m.bpm > 0 && <span className="font-mono">{m.bpm} BPM</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={open => { if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editingId ? 'Editar' : 'Nueva'} Melodía</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Nombre *</label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Instrumento</label>
                <div className="flex gap-1">
                  {(['piano', 'guitarra', 'ambos'] as const).map(i => (
                    <button key={i} onClick={() => setInstrument(i)}
                      className={`chip flex-1 justify-center text-xs ${instrument === i ? 'chip-active' : ''}`}>
                      {i === 'piano' ? '🎹' : i === 'guitarra' ? '🎸' : '🎼'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Estado</label>
                <select value={status} onChange={e => setStatus(e.target.value as MelodyStatus)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-2 py-2 text-sm border border-border">
                  {(Object.keys(STATUS_LABELS) as MelodyStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">BPM</label>
                <Input type="number" value={bpm} onChange={e => setBpm(parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tonalidad</label>
                <Input value={key} onChange={e => setKey(e.target.value)} placeholder="Dm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Compás / Tipo</label>
              <Input value={timeSignature} onChange={e => setTimeSignature(e.target.value)} placeholder="4/4" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Descripción / Notas</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Progreso — {progress}%</label>
              <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(parseInt(e.target.value))}
                className="w-full accent-primary" />
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              {editingId ? <Button variant="destructive" size="sm" onClick={deleteItem}>🗑 Eliminar</Button> : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
                <Button size="sm" onClick={save}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
