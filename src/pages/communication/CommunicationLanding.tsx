import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mic, Ear, BookOpen, PenTool, Sparkles, ChevronRight } from 'lucide-react';

const CommunicationLanding = () => {
    const navigate = useNavigate();

    const modules = [
        {
            id: 'speaking',
            title: 'Speaking Practice',
            description: 'AI conversation partner, role-play scenarios, and daily topics.',
            icon: Mic,
            iconColor: 'text-teal-600 dark:text-teal-400',
            hoverColor: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
            bg: 'bg-teal-500/10',
            border: 'hover:border-teal-200 dark:hover:border-teal-500/30',
            path: '/voice-practice/communication/speaking'
        },
        {
            id: 'listening',
            title: 'Listening Practice',
            description: 'Accent training, audio comprehension, and MCQ challenges.',
            icon: Ear,
            iconColor: 'text-blue-600 dark:text-blue-400',
            hoverColor: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'hover:border-blue-200 dark:hover:border-blue-500/30',
            path: '/voice-practice/communication/listening'
        },
        {
            id: 'reading',
            title: 'Reading Practice',
            description: 'Read aloud with real-time pronunciation and accuracy feedback.',
            icon: BookOpen,
            iconColor: 'text-purple-600 dark:text-purple-400',
            hoverColor: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'hover:border-purple-200 dark:hover:border-purple-500/30',
            path: '/voice-practice/communication/reading'
        },
        {
            id: 'writing',
            title: 'Writing Practice',
            description: 'Enhance grammar and style with AI-powered correction.',
            icon: PenTool,
            iconColor: 'text-pink-600 dark:text-pink-400',
            hoverColor: 'group-hover:text-pink-600 dark:group-hover:text-pink-400',
            bg: 'bg-pink-500/10',
            border: 'hover:border-pink-200 dark:hover:border-pink-500/30',
            path: '/voice-practice/communication/writing'
        }
    ];

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-teal-500/30 flex flex-col">
            <Navbar forceOpaque={true} />

            <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
                <Button
                    variant="ghost"
                    className="mb-8 hover:text-teal-600 dark:hover:text-teal-400 text-neutral-500 dark:text-neutral-400 pl-0"
                    onClick={() => navigate('/voice-practice')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Voice Practice
                </Button>

                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">Comprehensive Training</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold font-heading">
                            Communication Mastery
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                            Develop holistic language skills through our four-pillar approach.
                            Interact with AI, receive instant feedback, and track your progress.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {modules.map((module) => (
                            <Card
                                key={module.id}
                                className={`bg-white dark:bg-neutral-900/50 text-neutral-900 dark:text-white border-neutral-200 dark:border-white/5 transition-all duration-300 group hover:-translate-y-1 hover:shadow-md dark:hover:shadow-none ${module.border}`}
                            >
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${module.bg}`}>
                                        <module.icon className={`w-6 h-6 ${module.iconColor}`} />
                                    </div>
                                    <CardTitle className={`text-2xl text-neutral-900 dark:text-white ${module.hoverColor} transition-colors`}>
                                        {module.title}
                                    </CardTitle>
                                    <CardDescription className="text-neutral-600 dark:text-neutral-400 text-base">
                                        {module.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-200 group-hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:border-white/5 dark:group-hover:bg-white/10"
                                        onClick={() => navigate(module.path)}
                                    >
                                        Start Practice <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CommunicationLanding;
