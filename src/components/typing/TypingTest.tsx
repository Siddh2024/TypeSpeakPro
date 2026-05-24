
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RotateCcw, Hash, Type, AlignLeft, type LucideIcon, Pilcrow, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import TestResults from './TestResults';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useAiOpponent } from '@/hooks/useAiOpponent';
import RaceTrack from './RaceTrack';
import MultiplayerModal from './MultiplayerModal';
import MultiplayerResults from './MultiplayerResults';
import { Loader2 } from 'lucide-react';
import { Home } from 'lucide-react';
import type { RoomConfig } from '@/hooks/useMultiplayer';
import { InlineError, SaveIndicator } from '@/components/async';
import { useAsyncState } from '@/hooks/useAsyncState';
import { logAsyncError, toUserSafeError } from '@/types/async';

import {
    COMMON_WORDS, WORDS_EASY, WORDS_HARD,
    SENTENCES_EASY, SENTENCES_MEDIUM, SENTENCES_HARD,
    PARAGRAPHS_EASY, PARAGRAPHS_MEDIUM, PARAGRAPHS_HARD,
    PUNCTUATION,
    TypingMode, Difficulty,
    generateWords, generateSentences, applyTextTransformations
} from '@/lib/text-generation';

type TypingConfigUpdate = Partial<Pick<RoomConfig, 'mode' | 'duration' | 'difficulty' | 'text'>>;

const generateTextForConfig = (
    mode: TypingMode,
    difficulty: Difficulty,
    includeNumbers: boolean,
    includePunctuation: boolean
) => {
    if (mode === 'words') {
        return generateWords(100, includeNumbers, includePunctuation, difficulty);
    }

    if (mode === 'sentences') {
        const rawText = generateSentences(100, difficulty);
        return applyTextTransformations(rawText, includeNumbers, includePunctuation);
    }

    let sourceParagraphs = PARAGRAPHS_MEDIUM;
    if (difficulty === 'easy') sourceParagraphs = PARAGRAPHS_EASY;
    if (difficulty === 'hard') sourceParagraphs = PARAGRAPHS_HARD;

    const rawText = sourceParagraphs[Math.floor(Math.random() * sourceParagraphs.length)];
    return applyTextTransformations(rawText, includeNumbers, includePunctuation);
};

interface TypingTestProps {
    onComplete?: (stats: { wpm: number; accuracy: number; errorCount: number }) => void;
    initialMultiplayer?: boolean;
    aiMode?: boolean;
    initialConfig?: RoomConfig;
}

