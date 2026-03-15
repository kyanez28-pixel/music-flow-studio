import { useState } from 'react';
import { useRhythms } from '@/hooks/use-music-data';
import { generateId } from '@/lib/music-utils';
import { type Rhythm, type RhythmType } from '@/types/music';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const RHYTHM_TYPES: { value: RhythmType; label: string }[] = [
  { value: 'balada', label: 'Balada' },
  { value: 'vals', label: 'Vals 3/4' },
  { value: 'pop', label: 'Pop' },
  { value: 'gospel', label: 'Gospel' },
  { value: 'latino', label: 'Latino' },
  { value: 'otro', label: 'Otro' },
];

export default function RhythmsPage() {
  const [rhythms, setRhythms] = useRhythms();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<RhythmType | 'todos'>('todos');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<RhythmType>('pop');
  const [description, setDescription] = useState('');
  const [bpm, setBpm] = useState(0);
  const [timeSignature, setTimeSignature] = useState('4/4');

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setName(''); setType('pop'); setDescription(''); setBpm(0); setTimeSignature('4/4');
  };

  const openEdit = (r: Rhythm) => {
    setEditingId(r.id); setName(r.name); setType(r.type);
    setDescription(r.description); setBpm(r.bpm);
    setTimeSignature(r.timeSignature); setShowForm(true);
  };

  const save = () => {
    if (!name.trim()) { toast.error('El nombre es requerido'); return; }
    const rhythm: Rhythm = { id: editingId || generateId(), name, type, description, bpm, timeSignature };
    if (editingId) {
      setRhythms(prev => prev.map(r => r.id === editingId ? rhythm : r));
      toast.success('Ritmo actualizado');
    } else {
      setRhythms(prev => [...prev, rhythm]);
      toast.success('Ritmo agregado');
    }
    resetForm();
  };

  const deleteItem = () => {
    setRhythms(prev => prev.filter(r => r.id !== editingId));
    resetForm(); toast.success('Ritmo eliminado');
  };

  const filtered = rhythms.filter(r => filterType === 'todos' || r.type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">🥁 Ritmos</h1>
          <p className="text-sm text-muted-foreground mt-1">Patrones rítmicos y grooves — base de datos personal</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo Ritmo</Button>
      </div>

      <div className="flex gap-2">
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border">
          <option value="todos">Todos los tipos</option>
          {RHYTHM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="stat-card py-12 text-center"><p className="text-muted-foreground">No hay ritmos registrados</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(r => (
            <div key={r.id} onClick={() => openEdit(r)} className="stat-card cursor-pointer hover:border-primary/30">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium">{r.name}</h4>
                <span className="chip text-xs">{RHYTHM_TYPES.find(t => t.value === r.type)?.label}</span>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="font-mono">{r.timeSignature}</span>
                {r.bpm > 0 && <span className="font-mono">{r.bpm} BPM</span>}
              </div>
              {r.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={open => { if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editingId ? 'Editar' : 'Nuevo'} Ritmo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nombre *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Groove Gospel" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Tipo</label>
                <select value={type} onChange={e => setType(e.target.value as RhythmType)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
                  {RHYTHM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Compás</label>
                <Input value={timeSignature} onChange={e => setTimeSignature(e.target.value)} placeholder="4/4" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">BPM</label>
              <Input type="number" value={bpm} onChange={e => setBpm(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Descripción</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
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
