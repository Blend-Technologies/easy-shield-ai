import { useState, useEffect, useRef } from "react";
import {
  X,
  Maximize2,
  Copy,
  PlusCircle,
  Globe,
  Paperclip,
  Play,
  Image,
  Smile,
  BarChart2,
  Mic,
  ChevronDown,
} from "lucide-react";

const SPACES = ["Community", "Course", "Events", "Insights"];

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
}

const CreatePostModal = ({ open, onClose }: CreatePostModalProps) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [space, setSpace] = useState("");
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const spaceDropdownRef = useRef<HTMLDivElement>(null);

  const canPublish = body.trim().length > 0;

  // Auto-focus body when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => bodyRef.current?.focus(), 80);
    } else {
      setTitle("");
      setBody("");
      setSpace("");
      setExpanded(false);
    }
  }, [open]);

  // Close space dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (spaceDropdownRef.current && !spaceDropdownRef.current.contains(e.target as Node)) {
        setSpaceOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  const modalHeight = expanded ? "h-screen max-h-screen rounded-none" : "max-h-[750px] rounded-xl";
  const modalWidth = expanded ? "w-screen" : "w-full max-w-[930px]";

  const toolbarIcons = [
    { icon: PlusCircle, label: "Add" },
    { icon: Globe, label: "Embed" },
    { icon: Paperclip, label: "Attachment" },
    { icon: Play, label: "Video" },
    { icon: Image, label: "Image" },
    { icon: Smile, label: "Emoji" },
    { icon: BarChart2, label: "Poll" },
    { icon: Mic, label: "Audio" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${modalHeight} ${modalWidth}`}
        style={{ minHeight: expanded ? "100vh" : 500 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-[18px] font-bold text-gray-900">Create post</h2>
          <div className="flex items-center gap-1">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title={expanded ? "Collapse" : "Expand"}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-5 pb-2 gap-3">
          {/* Title input */}
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl font-semibold text-gray-900 placeholder:text-gray-300 placeholder:font-semibold outline-none bg-transparent border-none"
          />

          {/* Body textarea */}
          <textarea
            ref={bodyRef}
            placeholder="Write something…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 w-full text-base text-gray-700 placeholder:text-gray-400 outline-none bg-transparent border-none resize-none leading-relaxed"
            style={{ minHeight: 340 }}
          />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100 px-5 py-3 flex items-center justify-between gap-3">
          {/* Toolbar icons */}
          <div className="flex items-center gap-0.5">
            {toolbarIcons.map(({ icon: Icon, label }) => (
              <button
                key={label}
                title={label}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Icon className="w-[18px] h-[18px]" />
              </button>
            ))}

            {/* GIF text button */}
            <button
              title="GIF"
              className="h-8 px-1.5 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-xs font-bold tracking-tight"
            >
              GIF
            </button>
          </div>

          {/* Right side: space selector + publish */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Space dropdown */}
            <div className="relative" ref={spaceDropdownRef}>
              <button
                onClick={() => setSpaceOpen(!spaceOpen)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
              >
                {space || "Choose a space to post in"}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {spaceOpen && (
                <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
                  {SPACES.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSpace(s); setSpaceOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        space === s ? "text-blue-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Publish button */}
            <button
              disabled={!canPublish}
              onClick={onClose}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                canPublish
                  ? "bg-[#1a2b5e] hover:bg-[#16275a] text-white cursor-pointer shadow-sm"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
