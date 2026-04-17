import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRight, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

// ---------------------------------------------------------------------------
// Free stock videos from Pexels (royalty-free, no attribution required).
// To swap a video: update the `src` field with a direct .mp4 URL.
// ---------------------------------------------------------------------------
const HERO_VIDEOS = [
  {
    id: "cyber",
    label: "Cybersecurity",
    src: "https://videos.pexels.com/video-files/5473337/5473337-hd_1920_1080_25fps.mp4",
  },
  {
    id: "ai",
    label: "AI & Machine Learning",
    src: "https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4",
  },
  {
    id: "enterprise",
    label: "Enterprise",
    src: "https://videos.pexels.com/video-files/3255788/3255788-hd_1920_1080_25fps.mp4",
  },
  {
    id: "government",
    label: "Government",
    src: "https://videos.pexels.com/video-files/1434604/1434604-hd_1920_1080_25fps.mp4",
  },
  {
    id: "cloud",
    label: "Cloud & Data",
    src: "https://videos.pexels.com/video-files/2169880/2169880-hd_1920_1080_25fps.mp4",
  },
  {
    id: "analytics",
    label: "Analytics",
    src: "https://videos.pexels.com/video-files/3679433/3679433-hd_1920_1080_25fps.mp4",
  },
];

const SLIDE_DURATION = 8000; // ms per video
const FADE_DURATION  = 1200; // ms crossfade

const HeroSection = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filtered list excludes videos that failed to load
  const validVideos = HERO_VIDEOS.filter((v) => !failedIds.has(v.id));

  const advance = () => {
    setActiveIdx((prev) => (prev + 1) % (validVideos.length || 1));
  };

  // Auto-advance timer
  useEffect(() => {
    if (validVideos.length <= 1) return;
    timerRef.current = setInterval(advance, SLIDE_DURATION);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validVideos.length]);

  // Play the active video, pause others
  useEffect(() => {
    videoRefs.current.forEach((el, i) => {
      if (!el) return;
      if (i === activeIdx) {
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }, [activeIdx]);

  const handleError = (id: string) => {
    setFailedIds((prev) => new Set([...prev, id]));
  };

  const currentVideo = validVideos[activeIdx] ?? null;

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-hero">

      {/* ── Video layers ─────────────────────────────────────────────────── */}
      {HERO_VIDEOS.map((video, i) => (
        <video
          key={video.id}
          ref={(el) => { videoRefs.current[i] = el; }}
          src={video.src}
          muted
          playsInline
          loop
          preload="metadata"
          onError={() => handleError(video.id)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: i === activeIdx ? 1 : 0,
            transition: `opacity ${FADE_DURATION}ms ease-in-out`,
            zIndex: i === activeIdx ? 1 : 0,
          }}
        />
      ))}

      {/* Fallback image (visible until first video plays) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.35,
          zIndex: 0,
        }}
      />

      {/* Dark scrim for text legibility */}
      <div className="absolute inset-0 bg-black/55" style={{ zIndex: 2 }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" style={{ zIndex: 3 }} />

      {/* ── Theme label badge ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {currentVideo && (
          <motion.div
            key={currentVideo.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2"
            style={{ zIndex: 10 }}
          >
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {validVideos.map((v, i) => (
                <button
                  key={v.id}
                  aria-label={v.label}
                  onClick={() => setActiveIdx(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === activeIdx ? 20 : 6,
                    height: 6,
                    background: i === activeIdx ? "white" : "rgba(255,255,255,0.35)",
                  }}
                />
              ))}
            </div>
            <span className="ml-2 text-xs font-semibold text-white/70 tracking-widest uppercase">
              {currentVideo.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero content ─────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 relative pt-24 pb-16" style={{ zIndex: 10 }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8"
          >
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-primary-foreground/80">
              Built for Government &amp; Enterprise Teams
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6"
          >
            <span className="text-primary-foreground">Win Contracts.</span>
            <br />
            <span className="text-gradient-accent">Deliver Projects.</span>
            <br />
            <span className="text-primary-foreground">No Experts Required.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-primary-foreground/60 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Write winning technical proposals for AI, cloud &amp; cybersecurity projects, evaluate RFPs
            in minutes, and manage your delivery from backlog to launch — without a steep learning
            curve or a dozen expensive subscriptions.
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
              <Button
                variant="hero-outline"
                size="xl"
                className="w-full sm:w-auto text-primary-foreground/80 border-primary-foreground/20 hover:border-primary-foreground/40 hover:bg-primary-foreground/5"
              >
                See How It Works
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/40"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span>Proposal Writing</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span>RFP Evaluation</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span>Project Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span>No Credit Card Required</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
