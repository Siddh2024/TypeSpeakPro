import React, { useState, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Swords, Clock, FileText, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoomConfig } from '@/hooks/useMultiplayer';

interface RankedConfigModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStart: (config: RoomConfig) => void;
    title?: string;
    description?: string;
    actionLabel?: string;
    icon?: ReactNode;
}

const RankedConfigModal = ({
    open,
    onOpenChange,
    onStart,
    title = 'Ranked Match Setup',
    description = 'Configure your race settings before finding an opponent.',
    actionLabel = 'Find Opponent',
    icon
}: RankedConfigModalProps) => {
    const [mode, setMode] = useState<'words' | 'sentences' | 'paragraphs'>('words');
    const [duration, setDuration] = useState(30);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

    const handleStart = () => {
        onStart({
            mode,
            duration,
            difficulty,
            text: '' // Text generated later
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#0f172a] border-white/10 p-0 overflow-hidden gap-0">
                <div className="relative p-6 bg-gradient-to-b from-teal-500/10 to-transparent">
                    <DialogHeader className="relative z-10">
                        <div className="mx-auto bg-teal-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-4 border border-teal-500/20 shadow-[0_0_15px_rgba(45,212,191,0.3)]">
                            {icon || <Swords className="w-6 h-6 text-teal-400" />}
                        </div>
                        <DialogTitle className="text-center text-xl font-bold tracking-tight text-white">{title}</DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* Duration Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" /> Duration
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {[15, 30, 60, 120].map((time) => (
                                <button
                                    key={time}
                                    onClick={() => setDuration(time)}
                                    className={cn(
                                        "py-2 rounded-lg text-sm font-medium transition-all border",
                                        duration === time
                                            ? "bg-teal-500/20 text-teal-400 border-teal-500/50 shadow-sm"
                                            : "bg-secondary/20 text-muted-foreground border-transparent hover:bg-secondary/40 hover:text-white"
                                    )}
                                >
                                    {time}s
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Mode
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['words', 'sentences', 'paragraphs'] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={cn(
                                        "py-2 rounded-lg text-sm font-medium transition-all border capitalize",
                                        mode === m
                                            ? "bg-teal-500/20 text-teal-400 border-teal-500/50 shadow-sm"
                                            : "bg-secondary/20 text-muted-foreground border-transparent hover:bg-secondary/40 hover:text-white"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <BarChart className="w-3.5 h-3.5" /> Difficulty
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['easy', 'medium', 'hard'] as const).map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={cn(
                                        "py-2 rounded-lg text-sm font-medium transition-all border capitalize",
                                        difficulty === d
                                            ? "bg-teal-500/20 text-teal-400 border-teal-500/50 shadow-sm"
                                            : "bg-secondary/20 text-muted-foreground border-transparent hover:bg-secondary/40 hover:text-white"
                                    )}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="w-full bg-teal-500 hover:bg-teal-600 text-black font-bold mt-4"
                        onClick={handleStart}
                    >
                        {actionLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RankedConfigModal;
