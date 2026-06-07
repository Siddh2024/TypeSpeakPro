import { useState } from 'react';
import { Github, Linkedin, Twitter, DollarSign, BookOpen, HelpCircle, MessageCircleQuestion, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import ComingSoonModal from './modals/ComingSoonModal';

interface ComingSoonConfig {
    title: string;
    description: string;
    icon: typeof DollarSign;
    accentColor: 'cyan' | 'purple' | 'pink' | 'amber' | 'green';
    launchDate: string;
}

const Footer = () => {
    const [activeModal, setActiveModal] = useState<string | null>(null);

    // Coming Soon Configurations
    const comingSoonConfigs: Record<string, ComingSoonConfig> = {
        Pricing: {
            title: 'Premium Pricing',
            description: 'Unlock advanced features, unlimited practice sessions, and exclusive content with our upcoming Premium plans. Stay tuned!',
            icon: DollarSign,
            accentColor: 'green',
            launchDate: 'Coming Soon',
        },
        Blog: {
            title: 'TypeSpeak Blog',
            description: 'Tips, tutorials, and insights to help you master typing and communication skills. Our blog launches with weekly content!',
            icon: BookOpen,
            accentColor: 'purple',
            launchDate: 'Coming Soon',
        },
        'Help Center': {
            title: 'Help Center',
            description: 'A comprehensive support hub with guides, troubleshooting, and direct assistance from our team. Coming soon to help you succeed.',
            icon: HelpCircle,
            accentColor: 'cyan',
            launchDate: 'Coming Soon',
        },
        FAQs: {
            title: 'Frequently Asked Questions',
            description: 'Quick answers to common questions about TypeSpeak Pro. We\'re compiling the most helpful FAQs for you.',
            icon: MessageCircleQuestion,
            accentColor: 'amber',
            launchDate: 'Coming Soon',
        },
        Tutorials: {
            title: 'Video Tutorials',
            description: 'Step-by-step video guides to help you maximize your learning experience. Get ready for our extensive tutorial library.',
            icon: GraduationCap,
            accentColor: 'pink',
            launchDate: 'Coming Soon',
        },
    };

    // Quick Links - Mix of working routes and coming soon
    const quickLinks = [
        { label: 'Typing Test', to: '/practice', type: 'route' as const },
        { label: 'Voice Practice', to: '/voice-practice', type: 'route' as const },
        { label: 'Dashboard', to: '/dashboard', type: 'route' as const },
        { label: 'Pricing', to: '', type: 'modal' as const },
    ];

    // Resources - All coming soon
    const resources = [
        { label: 'Blog', to: '', type: 'modal' as const },
        { label: 'Help Center', to: '', type: 'modal' as const },
        { label: 'FAQs', to: '', type: 'modal' as const },
        { label: 'Tutorials', to: '', type: 'modal' as const },
    ];

    // Legal - Real pages
    const legal = [
        { label: 'Privacy Policy', to: '/privacy-policy', type: 'route' as const },
        { label: 'Terms of Service', to: '/terms-of-service', type: 'route' as const },
        { label: 'Cookie Policy', to: '/cookie-policy', type: 'route' as const },
    ];

    const renderLink = (link: { label: string; to: string; type: 'route' | 'modal' }) => {
        if (link.type === 'route') {
            return (
                <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                    {link.label}
                </Link>
            );
        }
        return (
            <button
                onClick={() => setActiveModal(link.label)}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm text-left"
            >
                {link.label}
            </button>
        );
    };

    const currentConfig = activeModal ? comingSoonConfigs[activeModal] : null;

    return (
        <>
            <footer className="bg-secondary/30 border-t border-border">
                <div className="container mx-auto px-4 py-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        {/* Brand */}
                        <div className="col-span-2 lg:col-span-2">
                            <Link to="/" className="flex items-center gap-2 mb-4">
                                <div className="relative">
                                    <img src="logo.jpg" alt="logo" className="h-20 w-20 object-contain rounded" />
                                </div>
                                <span className="text-xl font-bold">
                                    <span className="text-foreground">Type</span>
                                    <span className="gradient-text">Speak</span>
                                    <span className="text-muted-foreground font-medium"> Pro</span>
                                </span>
                            </Link>
                            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
                                The all-in-one platform to improve your typing speed and communication skills for interviews, placements, and professional growth.
                            </p>

                            {/* Social Links */}
                            <div className="flex gap-3">
                                <a
                                    href="https://github.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
                                    aria-label="GitHub"
                                >
                                    <Github className="w-5 h-5" />
                                </a>
                                <a
                                    href="https://linkedin.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
                                    aria-label="LinkedIn"
                                >
                                    <Linkedin className="w-5 h-5" />
                                </a>
                                <a
                                    href="https://twitter.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
                                    aria-label="Twitter"
                                >
                                    <Twitter className="w-5 h-5" />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
                            <ul className="space-y-3">
                                {quickLinks.map((link) => (
                                    <li key={link.label}>{renderLink(link)}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Resources */}
                        <div>
                            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
                            <ul className="space-y-3">
                                {resources.map((link) => (
                                    <li key={link.label}>{renderLink(link)}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                            <ul className="space-y-3">
                                {legal.map((link) => (
                                    <li key={link.label}>{renderLink(link)}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="mt-16 pt-8 border-t border-border flex flex-col items-center justify-center gap-4 text-center">
                        <p className="text-muted-foreground text-sm">
                            2026 TypeSpeak Pro. All rights reserved.
                        </p>
                        <p className="text-muted-foreground text-sm">
                            Made with ❤️ Sufal
                        </p>
                    </div>
                </div>
            </footer>

            {/* Coming Soon Modal */}
            {currentConfig && (
                <ComingSoonModal
                    isOpen={!!activeModal}
                    onClose={() => setActiveModal(null)}
                    title={currentConfig.title}
                    description={currentConfig.description}
                    icon={currentConfig.icon}
                    accentColor={currentConfig.accentColor}
                    launchDate={currentConfig.launchDate}
                />
            )}
        </>
    );
};

export default Footer;