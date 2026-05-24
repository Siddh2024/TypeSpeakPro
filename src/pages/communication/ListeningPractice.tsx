import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSpeech } from '@/hooks/useSpeech';
import { ArrowLeft, Play, Pause, CheckCircle, XCircle, Ear, Globe, ChevronDown, Filter, Home } from 'lucide-react';
import { toast } from 'sonner';
import { LISTENING_SCENARIOS, ListeningScenario } from '@/data/listeningScenarios';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { InlineError, SaveIndicator } from '@/components/async';
import { useAsyncState } from '@/hooks/useAsyncState';
import { logAsyncError, toUserSafeError } from '@/types/async';

const ListeningPractice = () => {
    const navigate = useNavigate();
    const { speak, isSpeaking, cancelSpeech, error: speechError } = useSpeech();
    const { user } = useAuth();
    const saveState = useAsyncState<void>();
    const lastScoreRef = React.useRef<{ correctCount: number; total: number } | null>(null);

    // Filter State
    const [selectedLevel, setSelectedLevel] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
    const [filteredScenarios, setFilteredScenarios] = useState<ListeningScenario[]>(LISTENING_SCENARIOS);
    const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0); // Index relative to FILTERED list

    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
    const [showResults, setShowResults] = useState(false);
    const [selectedAccent, setSelectedAccent] = useState('en-US');

    // Update filtered list when level changes
    useEffect(() => {
        if (selectedLevel === 'All') {
            setFilteredScenarios(LISTENING_SCENARIOS);
        } else {
            setFilteredScenarios(LISTENING_SCENARIOS.filter(s => s.level === selectedLevel));
        }
        setCurrentScenarioIndex(0); // Reset to first item of new filter
        setUserAnswers({});
        setShowResults(false);
        cancelSpeech();
    }, [selectedLevel]);

    const scenario = filteredScenarios[currentScenarioIndex];

    const handlePlay = () => {
        if (!scenario) return;
        speak(scenario.script, selectedAccent);

        const accentName =
            selectedAccent === 'en-US' ? 'US English' :
                selectedAccent === 'en-GB' ? 'UK English' :
                    selectedAccent === 'en-IN' ? 'Indian English' : 'English';

        toast.info(`Playing in ${accentName}...`);
    };

    const handleAnswer = (qIndex: number, optionIndex: number) => {
        if (showResults) return;
        setUserAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
    };

    const saveListeningScore = async (correctCount: number, total: number) => {
        lastScoreRef.current = { correctCount, total };
        if (!user?.id) return;

        saveState.setStatus('saving');
        try {
            const points = correctCount * 10;
            const { error } = await supabase.from('practice_results').insert({
                user_id: user.id,
                practice_type: 'listening',
                score: points,
                accuracy: Math.round((correctCount / total) * 100)
            });
            if (error) throw error;
            saveState.setData(undefined, 'success');
            toast.success(`Saved ${points} points!`);
        } catch (error) {
            logAsyncError('listening.saveScore', error);
            saveState.setError(toUserSafeError(error, {
                title: 'Score was not saved',
                message: 'Your answers are shown below. Retry saving when your connection is stable.',
            }));
        }
    };

    const retrySave = () => {
        if (lastScoreRef.current) {
            saveListeningScore(lastScoreRef.current.correctCount, lastScoreRef.current.total);
        }
    };

    const checkAnswers = () => {
        const answeredCount = Object.keys(userAnswers).length;
        if (answeredCount < scenario.questions.length) {
            toast.error("Please answer all questions first.");
            return;
        }

        // Calculate Score
        let correctCount = 0;
        scenario.questions.forEach((q, idx) => {
            if (userAnswers[idx] === q.answer) correctCount++;
        });

        if (correctCount === scenario.questions.length) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            toast.success("Perfect Score! 🎉");
        } else {
            toast.error("Some answers are incorrect. Check the red boxes!");
        }

        saveListeningScore(correctCount, scenario.questions.length);

        setShowResults(true);
    };

    const nextScenario = () => {
        if (currentScenarioIndex < filteredScenarios.length - 1) {
            setShowResults(false);
            setUserAnswers({});
            cancelSpeech();
            setCurrentScenarioIndex(prev => prev + 1);
        } else {
            toast.success("You've completed all scenarios in this level!");
        }
    };

    // safe check
    if (!scenario) {
        return (
            <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="mb-4">No scenarios found for this level.</p>
                    <Button onClick={() => setSelectedLevel('All')}>Show All</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-teal-500/30 flex flex-col">
            <Navbar forceOpaque={true} />

            <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
                <div className="flex gap-4 mb-8">
                    <Button
                        variant="ghost"
                        className="hover:text-teal-400 text-neutral-400 pl-0"
                        onClick={() => navigate('/voice-practice/communication')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modules
                    </Button>
                    <Button
                        variant="ghost"
                        className="hover:text-teal-400 text-neutral-400 pl-0"
                        onClick={() => navigate('/')}
                    >
                        <Home className="w-4 h-4 mr-2" /> Home
                    </Button>
                </div>

                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Level Filter Bar */}
                    <div className="flex justify-center gap-2 mb-8">
                        {(['All', 'Easy', 'Medium', 'Hard'] as const).map(level => (
                            <button
                                key={level}
                                onClick={() => setSelectedLevel(level)}
                                className={`
                                    px-4 py-2 rounded-full border transition-all text-sm font-medium
                                    ${selectedLevel === level
                                        ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20'
                                        : 'bg-neutral-900 text-neutral-400 border-white/10 hover:bg-white/5'}
                                `}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    {/* Audio Player Card */}
                    <Card className="bg-neutral-900/50 border-white/5">
                        <CardHeader>
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <Ear className="w-6 h-6 text-teal-400" />
                                    {scenario.title}
                                    <span className={`text-xs px-2 py-0.5 rounded border border-white/10 ${scenario.level === 'Easy' ? 'text-green-400 bg-green-500/10' :
                                        scenario.level === 'Medium' ? 'text-yellow-400 bg-yellow-500/10' :
                                            'text-red-400 bg-red-500/10'
                                        }`}>
                                        {scenario.level}
                                    </span>
                                </CardTitle>

                                <div className="flex items-center gap-3">
                                    <Globe className="w-4 h-4 text-neutral-400" />
                                    <select
                                        value={selectedAccent}
                                        onChange={(e) => setSelectedAccent(e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-sm text-neutral-200 focus:outline-none focus:border-teal-500"
                                    >
                                        <option value="en-US">🇺🇸 US English</option>
                                        <option value="en-GB">🇬🇧 UK English</option>
                                        <option value="en-IN">🇮🇳 Indian English</option>
                                    </select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center py-8">
                            <div className="w-32 h-32 rounded-full bg-teal-500/10 flex items-center justify-center mb-6 relative">
                                {isSpeaking && (
                                    <div className="absolute inset-0 rounded-full border-4 border-teal-500/30 animate-ping"></div>
                                )}
                                <Button
                                    size="icon"
                                    className="w-16 h-16 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-lg z-10"
                                    onClick={isSpeaking ? cancelSpeech : handlePlay}
                                    aria-label={isSpeaking ? 'Pause listening scenario' : 'Play listening scenario'}
                                >
                                    {isSpeaking ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                                </Button>
                            </div>
                            <p className="text-neutral-400 text-sm">Click play to listen to the scenario.</p>
                            <p className="text-neutral-500 text-xs mt-2">{filteredScenarios.length} scenarios in this list</p>
                            <InlineError error={speechError} onRetry={handlePlay} className="mt-4 w-full max-w-md" />
                        </CardContent>
                    </Card>

                    {/* Quiz Section */}
                    <div className="space-y-6">
                        {scenario.questions.map((q, qIndex) => (
                            <Card key={qIndex} className="bg-neutral-900/50 border-white/5">
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-lg mb-4">{qIndex + 1}. {q.q}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {q.options.map((opt, optIndex) => {
                                            const isSelected = userAnswers[qIndex] === optIndex;
                                            const isCorrect = q.answer === optIndex;

                                            let cardStyle = "border-white/10 hover:bg-white/5";
                                            let animation = "";

                                            if (showResults) {
                                                if (isCorrect) cardStyle = "border-green-500 bg-green-500/10 text-green-400";
                                                else if (isSelected && !isCorrect) {
                                                    cardStyle = "border-red-500 bg-red-500/10 text-red-400";
                                                    animation = "animate-[shake_0.5s_ease-in-out]";
                                                }
                                                else if (!isSelected) cardStyle = "opacity-50 border-white/5"; // Dim others
                                            } else if (isSelected) {
                                                cardStyle = "border-teal-500 bg-teal-500/10 text-teal-400";
                                            }

                                            return (
                                                <button
                                                    type="button"
                                                    key={optIndex}
                                                    onClick={() => handleAnswer(qIndex, optIndex)}
                                                    disabled={showResults}
                                                    className={`
                                                        p-4 rounded-lg border cursor-pointer transition-all flex justify-between items-center text-left disabled:cursor-default
                                                        ${cardStyle} ${animation}
                                                    `}
                                                >
                                                    {opt}
                                                    {showResults && isCorrect && <CheckCircle className="w-4 h-4 text-green-500" />}
                                                    {showResults && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Footer Controls */}
                    <div className="flex justify-end gap-4">
                        <SaveIndicator status={saveState.status} />
                        <InlineError error={saveState.error} onRetry={retrySave} />
                        {!showResults ? (
                            <Button size="lg" onClick={checkAnswers} className="bg-teal-600 hover:bg-teal-700">
                                Check Answers
                            </Button>
                        ) : (
                            <Button size="lg" onClick={nextScenario} variant="outline" className="border-teal-500/50 text-teal-400 hover:bg-teal-500/10">
                                Next Scenario
                            </Button>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ListeningPractice;
