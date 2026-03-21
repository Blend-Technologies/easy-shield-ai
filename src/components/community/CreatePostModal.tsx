import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, ImagePlus, BarChart2, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CHANNELS: { label: string; emoji: string }[] = [
  { label: "Announcements", emoji: "📣" },
  { label: "Introductions", emoji: "👋" },
  { label: "Wins & Milestones", emoji: "🏆" },
  { label: "Share Progress", emoji: "✏️" },
  { label: "Promotion", emoji: "🔥" },
  { label: "Q&A", emoji: "❓" },
  { label: "Technical Support", emoji: "🔧" },
  { label: "Feedback Requests", emoji: "💡" },
  { label: "Resources & Tools", emoji: "🎨" },
  { label: "General Discussion", emoji: "💬" },
  { label: "Ideas & Brainstorming", emoji: "🧠" },
  { label: "Showcase", emoji: "⭐" },
];

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onPublish: (title: string, body: string, channel: string, imageUrl?: string) => Promise<void>;
  defaultChannel?: string;
}

const CreatePostModal = ({ open, onClose, onPublish, defaultChannel }: CreatePostModalProps) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState(defaultChannel ?? "General Discussion");
  const [channelOpen, setChannelOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userName, setUserName] = useState("You");
  const [userAvatar, setUserAvatar] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const channelDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canPublish = body.trim().length > 0 && !publishing;
  const selectedChannel = CHANNELS.find((c) => c.label === channel) ?? CHANNELS[9];

  // Fetch current user profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      const name = profile?.full_name ?? user.email?.split("@")[0] ?? "You";
      setUserName(name);
      const colors = ["6366f1", "f59e0b", "10b981", "ef4444", "3b82f6", "8b5cf6"];
      const color = colors[name.charCodeAt(0) % colors.length];
      setUserAvatar(`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=40`);
    };
    if (open) fetchProfile();
  }, [open]);

  useEffect(() => {
    if (open) {
      setChannel(defaultChannel ?? "General Discussion");
      setTimeout(() => bodyRef.current?.focus(), 80);
    } else {
      setTitle("");
      setBody("");
      setChannel(defaultChannel ?? "General Discussion");
      setPublishing(false);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [open, defaultChannel]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(e.target as Node)) {
        setChannelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handlePublish = async () => {
    if (!canPublish) return;
    setPublishing(true);

    let imageUrl: string | undefined;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `posts/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("community-posts")
        .upload(path, imageFile, { upsert: true });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("community-posts").getPublicUrl(data.path);
        imageUrl = urlData.publicUrl;
      }
    }

    await onPublish(title, body, channel, imageUrl);
    setPublishing(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[540px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create New Post</h2>
            <p className="text-sm text-gray-500 mt-0.5">Share your thoughts with the community.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* User info */}
          <div className="flex items-center gap-3">
            <img
              src={userAvatar || `https://ui-avatars.com/api/?name=You&background=7c3aed&color=fff&size=40`}
              alt={userName}
              className="w-11 h-11 rounded-full flex-shrink-0"
            />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{userName}</p>
              <p className="text-xs text-gray-500">Posting to community</p>
            </div>
          </div>

          {/* Category dropdown */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Category</label>
            <div className="relative" ref={channelDropdownRef}>
              <button
                onClick={() => setChannelOpen(!channelOpen)}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white hover:border-violet-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{selectedChannel.emoji}</span>
                  {selectedChannel.label}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${channelOpen ? "rotate-180" : ""}`} />
              </button>
              {channelOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 max-h-52 overflow-y-auto">
                  {CHANNELS.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => { setChannel(c.label); setChannelOpen(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${
                        channel === c.label ? "text-violet-600 font-semibold bg-violet-50" : "text-gray-700"
                      }`}
                    >
                      <span className="text-base">{c.emoji}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Title</label>
            <input
              type="text"
              placeholder="Give your post a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Content</label>
            <textarea
              ref={bodyRef}
              placeholder="What's on your mind?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all resize-none leading-relaxed"
              rows={5}
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Image or GIF (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleImageSelect}
            />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <img src={imagePreview} alt="preview" className="w-full max-h-48 object-cover" />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors"
              >
                <ImagePlus className="w-8 h-8" />
                <p className="text-sm font-medium">Click to upload an image or GIF</p>
                <p className="text-xs">Max size: 20MB · JPG, PNG, GIF, WebP</p>
              </button>
            )}
          </div>

          {/* Tip */}
          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
            💡 <span className="font-semibold text-gray-700">Tip:</span> Paste a YouTube or Vimeo link in your post content and it will automatically embed as a video player.
          </p>

          {/* Add Poll */}
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors">
            <BarChart2 className="w-4 h-4 text-gray-500" />
            Add Poll
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!canPublish}
            onClick={handlePublish}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              canPublish
                ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {publishing ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
