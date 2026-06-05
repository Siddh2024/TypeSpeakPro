import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, TrendingDown, Minus, Target, Zap, ArrowLeft, Keyboard, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { analyzePerformance, CoachInsights, CharErrors } from '@/lib/adaptiveCoach';
import { cn } from '@/lib/utils';

// ── Keyboard heatmap ──────────────────────────────────────────────────────────
const KEYBOARD_ROWS = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m'],
];

const KeyHeatmap = ({ errors }: { errors: CharErrors }) => {
    const maxErr = Math.max(1, ...Object.values(errors));

    const getColor = (key: string) => {
        const count = errors[key] || 0;
        if (count === 0) return 'bg-muted text-muted-foreground';
        const intensity = count / maxErr;
        if (intensity > 0.66) return 'bg-red-500 text-white';
        if (intensity > 0.33) return 'bg-orange-400 text-white';
        return 'bg-yellow-400 text-black';
    };

    return (
        <div className="space-y-2">
            {KEYBOARD_ROWS.map((row, ri) => (
                <div key={ri} className="flex gap-1.5 justify-center">
                    {row.map(key => (
                        <div
                            key={key}
                            title={errors[key] ? `${errors[key]} error${errors[key] > 1 ? 's' : ''}` : 'No errors'}
                            className={cn(
                                'w-9 h-9 rounded-md flex items-center justify-center text-xs font-bold uppercase border border-border transition-colors',
                                getColor(key)
                            )}
                        >
                            {key}
                        </div>
                    ))}
                </div>
            ))}
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted border border-border inline-block" /> No errors</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Low</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400 inline-block" /> Medium</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> High</span>
            </div>
        </div>
    );
};

// ── Trend icon ────────────────────────────────────────────────────────────────
const TrendIcon = ({ trend }: { trend: 'improving' | 'declining' | 'stable' }) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
};

const trendLabel = (t: 'improving' | 'declining' | 'stable') =>
    t === 'improving' ? 'Improving' : t === 'declining' ? 'Declining' : 'Stable';

const trendColor = (t: 'improving' | 'declining' | 'stable') =>
    t === 'improving' ? 'text-green-400' : t === 'declining' ? 'text-red-400' : 'text-muted-foreground';

