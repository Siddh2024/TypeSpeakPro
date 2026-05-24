import { useState, useRef, useCallback, useEffect } from 'react';
import type { AsyncErrorMetadata, AsyncStatus } from '@/types/async';
import { createAsyncError, logAsyncError } from '@/types/async';

interface UseVoiceRecorderProps {
  maxDuration?: number; // in seconds
  onRecordingComplete?: (blob: Blob, transcript: string) => void;
  onTimeUpdate?: (timeRemaining: number) => void;
}

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  timeRemaining: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  audioBlob: Blob | null;
  error: AsyncErrorMetadata | null;
  hasPermission: boolean | null;
  status: AsyncStatus;
  retry: () => Promise<void>;
  clearError: () => void;
}

// Extend global window object for webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export const useVoiceRecorder = ({
  maxDuration = 60,
  onRecordingComplete,
  onTimeUpdate,
}: UseVoiceRecorderProps = {}): UseVoiceRecorderReturn & { transcript: string } => { // Add transcript to return type
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(maxDuration);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<AsyncErrorMetadata | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState(''); // Add transcript state
  const transcriptRef = useRef(''); // Ref to hold latest transcript without causing re-renders in closure
  const savedCallback = useRef(onRecordingComplete); // Ref for saved callback to avoid stale closures

  // Update saved callback
  useEffect(() => {
    savedCallback.current = onRecordingComplete;
  }, [onRecordingComplete]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null); // Speech recognition ref
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearTimer();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore error if already stopped
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    setStatus('idle');
  }, [clearTimer]);

  const startRecording = useCallback(async () => {
    if (isRecording || isStartingRef.current) {
      setError(createAsyncError(
        'Recording already active',
        'Stop the current recording before starting another one.',
        { recoveryHint: 'Use the stop button, then try again.' }
      ));
      setStatus('retryable-error');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setHasPermission(false);
      setStatus('error');
      setError(createAsyncError(
        'Recording is not supported',
        'This browser cannot record microphone audio. Try Chrome, Edge, or Firefox.',
        { retryable: false }
      ));
      return;
    }

    try {
      isStartingRef.current = true;
      setError(null);
      setStatus('pending');
      setAudioBlob(null);
      setTranscript(''); // Reset transcript
      transcriptRef.current = '';
      audioChunksRef.current = [];
      setTimeRemaining(maxDuration);

      // 1. Get Audio Stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setHasPermission(true);
      streamRef.current = stream;
      stream.getTracks().forEach(track => {
        track.onended = () => {
          if (isRecording) {
            setError(createAsyncError(
              'Microphone access ended',
              'The microphone permission or device connection was interrupted.',
              { recoveryHint: 'Reconnect or allow the microphone, then retry.' }
            ));
            setStatus('retryable-error');
            stopRecording();
          }
        };
      });

      // 2. Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setStatus('success');
        // Use savedCallback to ensure we access the latest closure context (including fresh state from parent)
        if (savedCallback.current) {
          savedCallback.current(blob, transcriptRef.current);
        }
      };

      mediaRecorder.start(100);

      // 3. Setup Speech Recognition (Web Speech API)
      if ('webkitSpeechRecognition' in window) {
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          // Re-construct the full transcript from all results
          for (let i = 0; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          transcriptRef.current = currentTranscript; // Update ref
        };

        recognition.onerror = (event: any) => {
          logAsyncError("voiceRecorder.recognition", event.error);
          setError(createAsyncError(
            'Speech transcript unavailable',
            event.error === 'not-allowed'
              ? 'Speech recognition permission was denied. Recording can continue, but transcript capture needs permission.'
              : 'We could not capture a transcript for this recording.',
            { code: event.error, recoveryHint: 'Stop and retry if the transcript is required.' }
          ));
        };

        recognition.start();
        recognitionRef.current = recognition;
      } else {
        console.warn("Web Speech API not supported in this browser.");
      }

      setIsRecording(true);
      setStatus('recording');

      // 4. Start Timer
      let remaining = maxDuration;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        setTimeRemaining(remaining);
        onTimeUpdate?.(remaining);

        if (remaining <= 0) {
          stopRecording();
        }
      }, 1000);

    } catch (err) {
      setHasPermission(false);
      setStatus('retryable-error');
      setError(createAsyncError(
        'Microphone access failed',
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Enable microphone access in your browser settings and retry.'
          : 'We could not access your microphone. Check the device and try again.',
        {
          cause: err,
          code: err instanceof DOMException ? err.name : undefined,
          recoveryHint: 'Look for the lock icon in your browser address bar to allow microphone access.',
        }
      ));
      logAsyncError('voiceRecorder.start', err);
    } finally {
      isStartingRef.current = false;
    }
  }, [isRecording, maxDuration, onTimeUpdate, stopRecording]);

  const clearError = useCallback(() => setError(null), []);

  return {
    isRecording,
    isPaused,
    timeRemaining,
    startRecording,
    stopRecording,
    audioBlob,
    error,
    hasPermission,
    status,
    retry: startRecording,
    clearError,
    transcript, // Return transcript
  };
};
