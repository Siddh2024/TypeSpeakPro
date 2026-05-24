import React from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import CircularProgress from './CircularProgress';

interface MicButtonProps {
  isRecording: boolean;
  timeRemaining: number;
  maxDuration: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const MicButton: React.FC<MicButtonProps> = ({
  isRecording,
  timeRemaining,
  maxDuration,
  onStart,
  onStop,
  disabled = false,
  size = 'lg',
}) => {
  const sizes = {
    sm: { outer: 80, inner: 48, icon: 20 },
    md: { outer: 120, inner: 72, icon: 28 },
    lg: { outer: 160, inner: 96, icon: 36 },
  };

  const { outer, inner, icon } = sizes[size];
  const progress = (timeRemaining / maxDuration) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* Pulse rings when recording */}
        {isRecording && (
          <>
            <div
              className="absolute inset-0 rounded-full animate-pulse-ring"
              style={{
                background: 'hsl(var(--destructive) / 0.2)',
                width: outer,
                height: outer,
              }}
            />
            <div
              className="absolute inset-0 rounded-full animate-pulse-ring"
              style={{
                background: 'hsl(var(--destructive) / 0.15)',
                width: outer,
                height: outer,
                animationDelay: '0.5s',
              }}
            />
          </>
        )}

        <CircularProgress
          value={isRecording ? progress : 100}
          size={outer}
          strokeWidth={6}
          showGlow={isRecording}
        >
          <button
            type="button"
            onClick={isRecording ? onStop : onStart}
            disabled={disabled}
            aria-label={isRecording ? 'Stop recording answer' : 'Start recording answer'}
            aria-pressed={isRecording}
            className={cn(
              'rounded-full flex items-center justify-center transition-all duration-300',
              isRecording
                ? 'bg-destructive hover:bg-destructive/90'
                : 'mic-button',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{ width: inner, height: inner }}
          >
            {isRecording ? (
              <Square className="text-white fill-current" style={{ width: icon * 0.7, height: icon * 0.7 }} />
            ) : (
              <Mic className="text-white" style={{ width: icon, height: icon }} />
            )}
          </button>
        </CircularProgress>
      </div>

      {/* Timer display */}
      <div className="text-center">
        <p className={cn(
          'font-heading text-3xl font-bold transition-colors duration-300',
          isRecording && timeRemaining <= 10 ? 'text-destructive' : 'text-foreground'
        )}>
          {formatTime(timeRemaining)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {isRecording ? 'Recording...' : 'Click to start'}
        </p>
      </div>
    </div>
  );
};

export default MicButton;
