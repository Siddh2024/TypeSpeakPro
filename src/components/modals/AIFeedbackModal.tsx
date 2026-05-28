import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Brain, Zap, Calendar, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AIFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AIFeedbackModal = ({ isOpen, onClose }: AIFeedbackModalProps) => {
    const handleNotifyMe = () => {
        toast.success("You're on the list! 🎉", {
            description: "We'll notify you when AI Feedback launches.",
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-[#0f172a]/95 backdrop-blur-3xl border-white/10 p-0 overflow-hidden shadow-2xl">
                {/* Dynamic Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-transparent pointer-events-none" />

                {/* Hero Section */}
                <div className="relative p-8 flex flex-col items-center justify-center text-center space-y-4 pt-12 overflow-hidden">
                    {/* Floating Ethereal Orbs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

                    <div className="relative z-10 p-4 bg-gradient-to-b from-white/10 to-white/5 rounded-full border border-white/20 shadow-[0_0_30px_-5px_rgba(34,211,238,0.4)] animate-float">
                        <Brain className="w-10 h-10 text-cyan-300" />
                    </div>

                    <div className="space-y-2 relative z-10">
                        <DialogTitle className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-200">
                            AI Feedback
                        </DialogTitle>
                        <p className="text-cyan-300/80 font-medium tracking-widest uppercase text-xs">Smart Suggestions • Coming Soon</p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-8 pb-8 space-y-6 relative z-10">
                    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-cyan-500/20 rounded-lg">
                                <Zap className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-white">Real-Time Analysis</h4>
                                <p className="text-xs text-muted-foreground mt-1">Get instant AI-powered feedback on your typing patterns and speech.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Wand2 className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-white">Personalized Suggestions</h4>
                                <p className="text-xs text-muted-foreground mt-1">Smart recommendations tailored to your skill level and goals.</p>
                            </div>
                        </div>
                    </div>

                    {/* Launch Date */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-cyan-300" />
                            <span className="text-sm font-semibold text-cyan-100">Expected Launch</span>
                        </div>
                        <span className="text-lg font-bold text-white tracking-wide">Coming Soon</span>
                    </div>

                    <Button
                        onClick={handleNotifyMe}
                        className="w-full bg-white text-black hover:bg-neutral-200 font-bold transition-all h-12 rounded-xl shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
                    >
                        <Sparkles className="w-4 h-4 mr-2 text-cyan-600" />
                        Notify Me
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AIFeedbackModal;
