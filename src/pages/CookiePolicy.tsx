import { ArrowLeft, Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CookiePolicy = () => {
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
                        <Cookie className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Cookie <span className="gradient-text">Policy</span>
                    </h1>
                    <p className="text-muted-foreground">
                        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                <div className="prose prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">1. What Are Cookies</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Cookies are small text files that are placed on your device when you visit a website. They help us provide you with a better browsing experience by remembering your preferences and analyzing how you use our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Types of Cookies We Use</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-foreground">Essential Cookies</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    These cookies are necessary for the website to function properly. They enable basic features like authentication and session management.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-foreground">Performance Cookies</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    These cookies help us understand how visitors interact with our platform by collecting and reporting information anonymously.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-foreground">Preference Cookies</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    These cookies allow our website to remember choices you make (like theme preferences) and provide enhanced features.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Cookies</h2>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                            <li>To authenticate users and prevent fraudulent use</li>
                            <li>To remember your preferences and settings</li>
                            <li>To analyze usage patterns and improve our services</li>
                            <li>To provide personalized content and features</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Managing Cookies</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Most web browsers allow you to control cookies through their settings. You can:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                            <li>Block all cookies</li>
                            <li>Allow only first-party cookies</li>
                            <li>Delete cookies when you close your browser</li>
                            <li>Receive notifications when cookies are set</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Please note that disabling cookies may affect the functionality of our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Third-Party Cookies</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may use third-party services (like Google OAuth) that set their own cookies. We do not control these cookies, and you should review the respective privacy policies of these services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Updates to This Policy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have questions about our use of cookies, please contact us through our official channels.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CookiePolicy;