import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap, FileText, ClipboardCheck, Rocket, CircleCheck } from "lucide-react";

// Self-hosted hero background video
const HERO_VIDEOS = [
  {
    label: "Data & Analytics",
    src: "/hero-background.mp4",
  },
];

const ROTATION_MS = 7000;

const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % HERO_VIDEOS.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-hero">
      {/* Rotating animated video background */}
      <div className="absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.video
            key={HERO_VIDEOS[activeIndex].src}
            src={HERO_VIDEOS[activeIndex].src}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            onEnded={(e) => {
              const v = e.currentTarget;
              v.currentTime = 0;
              v.play().catch(() => {});
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>

      {/* Minimal overlay — keeps text legible while letting the video shine through */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/40" />

      <div className="container mx-auto px-4 relative z-10 pt-24 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-8"
          >
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-primary-foreground/80">
              Built for Government & Enterprise Teams
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6"
          >
            <span className="text-primary-foreground">Win Contracts. Deliver Projects. </span>
            <span className="text-gradient-accent">No Experts Required.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-primary-foreground mb-10 max-w-2xl mx-auto leading-relaxed font-medium [text-shadow:_0_2px_12px_rgb(0_0_0_/_0.6)]"
          >
            One AI-powered platform to write winning proposals, evaluate RFPs, and deliver
            AI/ML, analytics, cybersecurity, and cloud projects — without the steep learning
            curve or stack of expensive subscriptions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/signup">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-1" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="hero-outline" size="xl" className="w-full sm:w-auto text-primary-foreground/80 border-primary-foreground/20 hover:border-primary-foreground/40 hover:bg-primary-foreground/5 backdrop-blur-sm">
                See How It Works
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-primary-foreground/50"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              <span>Proposal Writing</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-accent" />
              <span>RFP Evaluation</span>
            </div>
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-accent" />
              <span>Project Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <CircleCheck className="w-4 h-4 text-accent" />
              <span>No Credit Card Required</span>
            </div>
          </motion.div>

          {/* Tiny domain indicator showing the active video category */}
          {HERO_VIDEOS.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-10 flex items-center justify-center gap-2"
            >
              {HERO_VIDEOS.map((v, i) => (
                <button
                  key={v.label}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Show ${v.label} background`}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === activeIndex
                      ? "w-8 bg-accent"
                      : "w-1.5 bg-primary-foreground/30 hover:bg-primary-foreground/50"
                  }`}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