// ── Main page ─────────────────────────────────────────────────────────────────
const AdaptiveCoach = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [insights, setInsights] = useState<CoachInsights | null>(null);
    const [mergedErrors, setMergedErrors] = useState<CharErrors>({});
    const [loading, setLoading] = useState(true);
    const [sessionCount, setSessionCount] = useState(0);

    const loadInsights = useCallback(async () => {
        setLoading(true);
        try {
            if (!user?.id) {
                // Guest: show empty state with demo insights
                setInsights(analyzePerformance([]));
                setLoading(false);
                return;
            }

            // Fetch last 10 analytics rows for this user
            const { data, error } = await supabase
                .from('typing_analytics')
                .select('char_errors, slow_keys, wpm, accuracy')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            const sessions = (data || []).map((row: any) => ({
                wpm: row.wpm ?? 0,
                accuracy: row.accuracy ?? 0,
                charErrors: (row.char_errors as CharErrors) ?? {},
                slowKeys: (row.slow_keys as Record<string, number>) ?? {},
            }));

            setSessionCount(sessions.length);

            // Merge all char errors for heatmap
            const merged: CharErrors = {};
            sessions.forEach(s => {
                Object.entries(s.charErrors).forEach(([k, v]) => {
                    merged[k] = (merged[k] || 0) + v;
                });
            });
            setMergedErrors(merged);

            setInsights(analyzePerformance(sessions));
        } catch (err) {
            console.error('AdaptiveCoach load error:', err);
            setInsights(analyzePerformance([]));
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadInsights();
    }, [loadInsights]);

    const difficultyColor = (d: string) =>
        d === 'easy' ? 'text-green-400' : d === 'hard' ? 'text-red-400' : 'text-yellow-400';

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-teal-500/30">
            <Navbar forceOpaque />

            <div className="max-w-5xl mx-auto px-4 pt-28 pb-16 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-2">
                    <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-teal-400" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
                    </Button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                        <Brain className="w-7 h-7 text-teal-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Adaptive Coach</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            Personalized insights from your last {sessionCount > 0 ? sessionCount : '—'} session{sessionCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="h-32 rounded-2xl bg-card border border-border animate-pulse" />
                        ))}
                    </div>
                ) : insights ? (
                    <>
                        {/* No data banner */}
                        {sessionCount === 0 && (
                            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                                Complete at least one typing test to unlock personalized coaching. Showing default recommendations for now.
                            </div>
                        )}

                        {/* Tip card */}
                        <Card className="bg-teal-500/5 border-teal-500/20">
                            <CardContent className="p-5 flex items-start gap-4">
                                <Target className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" />
                                <p className="text-sm leading-relaxed text-foreground">{insights.tip}</p>
                            </CardContent>
                        </Card>

                        {/* Trend + Difficulty row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="bg-card border-border">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Speed Trend</CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center gap-2">
                                    <TrendIcon trend={insights.speedTrend} />
                                    <span className={cn('font-bold', trendColor(insights.speedTrend))}>
                                        {trendLabel(insights.speedTrend)}
                                    </span>
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-border">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Accuracy Trend</CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center gap-2">
                                    <TrendIcon trend={insights.accuracyTrend} />
                                    <span className={cn('font-bold', trendColor(insights.accuracyTrend))}>
                                        {trendLabel(insights.accuracyTrend)}
                                    </span>
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-border">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Recommended Level</CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-yellow-400" />
                                    <span className={cn('font-bold capitalize', difficultyColor(insights.recommendedDifficulty))}>
                                        {insights.recommendedDifficulty}
                                    </span>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Weak keys */}
                        {insights.weakKeys.length > 0 && (
                            <Card className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Keyboard className="w-4 h-4 text-red-400" /> Most Mistyped Keys
                                    </CardTitle>
                                    <CardDescription>Keys you miss most often across recent sessions</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                    {insights.weakKeys.map((key, i) => (
                                        <span
                                            key={key}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg font-mono font-bold text-sm border',
                                                i === 0 ? 'bg-red-500/15 border-red-500/40 text-red-400' :
                                                i === 1 ? 'bg-orange-500/15 border-orange-500/40 text-orange-400' :
                                                'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                                            )}
                                        >
                                            {key}
                                            <span className="ml-1.5 text-xs opacity-60">
                                                {mergedErrors[key] || 0}×
                                            </span>
                                        </span>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Hesitation keys */}
                        {insights.slowKeys.length > 0 && (
                            <Card className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-orange-400" /> Hesitation Keys
                                    </CardTitle>
                                    <CardDescription>Keys where you pause the longest before typing — muscle memory gaps</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                    {insights.slowKeys.map((key) => (
                                        <span
                                            key={key}
                                            className="px-3 py-1.5 rounded-lg font-mono font-bold text-sm border bg-orange-500/10 border-orange-500/30 text-orange-400"
                                        >
                                            {key}
                                            <span className="ml-1.5 text-xs opacity-60">slow</span>
                                        </span>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Heatmap */}
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-base">Keyboard Error Heatmap</CardTitle>
                                <CardDescription>Color intensity shows how often you mistype each key</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <KeyHeatmap errors={mergedErrors} />
                            </CardContent>
                        </Card>

                        {/* Focus drill */}
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Target className="w-4 h-4 text-teal-400" /> Personalized Drill
                                </CardTitle>
                                <CardDescription>
                                    This text is generated to target your weak keys. Practice it in the typing test.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-xl bg-muted border border-border font-mono text-sm leading-relaxed text-foreground select-all">
                                    {insights.focusDrill}
                                </div>
                                <Button
                                    className="bg-teal-600 hover:bg-teal-700 text-white"
                                    onClick={() => navigate('/practice')}
                                >
                                    Go to Typing Test <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </CardContent>
                        </Card>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default AdaptiveCoach;
