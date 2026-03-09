import { ArrowLeft, Star, Share2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpeg";

interface Props {
  courseTitle: string;
  progressPercent: number;
  onBack: () => void;
}

const ProgressRing = ({ percent }: { percent: number }) => {
  const r = 9;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0">
      <circle cx="12" cy="12" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
      <circle
        cx="12" cy="12" r={r} fill="none"
        stroke="hsl(var(--accent))" strokeWidth="2.5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
};

const CoursePlayerTopNav = ({ courseTitle, progressPercent, onBack }: Props) => (
  <header className="h-12 shrink-0 bg-[hsl(240,10%,8%)] flex items-center px-4 gap-3 border-b border-white/10">
    {/* Left */}
    <button onClick={onBack} className="shrink-0">
      <ArrowLeft className="h-4 w-4 text-white/60 hover:text-white" />
    </button>
    <img src={logo} alt="Logo" className="h-7 w-7 rounded-md shrink-0" />
    <span className="text-white/50 text-sm truncate max-w-[400px]">{courseTitle}</span>

    {/* Spacer */}
    <div className="flex-1" />

    {/* Right */}
    <button className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm">
      <Star className="h-4 w-4" />
      Leave a rating
    </button>

    <button className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm ml-3">
      <ProgressRing percent={progressPercent} />
      Your progress
      <span className="text-[10px]">▾</span>
    </button>

    <Button
      size="sm"
      variant="outline"
      className="border-white/20 bg-transparent text-white hover:bg-white/10 rounded-full h-8 px-4 text-xs gap-1.5"
    >
      <Share2 className="h-3.5 w-3.5" />
      Share
    </Button>

    <button className="text-white/50 hover:text-white p-1">
      <MoreVertical className="h-5 w-5" />
    </button>
  </header>
);

export default CoursePlayerTopNav;
