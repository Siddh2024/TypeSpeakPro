import { useState, useEffect, useCallback, useRef } from 'react';
import type { AsyncErrorMetadata, AsyncStatus } from '@/types/async';
import { createAsyncError, logAsyncError } from '@/types/async';

// Type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface UseSpeechReturn {
    isListening: boolean;
    transcript: string;
    interimTranscript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    speak: (text: string, lang?: string) => void;
    isSpeaking: boolean;
    cancelSpeech: () => void;
    hasRecognitionSupport: boolean;
    hasSynthesisSupport: boolean;
    status: AsyncStatus;
    error: AsyncErrorMetadata | null;
    clearError: () => void;
}

export const useSpeech = (language: string = 'en-US'): UseSpeechReturn => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [status, setStatus] = useState<AsyncStatus>('idle');
    const [error, setError] = useState<AsyncErrorMetadata | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const startedRef = useRef(false);

    const hasRecognitionSupport = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    const hasSynthesisSupport = typeof window !== 'undefined' && 'speechSynthesis' in window;

    const clearRecognitionTimeout = useCallback(() => {
        if (recognitionTimeoutRef.current) {
            clearTimeout(recognitionTimeoutRef.current);
            recognitionTimeoutRef.current = null;
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

    useEffect(() => {
        if (!hasRecognitionSupport) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let currentInterim = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    currentInterim += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                setTranscript(prev => prev + ' ' + finalTranscript);
            }
            setInterimTranscript(currentInterim);
            if (finalTranscript || currentInterim) {
                clearRecognitionTimeout();
            }
        };

        recognition.onerror = (event: any) => {
            logAsyncError('speech.recognition', event.error);
            setError(createAsyncError(
                'Speech recognition stopped',
                event.error === 'not-allowed'
                    ? 'Microphone permission was denied. Allow microphone access in your browser settings and retry.'
                    : 'Speech recognition was interrupted. Please retry when you are ready.',
                {
                    code: event.error,
                    recoveryHint: event.error === 'no-speech' ? 'Speak closer to the microphone and try again.' : undefined,
                }
            ));
            setIsListening(false);
            setStatus('retryable-error');
            startedRef.current = false;
            clearRecognitionTimeout();
        };

        recognition.onend = () => {
            setIsListening(false);
            startedRef.current = false;
            clearRecognitionTimeout();
            setStatus(prev => prev === 'recording' ? 'idle' : prev);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            clearRecognitionTimeout();
        };
    }, [language, hasRecognitionSupport, clearRecognitionTimeout]);

    const startListening = useCallback(() => {
        if (!hasRecognitionSupport || !recognitionRef.current) {
            setError(createAsyncError(
                'Speech recognition is not supported',
                'This browser does not support speech recognition. Try Chrome or Edge for voice practice.',
                { retryable: false }
            ));
            setStatus('error');
            return;
        }

        if (isListening || startedRef.current) {
            setError(createAsyncError(
                'Already listening',
                'A recording session is already active. Stop it before starting again.',
                { recoveryHint: 'Use the stop button, then retry.' }
            ));
            setStatus('retryable-error');
            return;
        }

        try {
            setError(null);
            recognitionRef.current.start();
            startedRef.current = true;
            setIsListening(true);
            setStatus('recording');
            clearRecognitionTimeout();
            recognitionTimeoutRef.current = setTimeout(() => {
                if (!transcript && !interimTranscript) {
                    recognitionRef.current?.stop();
                    setError(createAsyncError(
                        'No speech detected',
                        'We did not hear anything before the recognition timeout.',
                        { recoveryHint: 'Check your microphone, then try again.' }
                    ));
                    setStatus('retryable-error');
                }
            }, 15000);
        } catch (err) {
            logAsyncError('speech.start', err);
            startedRef.current = false;
            setIsListening(false);
            setStatus('retryable-error');
            setError(createAsyncError(
                'Could not start listening',
                'Speech recognition could not start. Refresh the page or retry in a moment.'
            ));
        }
    }, [clearRecognitionTimeout, hasRecognitionSupport, interimTranscript, isListening, transcript]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            startedRef.current = false;
            setStatus('idle');
            clearRecognitionTimeout();
        }
    }, [clearRecognitionTimeout, isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
        setStatus('idle');
    }, []);

    const speak = useCallback((text: string, lang: string = language) => {
        if (!hasSynthesisSupport) {
            setError(createAsyncError(
                'Speech playback is not supported',
                'This browser cannot play synthesized speech. Try a modern browser for listening practice.',
                { retryable: false }
            ));
            setStatus('error');
            return;
        }

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        // Try to find a specific voice for this language
        const voices = window.speechSynthesis.getVoices();
        // Priority: Exact match -> Includes identifier -> Standard fallback
        const targetVoice = voices.find(v => v.lang === lang)
            || voices.find(v => v.lang.includes(lang.replace('-', '_'))) // Android/some browsers use underscore
            || voices.find(v => v.name.includes('India') && lang === 'en-IN') // Specific fallback for Indian English if labeled by name
            || voices.find(v => v.lang.startsWith(lang.split('-')[0]));

        if (targetVoice) {
            utterance.voice = targetVoice;
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
            setStatus('pending');
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            setStatus('idle');
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            setStatus('retryable-error');
            setError(createAsyncError('Playback failed', 'Audio playback was interrupted. Please try again.'));
        };

        window.speechSynthesis.speak(utterance);
    }, [language, hasSynthesisSupport]);

    const cancelSpeech = useCallback(() => {
        if (hasSynthesisSupport) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [hasSynthesisSupport]);

    return {
        isListening,
        transcript: transcript.trim(),
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript,
        speak,
        isSpeaking,
        cancelSpeech,
        hasRecognitionSupport,
        hasSynthesisSupport,
        status,
        error,
        clearError
    };
};
