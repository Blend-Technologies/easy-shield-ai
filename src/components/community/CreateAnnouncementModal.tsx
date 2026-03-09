import { useState, useEffect, useRef } from "react";
import { X, Maximize2, Loader2 } from "lucide-react";

interface CreateAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  onPublish: (title: string, hook: string, body: string) => void;
}

const CreateAnnouncementModal = ({ open, onClose, onPublish }: CreateAnnouncementModalProps) => {
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [body, setBody] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const canPublish = body.trim().length > 0 && !publishing;

  useEffect(() => {
    if (open) {
      setTimeout(() => bodyRef.current?.focus(), 80);
    } else {
      setTitle("");
      setHook("");
      setBody("");
      setExpanded(false);
      setPublishing(false);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  const handlePublish = () => {
    if (!canPublish) return;
    setPublishing(true);
    // Small delay to show loading state
    setTimeout(() => {
      onPublish(title, hook, body);
      setPublishing(false);
    }, 400);
  };

  const modalHeight = expanded ? "h-screen max-h-screen rounded-none" : "max-h-[700px] rounded-xl";
  const modalWidth = expanded ? "w-screen" : "w-full max-w-[760px]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${modalHeight} ${modalWidth}`}
        style={{ minHeight: expanded ? "100vh" : 480 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Admin</span>
            <h2 className="text-[18px] font-bold text-gray-900">New Announcement</h2>
          </div>
          <div className="flex items-center gap-1">
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
        <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-5 pb-2 gap-4">
          <input
            type="text"
            placeholder="Announcement title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl font-semibold text-gray-900 placeholder:text-gray-300 placeholder:font-semibold outline-none bg-transparent border-none"
          />
          <div className="border-b border-gray-100 pb-3">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Hook / Highlight (shown in blue)
            </label>
            <input
              type="text"
              placeholder="e.g. 🚀 Big announcement! or @Member has joined..."
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              className="w-full text-base text-blue-600 font-bold placeholder:text-gray-300 placeholder:font-normal outline-none bg-transparent border-none"
            />
          </div>
          <textarea
            ref={bodyRef}
            placeholder="Write your announcement body…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 w-full text-base text-gray-700 placeholder:text-gray-400 outline-none bg-transparent border-none resize-none leading-relaxed"
            style={{ minHeight: 200 }}
          />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            This announcement will be visible to all community members.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!canPublish}
              onClick={handlePublish}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                canPublish
                  ? "bg-[#1a2b5e] hover:bg-[#16275a] text-white cursor-pointer shadow-sm"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {publishing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {publishing ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAnnouncementModal;
