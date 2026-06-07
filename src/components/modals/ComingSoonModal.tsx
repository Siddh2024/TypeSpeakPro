import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Calendar } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    icon: LucideIcon;
    launchDate?: string;
    accentColor?: 'cyan' | 'purple' | 'pink' | 'amber' | 'green';
}

const colorThemes = {
    cyan: {
        gradient: 'from-cyan-500/10 via-blue-500/10 to-transparent',
        orb1: 'bg-cyan-500/10',
        orb2: 'bg-blue-500/10',
        iconBg: 'shadow-[0_0_30px_-5px_rgba(34,211,238,0.4)]',
        iconColor: 'text-cyan-300',
        titleGradient: 'from-cyan-200 via-white to-cyan-200',
        tagText: 'text-cyan-300/80',
        badgeBg: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
        badgeIcon: 'text-cyan-300',
        badgeText: 'text-cyan-100',
        btnIcon: 'text-cyan-600',
    },
    purple: {
        gradient: 'from-purple-500/10 via-indigo-500/10 to-transparent',
        orb1: 'bg-purple-500/10',
        orb2: 'bg-indigo-500/10',
        iconBg: 'shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)]',
        iconColor: 'text-purple-300',
        titleGradient: 'from-purple-200 via-white to-purple-200',
        tagText: 'text-purple-300/80',
        badgeBg: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30',
        badgeIcon: 'text-purple-300',
        badgeText: 'text-purple-100',
        btnIcon: 'text-purple-600',
    },
    pink: {
        gradient: 'from-pink-500/10 via-rose-500/10 to-transparent',
        orb1: 'bg-pink-500/10',
        orb2: 'bg-rose-500/10',
        iconBg: 'shadow-[0_0_30px_-5px_rgba(236,72,153,0.4)]',
        iconColor: 'text-pink-300',
        titleGradient: 'from-pink-200 via-white to-pink-200',
        tagText: 'text-pink-300/80',
        badgeBg: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
        badgeIcon: 'text-pink-300',
        badgeText: 'text-pink-100',
        btnIcon: 'text-pink-600',
    },
    amber: {
        gradient: 'from-amber-500/10 via-orange-500/10 to-transparent',
        orb1: 'bg-amber-500/10',
        orb2: 'bg-orange-500/10',
        iconBg: 'shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)]',
        iconColor: 'text-amber-300',
        titleGradient: 'from-amber-200 via-white to-amber-200',
        tagText: 'text-amber-300/80',
        badgeBg: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
        badgeIcon: 'text-amber-300',
        badgeText: 'text-amber-100',
        btnIcon: 'text-amber-600',
    },
    green: {
        gradient: 'from-green-500/10 via-emerald-500/10 to-transparent',
        orb1: 'bg-green-500/10',
        orb2: 'bg-emerald-500/10',
        iconBg: 'shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)]',
        iconColor: 'text-green-300',
        titleGradient: 'from-green-200 via-white to-green-200',
        tagText: 'text-green-300/80',
        badgeBg: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
        badgeIcon: 'text-green-300',
        badgeText: 'text-green-100',
        btnIcon: 'text-green-600',
    },
};

const ComingSoonModal = ({
    isOpen,
    onClose,
    title,
    description,
    icon: Icon,
    launchDate = "Coming Soon",
    accentColor = 'cyan',
}: ComingSoonModalProps) => {
    const theme = colorThemes[accentColor];

    const handleNotifyMe = () => {
        toast.success("You're on the list! 🎉", {
            description: `We'll notify you when ${title} launches.`,
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-[#0f172a]/95 backdrop-blur-3xl border-white/10 p-0 overflow-hidden shadow-2xl">
                {/* Dynamic Background Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} pointer-events-none`} />

                {/* Hero Section */}
                <div className="relative p-8 flex flex-col items-center justify-center text-center space-y-4 pt-12 overflow-hidden">
                    {/* Floating Ethereal Orbs */}
                    <div className={`absolute top-0 right-0 w-64 h-64 ${theme.orb1} rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3`} />
                    <div className={`absolute bottom-0 left-0 w-48 h-48 ${theme.orb2} rounded-full blur-[60px] pointer-events-none translate-y-1/3 -translate-x-1/3`} />

                    <div className={`relative z-10 p-4 bg-gradient-to-b from-white/10 to-white/5 rounded-full border border-white/20 ${theme.iconBg} animate-float`}>
                        <Icon className={`w-10 h-10 ${theme.iconColor}`} />
                    </div>

                    <div className="space-y-2 relative z-10">
                        <DialogTitle className={`text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${theme.titleGradient}`}>
                            {title}
                        </DialogTitle>
                        <p className={`${theme.tagText} font-medium tracking-widest uppercase text-xs`}>
                            Coming Soon
                        </p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-8 pb-8 space-y-6 relative z-10">
                    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {description}
                        </p>
                    </div>

                    {/* Launch Date Badge */}
                    <div className={`flex items-center justify-between bg-gradient-to-r ${theme.badgeBg} border rounded-xl p-4`}>
                        <div className="flex items-center gap-3">
                            <Calendar className={`w-5 h-5 ${theme.badgeIcon}`} />
                            <span className={`text-sm font-semibold ${theme.badgeText}`}>Expected Launch</span>
                        </div>
                        <span className="text-lg font-bold text-white tracking-wide">{launchDate}</span>
                    </div>

                    <Button
                        onClick={handleNotifyMe}
                        className="w-full bg-white text-black hover:bg-neutral-200 font-bold transition-all h-12 rounded-xl shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
                    >
                        <Sparkles className={`w-4 h-4 mr-2 ${theme.btnIcon}`} />
                        Notify Me
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ComingSoonModal;