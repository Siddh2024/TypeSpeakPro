import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSpeech } from '@/hooks/useSpeech';
import { Mic, X, Play, Send } from 'lucide-react';
import { toast } from 'sonner';
import { ZONES } from '@/data/speakingGameData';
import { generateConversationResponse } from '@/services/aiAnalysis';
import { InlineError } from '@/components/async';
import { useAsyncState } from '@/hooks/useAsyncState';
import { createAsyncError, logAsyncError, toUserSafeError } from '@/types/async';

interface MissionInterfaceProps {
    zoneId: number;
    onComplete: (score: { pronunciation: number, grammar: number, confidence: number }) => void;
    onExit: () => void;
}

// Mock Scenarios for now (Will use AI later)
const SCENARIOS: Record<number, { intro: string, aiFirst: string }> = {
    1: { intro: "You wake up in your apartment. Your roommate says hello.", aiFirst: "Good morning! Did you sleep well?" },
    2: { intro: "You are at the busy market to buy vegetables.", aiFirst: "Fresh tomatoes! Very cheap! How many kilos do you want?" },
    3: { intro: "You are at the train station ticket counter.", aiFirst: "Next please! Where are you travelling to today?" },
    4: { intro: "You are at the office coffee machine.", aiFirst: "Hey! Long time no see. How was your weekend?" },
    5: { intro: "You are on stage. The crowd is waiting.", aiFirst: "Welcome everyone! Please introduce yourself to the audience." },
};

type Turn = 'INTRO' | 'AI_SPEAKING' | 'USER_SPEAKING' | 'EVALUATING' | 'FINISHED';

