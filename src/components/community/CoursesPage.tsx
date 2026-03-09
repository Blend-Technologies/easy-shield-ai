import { Lock, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Blue grid pattern SVG component
const BlueGridPattern = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 400 300"
    preserveAspectRatio="xMaxYMid slice"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="400" height="300" fill="#0a0a0a" />
    {/* Generate blue squares with varying opacity, denser on right */}
    {Array.from({ length: 120 }).map((_, i) => {
      const col = i % 15;
      const row = Math.floor(i / 15);
      const x = col * 26 + 10;
      const y = row * 36 + 10;
      const opacity = Math.random() * 0.6 + 0.2;
      const size = Math.random() * 8 + 6;
      const showSquare = Math.random() < (col / 15) * 0.8 + 0.1;
      if (!showSquare) return null;
      return (
        <rect
          key={i}
          x={x}
          y={y}
          width={size}
          height={size}
          fill={`hsl(216, 100%, ${50 + Math.random() * 20}%)`}
          opacity={opacity}
          rx="1"
        />
      );
    })}
  </svg>
);

// Datalumina logo icon
const DataluminaLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
      fill="white"
      stroke="white"
      strokeWidth="1"
    />
  </svg>
);

interface CourseCardProps {
  title: string;
  lessonCount: number;
  subtitle: string;
  progress: number;
}

const CourseCard = ({ title, lessonCount, subtitle, progress }: CourseCardProps) => (
  <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden w-full max-w-[280px]">
    {/* Thumbnail with blue grid pattern */}
    <div className="relative h-36 bg-[#0a0a0a] overflow-hidden">
      <BlueGridPattern className="absolute inset-0 w-full h-full" />
      {/* Lesson count badge */}
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
        <span className="text-[10px] font-semibold text-white tracking-wider uppercase">
          {lessonCount} LESSONS
        </span>
      </div>
      {/* Course title */}
      <div className="absolute bottom-3 left-3 right-3">
        <h3 className="text-white font-bold text-lg leading-tight">{title}</h3>
      </div>
    </div>

    {/* Card body */}
    <div className="p-4 space-y-3">
      {/* Course type */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="font-semibold text-foreground text-sm">Course</span>
      </div>

      {/* Subtitle */}
      <p className="text-muted-foreground text-sm">{subtitle}</p>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Progress */}
      <div className="space-y-2">
        <span className="text-muted-foreground text-sm">{progress}% Complete</span>
        <Progress value={progress} className="h-1" />
      </div>

      {/* Private space indicator */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Lock className="w-3.5 h-3.5" />
        <span className="text-xs">Private space</span>
      </div>
    </div>
  </div>
);

const mockCourses: CourseCardProps[] = [
  {
    title: "Freelance Playbook",
    lessonCount: 49,
    subtitle: "Data Freelancer",
    progress: 0,
  },
  {
    title: "Client Acquisition Mastery",
    lessonCount: 32,
    subtitle: "Data Freelancer",
    progress: 0,
  },
  {
    title: "Pricing & Proposals",
    lessonCount: 24,
    subtitle: "Data Freelancer",
    progress: 0,
  },
  {
    title: "Scale Your Practice",
    lessonCount: 18,
    subtitle: "Data Freelancer",
    progress: 0,
  },
];

const CoursesPage = () => {
  return (
    <div className="min-h-screen bg-[#F5F6F8] pt-14">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}
        <h1 className="text-2xl font-bold text-foreground mb-6">Courses</h1>

        {/* Hero Section - Two Panel Banner */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-8">
          <div className="flex h-[550px]">
            {/* Left Panel - White background */}
            <div className="flex-1 bg-white flex items-center justify-center p-12">
              <div className="max-w-md">
                <h2 className="text-[28px] font-bold text-foreground leading-tight mb-4">
                  Launch and scale your freelance business
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Get clients, deliver projects, take it full time. Proven playbooks and coaching tailored for the tech industry.
                </p>
              </div>
            </div>

            {/* Right Panel - Dark with blue grid */}
            <div className="flex-1 relative bg-[#0a0a0a] rounded-xl overflow-hidden">
              <BlueGridPattern className="absolute inset-0 w-full h-full" />
              {/* Datalumina logo */}
              <div className="absolute top-6 left-6">
                <DataluminaLogo />
              </div>
              {/* Welcome text */}
              <div className="absolute bottom-8 left-8">
                <span className="text-white text-[40px] font-bold">Welcome</span>
              </div>
            </div>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockCourses.map((course, index) => (
            <CourseCard key={index} {...course} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
