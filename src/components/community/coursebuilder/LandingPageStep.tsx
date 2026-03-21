import { useState, useRef } from "react";
import { ImagePlus, X, Loader2, Globe, Lock, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Business", "Technology", "Design", "Marketing", "Finance",
  "Health & Wellness", "Personal Development", "Education",
  "Arts & Crafts", "Music", "Photography", "Other",
];

export interface LandingPageData {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  website: string;
  is_private: boolean;
  logo_url: string | null;
}

interface Props {
  courseId: string;
  data: LandingPageData;
  onChange: (data: LandingPageData) => void;
}

const LandingPageStep = ({ courseId, data, onChange }: Props) => {
  const [uploadingCover, setUploadingCover] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<LandingPageData>) => {
    onChange({ ...data, ...patch });
  };

  const handleCoverUpload = async (file: File) => {
    if (!file) return;
    setUploadingCover(true);
    const ext = file.name.split(".").pop();
    const path = `covers/${courseId}.${ext}`;
    const { data: uploadData, error } = await supabase.storage
      .from("course-videos")
      .upload(path, file, { upsert: true });

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploadingCover(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("course-videos").getPublicUrl(uploadData.path);
    update({ logo_url: publicUrl });
    setUploadingCover(false);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Course Landing Page</h1>
      <div className="border-b border-border my-4" />
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        Your course landing page is the first thing learners see. A compelling title, clear description, and cover image dramatically increase enrollments.
      </p>

      <div className="space-y-8">
        {/* Cover image */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Cover Image</label>
          <p className="text-xs text-muted-foreground mb-3">Upload a high-quality image (1280×720px recommended). JPG, PNG, or WebP.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }}
          />
          {data.logo_url ? (
            <div className="relative w-full max-w-md rounded-xl overflow-hidden border border-border group">
              <img src={data.logo_url} alt="Cover" className="w-full h-44 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-gray-900 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Replace
                </button>
                <button
                  onClick={() => update({ logo_url: null })}
                  className="bg-white text-red-600 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingCover}
              className="w-full max-w-md h-44 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              {uploadingCover ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-7 h-7" />
                  <span className="text-sm font-medium">Click to upload cover image</span>
                  <span className="text-xs">JPG, PNG, WebP · Max 5MB</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">Course Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="e.g. Complete Web Development Bootcamp"
            maxLength={60}
            className="w-full h-11 px-4 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground mt-1">{60 - data.title.length} characters remaining</p>
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">Subtitle</label>
          <input
            type="text"
            value={data.subtitle}
            onChange={(e) => update({ subtitle: e.target.value })}
            placeholder="Brief summary — appears under the title on the course card"
            maxLength={120}
            className="w-full h-11 px-4 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground mt-1">{120 - data.subtitle.length} characters remaining</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">Course Description</label>
          <textarea
            value={data.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Describe what your course covers, who it's for, and what learners will achieve..."
            rows={6}
            className="w-full px-4 py-3 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">Category</label>
          <div className="relative w-64">
            <button
              onClick={() => setCategoryOpen(!categoryOpen)}
              className="w-full h-11 px-4 border border-border rounded-lg text-sm text-foreground flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <span className={data.category ? "text-foreground" : "text-muted-foreground"}>
                {data.category || "Select a category"}
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
            </button>
            {categoryOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg py-1 z-20 max-h-52 overflow-y-auto">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { update({ category: cat }); setCategoryOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                      data.category === cat ? "text-primary font-semibold" : "text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">Course Website / Resource Link</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="url"
              value={data.website}
              onChange={(e) => update({ website: e.target.value })}
              placeholder="https://example.com"
              className="w-full h-11 pl-9 pr-4 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-3">Visibility</label>
          <div className="flex gap-3">
            <button
              onClick={() => update({ is_private: false })}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-colors w-52 ${
                !data.is_private
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              <Globe className={`w-5 h-5 flex-shrink-0 ${!data.is_private ? "text-primary" : ""}`} />
              <div className="text-left">
                <p className="text-sm font-semibold">Public</p>
                <p className="text-xs text-muted-foreground">Anyone can enroll</p>
              </div>
            </button>
            <button
              onClick={() => update({ is_private: true })}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-colors w-52 ${
                data.is_private
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              <Lock className={`w-5 h-5 flex-shrink-0 ${data.is_private ? "text-primary" : ""}`} />
              <div className="text-left">
                <p className="text-sm font-semibold">Private</p>
                <p className="text-xs text-muted-foreground">Invite-only access</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageStep;
