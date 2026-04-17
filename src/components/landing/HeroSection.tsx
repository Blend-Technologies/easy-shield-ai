import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRight, Zap } from "lucide-react";

// ---------------------------------------------------------------------------
// Each slide has a gradient palette + optional video URL.
// Drop a direct .mp4 URL into `videoSrc` to enable video for that slide.
// ---------------------------------------------------------------------------
const SLIDES = [
  {
    id: "cyber",
    label: "Cybersecurity",
    from: "#020b18",
    via: "#04233d",
    to: "#01111f",
    accent: "#00d4ff",
    videoSrc: "",
  },
  {
    id: "ai",
    label: "AI & Machine Learning",
    from: "#0d0221",
    via: "#1e0b4a",
    to: "#080118",
    accent: "#a855f7",
    videoSrc: "",
  },
  {
    id: "enterprise",
    label: "Enterprise",
    from: "#0d0d0d",
    via: "#1c1c1c",
    to: "#111111",
    accent: "#f59e0b",
    videoSrc: "",
  },
  {
    id: "government",
    label: "Government",
    from: "#070d1a",
    via: "#1a0a0a",
    to: "#0a0a0a",
    accent: "#ef4444",
    videoSrc: "",
  },
  {
    id: "cloud",
    label: "Cloud & Data",
    from: "#021208",
    via: "#062b1a",
    to: "#010d0a",
    accent: "#10b981",
    videoSrc: "",
  },
  {
    id: "analytics",
    label: "Analytics",
    from: "#0d0a00",
    via: "#1f1400",
    to: "#0a0800",
    accent: "#f97316",
    videoSrc: "",
  },
];

const SLIDE_DURATION = 7000;  // ms each slide stays visible
const FADE_DURATION  = 1500;  // ms crossfade

// Tiny reusable animated grid overlay (pure CSS, no assets needed)
const GridOverlay = () => (
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
      `,
      backgroundSize: "60px 60px",
      zIndex: 4,
    }}
  />
);

// Glowing orb that tracks the current accent colour
const GlowOrb = ({ color }: { color: string }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      top: "10%",
      left: "55%",
      width: 600,
      height: 600,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
      filter: "blur(60px)",
      transition: `background ${FADE_DURATION}ms ease`,
      zIndex: 3,
    }}
  />
);

const HeroSection = () => {
  const [activeIdx, setActiveIdx]     = useState(0);
  const [videoFailed, setVideoFailed] = useState<Record<string, boolean>>({});
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = SLIDES[activeIdx];

  // Auto-advance
  useEffect(() => {
    timerRef.current = setInterval(
      () => setActiveIdx((i) => (i + 1) % SLIDES.length),
      SLIDE_DURATION
    );
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Play active video, pause others
  useEffect(() => {
    videoRefs.current.forEach((el, i) => {
      if (!el) return;
      i === activeIdx ? el.play().catch(() => {}) : el.pause();
    });
  }, [activeIdx]);

  const jumpTo = (i: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveIdx(i);
    timerRef.current = setInterval(
      () => setActiveIdx((idx) => (idx + 1) % SLIDES.length),
      SLIDE_DURATION
    );
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">

      {/* ── Gradient backgrounds (one per slide, crossfade) ──────────────── */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${slide.from} 0%, ${slide.via} 55%, ${slide.to} 100%)`,
            opacity: i === activeIdx ? 1 : 0,
            transition: `opacity ${FADE_DURATION}ms ease-in-out`,
            zIndex: 1,
          }}
        />
      ))}

      {/* ── Optional: video overlays (add a videoSrc to a slide to enable) ── */}
      {SLIDES.map((slide, i) =>
        slide.videoSrc ? (
          <video
            key={slide.id + "-vid"}
            ref={(el) => { videoRefs.current[i] = el; }}
            src={slide.videoSrc}
            muted
            playsInline
            loop
            preload="none"
            onError={() => setVideoFailed((p) => ({ ...p, [slide.id]: true }))}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: i === activeIdx && !videoFailed[slide.id] ? 0.35 : 0,
              transition: `opacity ${FADE_DURATION}ms ease-in-out`,
              zIndex: 2,
            }}
          />
        ) : null
      )}

      {/* ── Accent glow ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id + "-glow"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_DURATION / 1000 }}
          style={{ position: "absolute", inset: 0, zIndex: 3 }}
        >
          <GlowOrb color={current.accent} />
        </motion.div>
      </AnimatePresence>

      {/* ── Subtle grid ──────────────────────────────────────────────────── */}
      <GridOverlay />

      {/* ── Bottom fade-to-page ──────────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent"
        style={{ zIndex: 5 }}
      />

      {/* ── Progress dots + label ────────────────────────────────────────── */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3"
        style={{ zIndex: 10 }}
      >
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              aria-label={s.label}
              onClick={() => jumpTo(i)}
              style={{
                width: i === activeIdx ? 22 : 6,
                height: 6,
                borderRadius: 9999,
                background:
                  i === activeIdx ? current.accent : "rgba(255,255,255,0.25)",
                transition: "all 0.4s ease",
                cursor: "pointer",
                border: "none",
                padding: 0,
              }}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={current.id + "-label"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4 }}
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: current.accent }}
          >
            {current.label}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* ── Hero content ─────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 relative pt-24 pb-16" style={{ zIndex: 10 }}>
        <div className="max-w-3xl mx-auto text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 mb-8"
            style={{
              background: `${current.accent}18`,
              borderColor: `${current.accent}40`,
              transition: `background ${FADE_DURATION}ms, border-color ${FADE_DURATION}ms`,
            }}
          >
            <Zap className="w-4 h-4" style={{ color: current.accent }} />
            <span className="text-sm font-medium text-white/80">
              Built for Government &amp; Enterprise Teams
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white"
          >
            Win Contracts.{" "}
            <span style={{ color: current.accent, transition: `color ${FADE_DURATION}ms` }}>
              Deliver Projects.
            </span>{" "}
            No Experts Required.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/55 mb-10 max-w-2xl mx-auto leading-relaxed"
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
              <Button
                size="xl"
                className="w-full sm:w-auto text-black font-bold"
                style={{
                  background: current.accent,
                  transition: `background ${FADE_DURATION}ms`,
                }}
              >
                Start Free Trial
                <ArrowRight className="ml-1" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                variant="outline"
                size="xl"
                className="w-full sm:w-auto text-white/80 border-white/20 hover:border-white/40 hover:bg-white/5"
              >
                See How It Works
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/35"
          >
            {["Proposal Writing", "RFP Evaluation", "Project Delivery", "No Credit Card Required"].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: current.accent }} />
                <span>{label}</span>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
