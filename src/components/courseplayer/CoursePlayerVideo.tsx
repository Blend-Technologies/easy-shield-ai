import {
  Play, SkipBack, SkipForward, Volume2,
  Maximize, Subtitles, Settings
} from "lucide-react";

interface Props {
  lectureTitle: string;
}

const CoursePlayerVideo = ({ lectureTitle }: Props) => (
  <div className="relative bg-gradient-to-br from-[hsl(210,60%,18%)] to-[hsl(210,50%,28%)] flex-1 min-h-0 flex flex-col">
    {/* Slide content mock */}
    <div className="flex-1 flex items-center justify-center px-16">
      <div className="text-center max-w-2xl space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
          Preventive Controls
        </h1>
        <div className="mx-auto w-3/4 h-1 rounded-full bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(170,80%,50%)]" />
        <p className="text-lg md:text-xl text-white/80 leading-relaxed">
          Proactive measures implemented to thwart potential security threats or breaches
        </p>
      </div>
    </div>

    {/* Watermark */}
    <span className="absolute bottom-14 right-4 text-white/20 text-xs italic">EZShield+AI</span>

    {/* Video controls bar */}
    <div className="shrink-0 bg-black/60 backdrop-blur-sm px-4 py-2 flex flex-col gap-1">
      {/* Scrubber */}
      <div className="group flex items-center gap-2">
        <span className="text-[10px] text-white/60 w-10 text-right">2:14</span>
        <div className="flex-1 h-1 bg-white/20 rounded-full relative cursor-pointer">
          <div className="absolute left-0 top-0 h-full w-[35%] bg-[hsl(var(--accent))] rounded-full" />
          <div className="absolute top-1/2 -translate-y-1/2 left-[35%] w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-[10px] text-white/60 w-10">6:22</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button className="text-white/80 hover:text-white"><Play className="h-5 w-5" /></button>
        <button className="text-white/60 hover:text-white"><SkipBack className="h-4 w-4" /></button>
        <button className="text-white/60 hover:text-white"><SkipForward className="h-4 w-4" /></button>
        <button className="text-white/60 hover:text-white"><Volume2 className="h-4 w-4" /></button>
        <span className="text-white/50 text-xs ml-1">1x</span>

        <div className="flex-1" />

        <button className="text-white/60 hover:text-white"><Subtitles className="h-4 w-4" /></button>
        <button className="text-white/60 hover:text-white"><Settings className="h-4 w-4" /></button>
        <button className="text-white/60 hover:text-white"><Maximize className="h-4 w-4" /></button>
      </div>
    </div>
  </div>
);

export default CoursePlayerVideo;
