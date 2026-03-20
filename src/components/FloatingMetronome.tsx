import { useState } from 'react';
import { useMetronome } from '@/hooks/use-metronome';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Minus, Plus, X, AudioLines } from 'lucide-react';

const TIME_SIGNATURES = [
  { value: '2', label: '2/4' },
  { value: '3', label: '3/4' },
  { value: '4', label: '4/4' },
  { value: '5', label: '5/4' },
  { value: '6', label: '6/8' },
  { value: '7', label: '7/8' },
];

const BPM_PRESETS = [60, 80, 100, 120, 140, 160];

export default function FloatingMetronome() {
  const [open, setOpen] = useState(false);
  const {
    bpm, setBpm,
    beatsPerMeasure, setBeatsPerMeasure,
    currentBeat, isPlaying, toggle,
  } = useMetronome();

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.max(20, Math.min(300, prev + delta)));
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`
          fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg
          flex items-center justify-center transition-all duration-200
          ${isPlaying
            ? 'bg-primary text-primary-foreground shadow-primary/40 animate-pulse'
            : 'bg-card text-foreground border border-border hover:bg-accent hover:text-accent-foreground'
          }
        `}
        title="Metrónomo"
      >
        <AudioLines className="h-5 w-5" />
      </button>

      {/* Mini widget panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-72 bg-card border border-border rounded-xl shadow-2xl animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <AudioLines className="h-4 w-4 text-primary" />
              Metrónomo
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {/* Beat indicators */}
            <div className="flex gap-2 items-center justify-center">
              {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                <div
                  key={i}
                  className={`
                    w-7 h-7 rounded-full border-2 transition-all duration-75 flex items-center justify-center text-xs font-mono font-bold
                    ${isPlaying && currentBeat === i
                      ? i === 0
                        ? 'bg-primary border-primary text-primary-foreground scale-125 shadow-md shadow-primary/30'
                        : 'bg-accent/70 border-accent text-accent-foreground scale-110'
                      : 'bg-muted border-border text-muted-foreground'
                    }
                  `}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* BPM control */}
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="icon" onClick={() => adjustBpm(-1)} className="h-8 w-8 rounded-full">
                <Minus className="h-3 w-3" />
              </Button>
              <div className="text-center min-w-[80px]">
                <span className="text-3xl font-mono font-bold text-foreground">{bpm}</span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">BPM</p>
              </div>
              <Button variant="outline" size="icon" onClick={() => adjustBpm(1)} className="h-8 w-8 rounded-full">
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Slider */}
            <Slider
              value={[bpm]}
              onValueChange={([v]) => setBpm(v)}
              min={20}
              max={300}
              step={1}
              className="w-full"
            />

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {BPM_PRESETS.map(p => (
                <Button
                  key={p}
                  variant={bpm === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBpm(p)}
                  className="font-mono text-[10px] h-6 px-2 min-w-[36px]"
                >
                  {p}
                </Button>
              ))}
            </div>

            {/* Time signature + Play */}
            <div className="flex items-center justify-between gap-2">
              <Select
                value={String(beatsPerMeasure)}
                onValueChange={(v) => setBeatsPerMeasure(Number(v))}
              >
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SIGNATURES.map(ts => (
                    <SelectItem key={ts.value} value={ts.value}>{ts.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={toggle}
                className={`
                  h-12 w-12 rounded-full shadow-lg transition-all
                  ${isPlaying
                    ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/30'
                    : 'bg-primary hover:bg-primary/90 shadow-primary/30'
                  }
                `}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
