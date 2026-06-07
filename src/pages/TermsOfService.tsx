import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-background py-16 px-4">
            <div className="container mx-auto max-w-4xl">
                <Link to="/">
                    <Button variant="ghost" className="mb-8 hover:bg-primary/10">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </Link>

                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Terms of <span className="gradient-text">Service</span>
                    </h1>
                    <p className="text-muted-foreground">
                        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                <div className="prose prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing and using TypeSpeak Pro, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Use of Service</h2>
                        <p className="text-muted-foreground leading-relaxed mb-3">
                            TypeSpeak Pro provides typing practice, voice communication training, and related educational services. You agree to:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                            <li>Use the service for lawful purposes only</li>
                            <li>Not attempt to circumvent any security features</li>
                            <li>Not use the service to harm others or the platform</li>
                            <li>Respect intellectual property rights</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">3. User Accounts</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Intellectual Property</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            All content, features, and functionality of TypeSpeak Pro are owned by us or our licensors and are protected by international copyright, trademark, and other intellectual property laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            TypeSpeak Pro is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Modifications</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to modify or discontinue the service at any time, with or without notice. We are not liable to you or any third party for any modification, suspension, or discontinuation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Governing Law</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            These terms shall be governed and construed in accordance with applicable laws, without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Contact</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            For any questions regarding these Terms of Service, please reach out to us through our official channels.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;