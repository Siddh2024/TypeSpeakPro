import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Keyboard, Mic, Play, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();
  const [typedText, setTypedText] = useState('');
  const fullText = 'Master Typing Speed & Communication';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(186_100%_50%/0.1)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(280_100%_65%/0.08)_0%,transparent_50%)]" />

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-accent/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">Typing + Communication in One Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight" style={{ animationDelay: '0.1s' }}>
            <span className="font-mono text-primary">{typedText}</span>
            <span className="typing-cursor"/>
            <br />
            <span className="text-foreground">in One Platform</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Practice typing accuracy and spoken communication with real-time feedback — built for interviews, placements, and professionals.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl" className="group" onClick={() => navigate('/practice')}>
              <Keyboard className="w-5 h-5" />
              Start Free Test
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="heroOutline" size="xl" className="group" onClick={() => navigate('/voice-practice')}>
              <Mic className="w-5 h-5" />
              Try Voice Practice
            </Button>
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="glass rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-orange-accent/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
                <div className="flex-1" />
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">WPM:</span>
                    <span className="text-primary font-mono font-bold text-lg">72</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Accuracy:</span>
                    <span className="text-success font-mono font-bold text-lg">98%</span>
                  </div>
                </div>
              </div>

              {/* Typing Preview */}
              <div className="font-mono text-left text-lg md:text-xl leading-relaxed mb-6">
                <span className="text-success">The quick brown fox jumps over the lazy</span>
                <span className="text-foreground"> dog</span>
                <span className="typing-cursor" />
              </div>

              {/* Keyboard Hint */}
              <div className="flex justify-center gap-1">
                {['T', 'y', 'p', 'e'].map((key, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      }`}
                  >
                    {key}
                  </div>
                ))}
                <div className="w-24 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground text-xs">
                  Space
                </div>
              </div>
            </div>

            {/* Floating Stats */}
            <div className="absolute -left-4 md:-left-16 top-1/2 -translate-y-1/2 glass rounded-xl p-4 animate-float hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Play className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sessions Today</p>
                  <p className="text-lg font-bold text-foreground">2,847</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 md:-right-16 top-1/3 glass rounded-xl p-4 animate-float hidden md:block" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Voice Score</p>
                  <p className="text-lg font-bold text-foreground">94%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <span className="text-xs text-muted-foreground">Scroll to explore</span>
        <div className="w-6 h-10 rounded-full border-2 border-border flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
