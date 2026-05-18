import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mic, MessageSquare, Briefcase, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const VoicePractice = () => {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-teal-500/30 flex flex-col">
            <Navbar forceOpaque={true} />

            <main className="flex-1 container mx-auto px-4 pt-32 pb-20">

                {/* Hero Section */}
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-6 fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4 animate-in fade-in slide-in-from-bottom-4">
                        <Mic className="w-4 h-4" />
                        <span className="text-sm font-medium">Speak with Confidence</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-5">
                        Master Your <span className="gradient-text">Voice</span>
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-6">
                        Elevate your communication skills through interactive voice exercises.
                        Choose a module below to start practicing verbal fluency, impromptu speaking, and professional interviews.
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl mx-auto">

                    {/* Communication Practice */}
                    <Card className="bg-card border-border hover:border-teal-500/30 transition-all duration-300 group hover:-translate-y-1">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-colors">
                                <MessageSquare className="w-6 h-6 text-teal-400" />
                            </div>
                            <CardTitle className="text-xl text-foreground group-hover:text-teal-400 transition-colors">Communication Practice</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Enhance your daily conversational skills and articulation clarity.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>Active Listening</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>Concise Speaking</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>Tone Control</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full bg-muted hover:bg-muted/80 text-foreground border border-border group-hover:border-teal-500/30"
                                onClick={() => window.location.href = '/voice-practice/communication'}
                            >
                                Start Practice <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* HR Preparation */}
                    <Card className="bg-card border-border hover:border-blue-500/30 transition-all duration-300 group hover:-translate-y-1">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                                <Briefcase className="w-6 h-6 text-blue-400" />
                            </div>
                            <CardTitle className="text-xl text-foreground group-hover:text-blue-400 transition-colors">HR Preparation</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Simulate job interviews and prepare confident answers for common questions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>Mock Interviews</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>STAR Method</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>Salary Negotiation</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full bg-muted hover:bg-muted/80 text-foreground border border-border group-hover:border-blue-500/30"
                                onClick={() => window.location.href = '/voice-practice/hr'}
                            >
                                Start Practice <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardFooter>
                    </Card>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default VoicePractice;