const TypingTest = ({ onComplete, initialMultiplayer = false, aiMode = false, initialConfig }: TypingTestProps) => {
    const { user } = useAuth();
    // Use AI hook if aiMode is true, otherwise standard multiplayer
    // Cast to explicit 'any' to bypass strict return type mismatch between hooks for now, 
    // as we just need the common interface in this component
    // Fix: Call BOTH hooks unconditionally to verify Rules of Hooks. 
    // Since neither hook auto-starts side effects without interaction, this is safe and prevents "Rendered fewer hooks" errors.
    const mpInterface = useMultiplayer(user);
    const aiInterface = useAiOpponent(user);

    // Select the active interface based on mode
    const multiplayer: any = aiMode ? aiInterface : mpInterface;
    const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(initialMultiplayer);
    const [userInput, setUserInput] = useState('');
    const [startTime, setStartTime] = useState<number | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [errorCount, setErrorCount] = useState(0);
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        if (multiplayer.gameState === 'countdown' && multiplayer.startTime) {
            const i = setInterval(() => {
                const left = Math.ceil((multiplayer.startTime! - Date.now()) / 1000);
                setCountdown(left > 0 ? left : 0);
            }, 100);
            return () => clearInterval(i);
        }
    }, [multiplayer.gameState, multiplayer.startTime]);

    // Config State
    const [includeNumbers, setIncludeNumbers] = useState(false);
    const [includePunctuation, setIncludePunctuation] = useState(false);
    const [activeConfig, setActiveConfig] = useState<RoomConfig>(() => {
        const mode = initialConfig?.mode ?? 'words';
        const difficulty = initialConfig?.difficulty ?? 'medium';
        const duration = initialConfig?.duration ?? 30;
        const text = initialConfig?.text || generateTextForConfig(mode, difficulty, false, false);

        return { mode, difficulty, duration, text };
    });
    const { mode, difficulty, duration: selectedTime, text: targetText } = activeConfig;
    const [timeLeft, setTimeLeft] = useState(() => activeConfig.duration);

    const [isFinished, setIsFinished] = useState(false);
    const [history, setHistory] = useState<{ time: number; wpm: number; raw: number }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const saveState = useAsyncState<void>();
    const saveInFlightRef = useRef(false);
    const lastSavePayloadRef = useRef<any>(null);
    const navigate = useNavigate();

    const resetSessionState = useCallback((duration: number) => {
        setUserInput('');
        setStartTime(null);
        setTimeLeft(duration);
        setIsActive(false);
        setIsFinished(false);
        setWpm(0);
        setAccuracy(100);
        setErrorCount(0);
        setHistory([]);
        saveState.reset();
        lastSavePayloadRef.current = null;
        if (inputRef.current) inputRef.current.focus();
    }, [saveState]);

    const saveTestResult = useCallback(async (payload: {
        wpm: number;
        accuracy: number;
        errorCount: number;
        time: number;
        mode: TypingMode;
    }) => {
        lastSavePayloadRef.current = payload;

        if (!user?.id) {
            if (user) {
                saveState.setError({
                    title: 'Progress not saved',
                    message: 'Your profile is signed in, but the database profile is not ready yet.',
                    recoveryHint: 'Refresh or sign in again before saving new results.',
                    retryable: false,
                }, false);
            }
            return;
        }

        if (saveInFlightRef.current) return;
        saveInFlightRef.current = true;
        saveState.setStatus('saving');

        try {
            const { error } = await supabase
                .from('test_results')
                .insert({
                    user_id: user.id,
                    wpm: payload.wpm,
                    accuracy: payload.accuracy,
                    error_count: payload.errorCount,
                    time_duration: payload.time,
                    mode: payload.mode
                });

            if (error) throw error;
            saveState.setData(undefined, 'success');
            toast.success("Result saved to history!");
        } catch (err) {
            logAsyncError('typing.saveResult', err);
            saveState.setError(toUserSafeError(err, {
                title: 'Could not save your result',
                message: 'Your score is still visible here. Retry saving when your connection is stable.',
            }));
        } finally {
            saveInFlightRef.current = false;
        }
    }, [saveState, user]);

    const retrySave = useCallback(() => {
        if (lastSavePayloadRef.current) {
            saveTestResult(lastSavePayloadRef.current);
        }
    }, [saveTestResult]);

    // Automatically open multiplayer modal if prop passed OR if URL has ?room=
    // Automatically open multiplayer modal if prop passed OR if URL has ?room=
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const roomCodeParam = params.get('room');

        if (initialMultiplayer || roomCodeParam) {
            // Short delay to ensure Radix Dialog can attach to DOM properly on fresh mount
            setTimeout(() => {
                setIsMultiplayerOpen(true);
            }, 100);

            if (roomCodeParam && !multiplayer.roomCode && 'joinRoom' in multiplayer) {
                // Only join room if standard multiplayer
                multiplayer.joinRoom(roomCodeParam);
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
            }
        }

        // Auto-start AI Matchmaking
        if (aiMode && 'startMatchmaking' in multiplayer) {
            // Cast to custom type or just call it safely, ts-ignore for now as intersection type complex
            // @ts-ignore
            multiplayer.startMatchmaking();
        }
    }, [initialMultiplayer, aiMode]);

    // Update Room Config when Host changes settings
    useEffect(() => {
        if (multiplayer.isHost && multiplayer.roomCode) {
            const config = {
                text: targetText, // Note: This might need to be generated *before* broadcasting
                mode,
                duration: selectedTime,
                difficulty
            };
            // multiplayer.broadcastConfig(config); // Uncomment when ready to sync
        }
    }, [targetText, mode, selectedTime, difficulty, multiplayer.isHost, multiplayer.roomCode]);

    // Sync Local State with Room Config (Clients)
    useEffect(() => {
        if (multiplayer.roomConfig && !multiplayer.isHost) {
            setActiveConfig(multiplayer.roomConfig);
            resetSessionState(multiplayer.roomConfig.duration);
        }
    }, [multiplayer.roomConfig, multiplayer.isHost, resetSessionState]);


    // Handle Game Start Countdown
    useEffect(() => {
        if (multiplayer.gameState === 'countdown' && multiplayer.startTime) {
            // Ensure everything is reset
            setUserInput('');
            setWpm(0);
            setAccuracy(100);
            setIsFinished(false);
            setIsActive(false);

            // The actual "start" happens when countdown hits 0 (handled in UI or separate effect)
        }
    }, [multiplayer.gameState, multiplayer.startTime]);

    const resetTest = useCallback((config: TypingConfigUpdate = {}) => {
        const nextMode = config.mode ?? mode;
        const nextDifficulty = config.difficulty ?? difficulty;
        const nextDuration = config.duration ?? selectedTime;
        const nextText = config.text || generateTextForConfig(
            nextMode,
            nextDifficulty,
            includeNumbers,
            includePunctuation
        );

        setActiveConfig({
            mode: nextMode,
            difficulty: nextDifficulty,
            duration: nextDuration,
            text: nextText
        });
        resetSessionState(nextDuration);
    }, [difficulty, includeNumbers, includePunctuation, mode, resetSessionState, selectedTime]);

    const applyConfig = useCallback((
        config: TypingConfigUpdate,
        options: { includeNumbers?: boolean; includePunctuation?: boolean } = {}
    ) => {
        const nextMode = config.mode ?? mode;
        const nextDifficulty = config.difficulty ?? difficulty;
        const nextDuration = config.duration ?? selectedTime;
        const nextIncludeNumbers = options.includeNumbers ?? includeNumbers;
        const nextIncludePunctuation = options.includePunctuation ?? includePunctuation;
        const nextText = config.text || generateTextForConfig(
            nextMode,
            nextDifficulty,
            nextIncludeNumbers,
            nextIncludePunctuation
        );

        setIncludeNumbers(nextIncludeNumbers);
        setIncludePunctuation(nextIncludePunctuation);
        setActiveConfig({
            mode: nextMode,
            difficulty: nextDifficulty,
            duration: nextDuration,
            text: nextText
        });
        resetSessionState(nextDuration);
    }, [difficulty, includeNumbers, includePunctuation, mode, resetSessionState, selectedTime]);

    useEffect(() => {
        if (!initialConfig) return;

        const nextText = initialConfig.text || generateTextForConfig(
            initialConfig.mode,
            initialConfig.difficulty,
            false,
            false
        );

        setActiveConfig({
            ...initialConfig,
            text: nextText
        });
        resetSessionState(initialConfig.duration);
    }, [initialConfig, resetSessionState]);

    const handleComplete = useCallback(() => {
        setIsFinished(true); // Stop input
        setIsActive(false); // Stop timer/logic
        const endTime = Date.now();
        const durationMinutes = (endTime - (startTime || endTime)) / 60000;
        const wordsTyped = userInput.length / 5;
        const finalWpm = Math.round(wordsTyped / durationMinutes) || 0;

        // Calculate Accuracy Manually to ensure non-zero
        let correctChars = 0;
        for (let i = 0; i < userInput.length; i++) {
            if (userInput[i] === targetText[i]) correctChars++;
        }
        const finalAccuracy = userInput.length > 0 ? Math.round((correctChars / userInput.length) * 100) : 100;

        setWpm(finalWpm);
        setAccuracy(finalAccuracy); // Update local state
        saveTestResult({
            wpm: finalWpm,
            accuracy: finalAccuracy,
            errorCount,
            time: selectedTime,
            mode
        });

        // Submit to Multiplayer if active
        if (multiplayer.roomCode && multiplayer.completeRace) {
            multiplayer.completeRace({
                wpm: finalWpm,
                accuracy: finalAccuracy,
                time: selectedTime,
                errorCount
            });
        }

        if (onComplete) {
            onComplete({ wpm: finalWpm, accuracy: finalAccuracy, errorCount });
        }
    }, [userInput, targetText, startTime, selectedTime, errorCount, multiplayer, onComplete, saveTestResult, mode]);

    // Check for completion
    useEffect(() => {
        if (!targetText || !userInput || isFinished) return; // Added isFinished check

        if (userInput.length === targetText.length) {
            handleComplete();
        } else if (multiplayer.roomCode && multiplayer.gameState === 'racing') {
            // Update progress in multiplayer
            // WPM Calculation for progress
            const timeElapsed = (Date.now() - (startTime || Date.now())) / 1000 / 60;
            const wordsTyped = userInput.length / 5;
            const currentWpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
            const progress = Math.min(100, (userInput.length / targetText.length) * 100);

            multiplayer.updateProgress(progress, currentWpm);
        }
    }, [userInput, targetText, multiplayer, startTime, handleComplete, isFinished]);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        endTest();
                        return 0;
                    }
                    return prev - 1;
                });

                // Record history
                setHistory(prev => {
                    const timeElapsed = selectedTime - (timeLeft - 1);
                    return [...prev, { time: timeElapsed, wpm, raw: wpm }];
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    // Update WPM and Accuracy live
    useEffect(() => {
        if (isActive && startTime) {
            const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
            const wordsTyped = userInput.length / 5;
            const currentWpm = Math.round(wordsTyped / timeElapsed) || 0;

            setWpm(currentWpm);

            // Calculate accuracy
            let errors = 0;
            for (let i = 0; i < userInput.length; i++) {
                if (userInput[i] !== targetText[i]) errors++;
            }
            const acc = Math.max(0, Math.round(((userInput.length - errors) / userInput.length) * 100));
            setAccuracy(acc || 100);
            setErrorCount(errors);
        }
    }, [userInput, startTime, isActive]);



    const endTest = async () => {
        setIsActive(false);
        setIsFinished(true);

        // Calculate final stats for multiplayer submission if time ran out
        if (multiplayer.roomCode && multiplayer.completeRace) {
            const wordsTyped = userInput.length / 5;
            const durationMinutes = selectedTime / 60; // Use selected time as full duration since time ran out
            const finalWpm = Math.round(wordsTyped / durationMinutes) || 0;

            let correctChars = 0;
            for (let i = 0; i < userInput.length; i++) {
                if (userInput[i] === targetText[i]) correctChars++;
            }
            const finalAccuracy = userInput.length > 0 ? Math.round((correctChars / userInput.length) * 100) : 100;

            console.log("Time ran out, submitting to multiplayer:", { finalWpm, finalAccuracy });
            multiplayer.completeRace({
                wpm: finalWpm,
                accuracy: finalAccuracy,
                time: selectedTime,
                errorCount
            });
        }

        await saveTestResult({ wpm, accuracy, errorCount, time: selectedTime, mode });

        if (onComplete) {
            onComplete({ wpm, accuracy, errorCount });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (!isActive && value.length === 1) {
            setStartTime(Date.now());
            setIsActive(true);
        }

        setUserInput(value);

        // Auto-scroll logic if needed (already implemented via useEffect below)
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
            inputRef.current.focus();
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            resetTest();
        }
    };

    // Calculate active character position for auto-scroll
    const [activeCharIndex, setActiveCharIndex] = useState(0);
    const activeCharRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        setActiveCharIndex(userInput.length);

        // Scroll logic: Keep active line ~2nd line
        if (activeCharRef.current && containerRef.current) {
            const container = containerRef.current;
            const activeChar = activeCharRef.current;

            // Simple logic: Scroll active char into view with some padding
            const containerRect = container.getBoundingClientRect();
            const charRect = activeChar.getBoundingClientRect();

            const relativeTop = charRect.top - containerRect.top;
            const lineHeight = 64; // approx 4rem

            // If character is below the 2nd line, scroll
            if (relativeTop > lineHeight * 2) {
                container.scrollTo({
                    top: container.scrollTop + lineHeight,
                    behavior: 'smooth'
                });
            } else if (relativeTop < lineHeight) {
                // Check if we need to scroll up (backspacing)
                container.scrollTo({
                    top: container.scrollTop - lineHeight,
                    behavior: 'smooth'
                });
            }
        }
    }, [userInput]);

    // Render text with specific coloring
    const renderText = () => {
        if (!targetText) return null; // Prevent crash if undefined
        return targetText.split('').map((char, index) => {
            // Colors: Untyped = very muted, Typed Correct = bright, Error = red
            let className = 'text-muted-foreground/40 transition-colors duration-200';

            if (index < userInput.length) {
                const isCorrect = char === userInput[index];
                className = isCorrect ? 'text-foreground' : 'text-red-500 bg-red-500/10';
            }

            const isCurrent = index === activeCharIndex;

            return (
                <span
                    key={index}
                    ref={isCurrent ? activeCharRef : null}
                    className={cn(className, "relative inline-block")}
                >
                    {isCurrent && (
                        <span className="absolute -left-[2px] top-1 bottom-1 w-[2px] bg-primary animate-pulse rounded-full shadow-[0_0_8px_rgba(45,212,191,0.5)]"></span>
                    )}
                    {char}
                </span>
            );
        });
    };

    return (
        <div
            className="w-full max-w-5xl mx-auto flex flex-col gap-8 outline-none relative justify-center"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            onClick={() => inputRef.current?.focus()}
        >
            {/* Website Branding */}
            <div className="absolute -top-32 left-0 flex items-center gap-3 select-none group cursor-default">
                <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 shadow-[0_0_15px_-3px_rgba(20,184,166,0.3)] group-hover:shadow-[0_0_20px_-3px_rgba(20,184,166,0.5)] transition-shadow duration-300">
                    <Type className="w-6 h-6 text-teal-400" />
                </div>
                <h1 className="font-bold text-2xl tracking-tighter text-foreground">
                    TypeSpeak<span className="text-teal-400">Pro</span>
                </h1>
            </div>

            {/* Controls Header - Fades out config, keeps stats */}
            <div
                className="flex items-center justify-between bg-transparent p-2 absolute -top-16 left-0 right-0 z-20"
            >


                {/* Config Options - Fade out when active */}
                <div className={cn(
                    "flex gap-2 bg-secondary/30 p-1 rounded-full backdrop-blur-md border border-border transition-all duration-500 ease-in-out",
                    isActive ? "opacity-0 pointer-events-none translate-y-[-10px]" : "opacity-100 translate-y-0"
                )}>
                    {/* Mode Selector */}
                    <div className="flex items-center gap-1 pr-2 border-r border-border mr-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => applyConfig({ mode: 'words' })}
                                        className={cn(
                                            "flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1 rounded-full",
                                            mode === 'words' ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Type className="w-3.5 h-3.5" />
                                        <span className="sr-only">words</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Words</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => applyConfig({ mode: 'sentences' })}
                                        className={cn(
                                            "flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1 rounded-full",
                                            mode === 'sentences' ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <AlignLeft className="w-3.5 h-3.5" />
                                        <span className="sr-only">sentences</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Sentences</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button onClick={() => applyConfig({ mode: 'paragraphs' })}
                                        className={cn(
                                            "flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1 rounded-full",
                                            mode === 'paragraphs' ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <span className="font-serif">¶</span>
                                        <span className="sr-only">paragraphs</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Paragraphs</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {[15, 30, 60, 120].map(time => (
                        <button
                            key={time}
                            onClick={() => applyConfig({ duration: time })}
                            className={cn(
                                "text-sm font-mono transition-all duration-200 px-3 py-1 rounded-full",
                                selectedTime === time ? "bg-primary/20 text-primary font-bold shadow-glow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {time}s
                        </button>
                    ))}
                    <div className="w-[1px] h-4 bg-border mx-2 self-center" />

                    {/* Punctuation/Numbers toggle for ALL modes */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => applyConfig({}, { includePunctuation: !includePunctuation })}
                            className={cn(
                                "flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1 rounded-full",
                                includePunctuation ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Hash className="w-3.5 h-3.5" />
                            <span className="sr-only">symbols</span>
                        </button>
                        <button
                            onClick={() => applyConfig({}, { includeNumbers: !includeNumbers })}
                            className={cn(
                                "flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1 rounded-full",
                                includeNumbers ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="font-mono font-bold text-xs">@</span>
                            <span className="sr-only">numbers</span>
                        </button>
                    </div>

                    {/* Difficulty UI for All Modes */}
                    <div className="flex items-center gap-1">
                        {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                            <button
                                key={level}
                                onClick={() => applyConfig({ difficulty: level })}
                                className={cn(
                                    "text-xs font-medium transition-colors px-2.5 py-1 rounded-full capitalize",
                                    difficulty === level ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    <div className="w-[1px] h-4 bg-border mx-2 self-center" />

                    {/* Leaderboard Button */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => navigate('/leaderboard')}
                                    className="flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1 rounded-full text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10"
                                >
                                    <Trophy className="w-3.5 h-3.5" />
                                    <span className="sr-only">Leaderboard</span>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Leaderboard</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Live Stats - ALWAYS VISIBLE (but subtle) */}
                <div className="flex items-center gap-6 text-xl font-mono transition-opacity duration-300">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Time</span>
                        <span className="text-primary font-bold text-2xl">{timeLeft}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">WPM</span>
                        <span className="text-foreground font-bold text-2xl">{wpm}</span>
                    </div>
                </div>
            </div>

            {/* Multiplayer Race Track */}
            {multiplayer.roomCode && (
                <div className="mb-8">
                    <RaceTrack players={multiplayer.players} currentUserId={user?.id} />
                </div>
            )}

            {/* Check for completion */}
            {/* Logic moved to useEffect below to allow handleComplete access */}

            {/* Results Modal */}
            {multiplayer.roomCode ? (
                <MultiplayerResults
                    open={isFinished}
                    onOpenChange={setIsFinished}
                    multiplayer={multiplayer}
                    onRestart={() => {
                        resetTest();
                    }}
                    results={{
                        wpm,
                        accuracy,
                        time: selectedTime,
                        errorCount
                    }}
                />
            ) : (
                <TestResults
                    open={isFinished}
                    onOpenChange={setIsFinished}
                    stats={{
                        wpm,
                        accuracy,
                        errorCount,
                        time: selectedTime,
                        history
                    }}
                    onRestart={resetTest}
                />
            )}

            {/* Typing Area */}
            <div
                ref={containerRef}
                className={cn(
                    "relative h-[280px] w-full overflow-hidden flex items-start justify-start text-3xl leading-[4rem] tracking-wide font-mono outline-none cursor-default rounded-xl bg-card p-4 border border-border",
                    isFinished ? "blur-sm opacity-50 grayscale pointer-events-none" : ""
                )}
            >
                {/* Text Display - RESTORED */}
                <div
                    className="relative z-10 break-words pointer-events-none select-none w-full whitespace-pre-wrap tracking-wide"
                    style={{ wordSpacing: '0.1em' }}
                >
                    {renderText()}
                </div>

                {/* Cursor Overlay */}
                <div
                    className="absolute"
                    style={{
                        left: activeCharRef.current?.offsetLeft ?? 0,
                        top: activeCharRef.current?.offsetTop ?? 0,
                        transition: "all 0.1s ease-out"
                    }}
                >
                    {/* Cursor is actually handled inside renderText via a span, but if we need a global one we can add it. 
                        Looking at renderText (line 403), it adds a cursor span inside the active char. 
                        So we might just need the text container. Previous code had a separate cursor overlay too in some versions, but let's stick to renderText first. 
                        Wait, earlier step 271 showed a Cursor Overlay div. Let's add it back if it looks good, but renderText has `isCurrent` logic.
                        Actually, renderText logic at line 421 adds a blinking cursor. 
                        So just restoring renderText() container should be enough.
                     */}
                </div>

                {/* Input Field - Always focusable when not finished, but logic handles actual 'typing' */}
                <input
                    ref={inputRef}
                    type="text"
                    className="absolute inset-0 opacity-0 w-full h-full z-20 cursor-text"
                    onChange={handleInputChange}
                    value={userInput}
                    onPaste={(e) => e.preventDefault()}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    // Fix: Ensure it's enabled if we are in multiplayer and racing, OR if we are solo and active/inactive
                    disabled={isFinished || (!!multiplayer.roomCode && multiplayer.gameState !== 'racing')}
                    autoFocus
                />
            </div>

            {/* Results Modal Overlay */}


            <div className="flex justify-center pt-8">
                <div className="flex flex-col items-center gap-3">
                    <SaveIndicator status={saveState.status} />
                    <InlineError error={saveState.error} onRetry={saveState.error?.retryable === false ? undefined : retrySave} />
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <Button variant="ghost" size="lg" onClick={resetTest} className="opacity-50 hover:opacity-100 transition-opacity">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restart Test
                </Button>
            </div>
            <div className="flex justify-center pt-8">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => navigate('/')}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                >
                    <Home className="mr-2 h-4 w-4" />
                    Home
                </Button>
            </div>

            <MultiplayerModal
                open={isMultiplayerOpen}
                onOpenChange={setIsMultiplayerOpen}
                multiplayer={multiplayer}
            />

            {/* Countdown Overlay */}
            {multiplayer.gameState === 'countdown' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="text-[12rem] font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 animate-pulse tracking-tighter drop-shadow-2xl">
                        {countdown}
                    </div>
                </div>
            )}

            {/* AI Searching Overlay */}
            {/* @ts-ignore - isSearching property specific to AI hook */}
            {multiplayer.isSearching && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="w-2 h-2 bg-teal-400 rounded-full animate-ping"></span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground tracking-widest uppercase animate-pulse">Finding Opponent...</h2>
                        <p className="text-muted-foreground text-sm">Searching global ranked queue</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TypingTest;