const MissionInterface: React.FC<MissionInterfaceProps> = ({ zoneId, onComplete, onExit }) => {
    const { isListening, transcript, startListening, stopListening, resetTranscript, speak, isSpeaking, error: speechError } = useSpeech('en-US');
    const evaluationState = useAsyncState<void>();

    const [turn, setTurn] = useState<Turn>('INTRO');
    const [history, setHistory] = useState<{ role: 'ai' | 'user', text: string }[]>([]);
    const [feedback, setFeedback] = useState<'good' | 'average' | 'bad' | null>(null);
    const [exchangeCount, setExchangeCount] = useState(0);

    const scenario = SCENARIOS[zoneId] || SCENARIOS[1];
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history]);

    // Initial Intro
    useEffect(() => {
        if (turn === 'INTRO') {
            // Play intro sound or just wait for user to start
        }
    }, [turn]);

    const startMission = () => {
        setTurn('AI_SPEAKING');
        const initialMsg = scenario.aiFirst;
        addToHistory('ai', initialMsg);
        speak(initialMsg);
        // After speaking (simulated timeout for now, or use onEnd from useSpeech if exposed, currently manual or fixed delay)
        // Ideally useSpeech exposes onEnd. For now, manual "My turn" or auto-switch?
        // Let's rely on user clicking "Reply" for better control in this version.
    };

    const addToHistory = (role: 'ai' | 'user', text: string) => {
        setHistory(prev => [...prev, { role, text }]);
    };

    const transcriptRef = useRef(transcript);

    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    const handleUserReply = () => {
        if (isListening) {
            stopListening();
            setTurn('EVALUATING');

            // Use ref to get the very latest transcript after the slight delay
            setTimeout(() => {
                evaluateAndRespond(transcriptRef.current);
            }, 1500);

        } else {
            resetTranscript();
            setFeedback(null);
            setTurn('USER_SPEAKING');
            startListening();
        }
    };

    const evaluateAndRespond = async (userText: string) => {
        if (!userText.trim()) {
            setFeedback('bad');
            evaluationState.setError(createAsyncError(
                'No speech detected',
                'We did not capture a reply for this turn.',
                { recoveryHint: 'Press the microphone and speak clearly before sending.' }
            ));
            setTurn('USER_SPEAKING');
            return;
        }

        addToHistory('user', userText);
        evaluationState.setStatus('evaluating');

        try {
            // Call AI Service
            const context = SCENARIOS[zoneId]?.intro || "General Conversation";
            const result = await generateConversationResponse(history, userText, context);

            setFeedback(result.feedback);
            evaluationState.setData(undefined, 'success');

            // Limit exchanges for demo (game loop logic)
            if (exchangeCount >= 3) {
                setTurn('FINISHED');
                setTimeout(() => {
                    onComplete(result.scores);
                }, 1500);
                return;
            }

            setTimeout(() => {
                addToHistory('ai', result.reply);
                speak(result.reply);
                setTurn('AI_SPEAKING'); // Waiting for user to reply again
                setExchangeCount(prev => prev + 1);
            }, 500);

        } catch (err) {
            logAsyncError('speaking.evaluate', err);
            evaluationState.setError(toUserSafeError(err, {
                title: 'AI response failed',
                message: 'The conversation could not continue right now. Retry your reply.',
            }));
            toast.error("AI connection failed");
            setTurn('USER_SPEAKING');
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto h-[600px] flex flex-col relative animate-in zoom-in-95">
            {/* Header / HUD */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onExit} aria-label="Exit mission"><X className="w-5 h-5" /></Button>
                    <span className="font-bold text-lg">{ZONES.find(z => z.id === zoneId)?.name}</span>
                </div>
                <div className="flex gap-2">
                    <div className={`w-3 h-3 rounded-full ${feedback === 'good' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-neutral-800'}`}></div>
                    <div className={`w-3 h-3 rounded-full ${feedback === 'average' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]' : 'bg-neutral-800'}`}></div>
                    <div className={`w-3 h-3 rounded-full ${feedback === 'bad' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-neutral-800'}`}></div>
                </div>
            </div>

            {/* Turn Indicator */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
                {turn === 'AI_SPEAKING' && <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs border border-blue-500/50 animate-pulse">AI is speaking...</span>}
                {turn === 'USER_SPEAKING' && <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs border border-red-500/50 animate-pulse">Your turn! Speak now.</span>}
                {turn === 'EVALUATING' && <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-xs border border-yellow-500/50">Evaluating...</span>}
            </div>

            {/* Chat Area */}
            <Card className="flex-1 bg-neutral-900/80 border-white/5 backdrop-blur-md overflow-hidden flex flex-col relative">
                {turn === 'INTRO' && (
                    <div className="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center text-center p-8 space-y-6">
                        <h2 className="text-3xl font-bold text-white">Mission Start</h2>
                        <p className="text-xl text-neutral-400 max-w-md">"{scenario.intro}"</p>
                        <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-8" onClick={startMission}>
                            <Play className="w-5 h-5 mr-2" /> Start Conversation
                        </Button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {history.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[80%] p-4 rounded-2xl text-lg leading-relaxed
                                ${msg.role === 'user'
                                    ? 'bg-teal-500/20 border border-teal-500/30 text-teal-100 rounded-tr-none'
                                    : 'bg-white/10 border border-white/5 text-neutral-200 rounded-tl-none'}
                            `}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Interaction Bar */}
                <div className="p-6 bg-black/20 border-t border-white/5 flex items-center justify-center gap-6">
                    <div className="absolute bottom-28 left-6 right-6">
                        <InlineError error={speechError || evaluationState.error} onRetry={startListening} />
                    </div>
                    {turn !== 'INTRO' && turn !== 'FINISHED' && (
                        <>
                            {/* Transcript Preview */}
                            <div className="absolute bottom-24 left-0 right-0 text-center px-4">
                                {isListening && (
                                    <span className="bg-black/60 text-white px-3 py-1 rounded-lg text-sm backdrop-blur">
                                        "{transcript}"
                                    </span>
                                )}
                            </div>

                            <Button
                                size="xl"
                                onClick={handleUserReply}
                                disabled={turn === 'EVALUATING' || (turn === 'AI_SPEAKING' && isSpeaking)}
                                aria-label={isListening ? 'Send spoken reply' : 'Start speaking reply'}
                                className={`
                                    h-20 w-20 rounded-full shadow-2xl transition-all duration-300
                                    ${isListening
                                        ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/30'
                                        : turn === 'AI_SPEAKING' ? 'bg-neutral-700 opacity-50 cursor-wait'
                                            : 'bg-teal-500 hover:bg-teal-600 ring-4 ring-teal-500/30'
                                    }
                                `}
                            >
                                {isListening ? <Send className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                            </Button>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default MissionInterface;
