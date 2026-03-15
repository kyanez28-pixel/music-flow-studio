import { useState } from 'react';
import { useHarmonies } from '@/hooks/use-music-data';
import { generateId } from '@/lib/music-utils';
import { type Harmony, type HarmonyType } from '@/types/music';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const HARMONY_TYPES: { value: HarmonyType; label: string }[] = [
  { value: 'progresion', label: 'Progresión' },
  { value: 'acorde', label: 'Acorde' },
  { value: 'voicing', label: 'Voicing' },
  { value: 'cadencia', label: 'Cadencia' },
  { value: 'otro', label: 'Otro' },
];

export default function HarmoniesPage() {
  const [harmonies, setHarmonies] = useHarmonies();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<HarmonyType | 'todos'>('todos');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<HarmonyType>('progresion');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setName(''); setType('progresion'); setDescription(''); setNotes('');
  };

  const openEdit = (h: Harmony) => {
    setEditingId(h.id); setName(h.name); setType(h.type);
    setDescription(h.description); setNotes(h.notes); setShowForm(true);
  };

  const save = () => {
    if (!name.trim()) { toast.error('El nombre es requerido'); return; }
    const harmony: Harmony = { id: editingId || generateId(), name, type, description, notes };
    if (editingId) {
      setHarmonies(prev => prev.map(h => h.id === editingId ? harmony : h));
      toast.success('Armonía actualizada');
    } else {
      setHarmonies(prev => [...prev, harmony]);
      toast.success('Armonía agregada');
    }
    resetForm();
  };

  const deleteItem = () => {
    setHarmonies(prev => prev.filter(h => h.id !== editingId));
    resetForm(); toast.success('Armonía eliminada');
  };

  const filtered = harmonies.filter(h => filterType === 'todos' || h.type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">🎶 Armonías</h1>
          <p className="text-sm text-muted-foreground mt-1">Progresiones, acordes y teoría armónica</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Nueva Armonía</Button>
      </div>

      <div className="flex gap-2">
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border">
          <option value="todos">Todos los tipos</option>
          {HARMONY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="stat-card py-12 text-center"><p className="text-muted-foreground">No hay armonías registradas</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(h => (
            <div key={h.id} onClick={() => openEdit(h)} className="stat-card cursor-pointer hover:border-primary/30">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium">{h.name}</h4>
                <span className="chip text-xs">{HARMONY_TYPES.find(t => t.value === h.type)?.label}</span>
              </div>
              {h.description && <p className="text-xs text-muted-foreground line-clamp-2">{h.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={open => { if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editingId ? 'Editar' : 'Nueva'} Armonía</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nombre *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="II-V-I en Do Mayor" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value as HarmonyType)}
                className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
                {HARMONY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Descripción</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Notas</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
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
