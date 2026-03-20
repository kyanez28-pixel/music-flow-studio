import { useMetronome } from '@/hooks/use-metronome';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Minus, Plus } from 'lucide-react';

const TIME_SIGNATURES = [
  { value: '2', label: '2/4' },
  { value: '3', label: '3/4' },
  { value: '4', label: '4/4' },
  { value: '5', label: '5/4' },
  { value: '6', label: '6/8' },
  { value: '7', label: '7/8' },
];

const BPM_PRESETS = [60, 80, 100, 120, 140, 160, 180, 200];

export default function MetronomePage() {
  const {
    bpm, setBpm,
    beatsPerMeasure, setBeatsPerMeasure,
    currentBeat, isPlaying, toggle,
  } = useMetronome();

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.max(20, Math.min(300, prev + delta)));
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4 flex flex-col items-center gap-8">
      <h1 className="text-2xl font-display font-bold text-foreground">🎵 Metrónomo</h1>

      {/* Beat indicators */}
      <div className="flex gap-3 items-center justify-center">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => (
          <div
            key={i}
            className={`
              w-10 h-10 rounded-full border-2 transition-all duration-100 flex items-center justify-center text-sm font-mono font-bold
              ${isPlaying && currentBeat === i
                ? i === 0
                  ? 'bg-primary border-primary text-primary-foreground scale-125 shadow-lg shadow-primary/30'
                  : 'bg-accent/70 border-accent text-accent-foreground scale-110'
                : 'bg-muted border-border text-muted-foreground'
              }
            `}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* BPM display */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustBpm(-1)}
            className="h-10 w-10 rounded-full"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[120px]">
            <span className="text-6xl font-mono font-bold text-foreground">{bpm}</span>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">BPM</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustBpm(1)}
            className="h-10 w-10 rounded-full"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* BPM slider */}
      <div className="w-full px-2">
        <Slider
          value={[bpm]}
          onValueChange={([v]) => setBpm(v)}
          min={20}
          max={300}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
          <span>20</span>
          <span>300</span>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 justify-center">
        {BPM_PRESETS.map(p => (
          <Button
            key={p}
            variant={bpm === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBpm(p)}
            className="font-mono text-xs min-w-[48px]"
          >
            {p}
          </Button>
        ))}
      </div>

      {/* Time signature */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Compás:</span>
        <Select
          value={String(beatsPerMeasure)}
          onValueChange={(v) => setBeatsPerMeasure(Number(v))}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_SIGNATURES.map(ts => (
              <SelectItem key={ts.value} value={ts.value}>{ts.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Play / Stop */}
      <Button
        onClick={toggle}
        size="lg"
        className={`
          h-20 w-20 rounded-full text-2xl shadow-xl transition-all
          ${isPlaying
            ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/30'
            : 'bg-primary hover:bg-primary/90 shadow-primary/30'
          }
        `}
      >
        {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Usa el metrónomo mientras practicas escalas, melodías o ritmos
      </p>
    </div>
  );
}
