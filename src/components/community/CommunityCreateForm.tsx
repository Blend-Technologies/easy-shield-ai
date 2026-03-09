import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ArrowRight, ArrowLeft, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Technology", "Business", "Education", "Health & Wellness",
  "Creative Arts", "Science", "Finance", "Marketing", "Other",
];

interface Props {
  onBack: () => void;
}

const CommunityCreateForm = ({ onBack }: Props) => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", tagline: "", description: "", category: "", website: "",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogo(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Community name is required.";
    if (!form.category) errs.category = "Please select a category.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validate()) setStep(2); };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "You must be logged in", variant: "destructive" });
        return;
      }
      let logoUrl: string | null = null;
      if (logo) {
        const ext = logo.name.split(".").pop();
        const path = `logos/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("course-videos").upload(path, logo, { upsert: true });
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage
            .from("course-videos").getPublicUrl(path);
          logoUrl = publicUrl;
        }
      }
      const { data, error } = await supabase
        .from("courses")
        .insert({
          title: form.name, subtitle: form.tagline || "Data Freelancer",
          description: form.description, category: form.category,
          website: form.website, logo_url: logoUrl, created_by: user.id,
        } as any)
        .select().single();
      if (error) {
        toast({ title: "Error creating community", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Community created!" });
      navigate(`/community/course-builder/${data.id}`);
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border flex items-center px-6 gap-3">
        <button onClick={onBack} className="p-1.5 rounded-md hover:bg-muted mr-1">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Users className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground">Create your community</span>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {s}
                </div>
                <span className={`text-sm ${s === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {s === 1 ? "Basic info" : "Finalize"}
                </span>
                {s < 2 && <div className="w-12 h-px bg-border" />}
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            {step === 1 ? (
              <>
                <h1 className="text-2xl font-bold text-foreground mb-1">Name your community</h1>
                <p className="text-muted-foreground text-sm mb-8">Give it a name, tagline, and logo so people know what it's about.</p>
                <div className="flex items-center gap-5 mb-6">
                  <button onClick={() => fileRef.current?.click()} className="w-20 h-20 rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/40 flex flex-col items-center justify-center transition-colors cursor-pointer overflow-hidden">
                    {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /> : (<><Upload className="w-5 h-5 text-muted-foreground mb-1" /><span className="text-[10px] text-muted-foreground">Upload logo</span></>)}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Community logo</p>
                    <p>PNG, JPG or SVG · Max 2MB</p>
                    {logoPreview && <button onClick={() => { setLogo(null); setLogoPreview(null); }} className="text-destructive text-xs mt-1 hover:underline">Remove</button>}
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="name">Community name <span className="text-destructive">*</span></Label>
                    <Input id="name" className="mt-1.5" placeholder="e.g. Data Freelancers Hub" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="tagline">Tagline <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input id="tagline" className="mt-1.5" placeholder="e.g. Where data professionals build their business" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                    <select id="category" className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option value="">Select a category…</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.category && <p className="text-destructive text-xs mt-1">{errors.category}</p>}
                  </div>
                </div>
                <Button className="w-full mt-8" onClick={handleNext}>Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground mb-1">Almost there!</h1>
                <p className="text-muted-foreground text-sm mb-8">Add a description and optional website to help members learn more.</p>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" className="mt-1.5 resize-none" rows={4} placeholder="Describe what your community is about…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="website">Website (optional)</Label>
                    <Input id="website" className="mt-1.5" placeholder="https://yourwebsite.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                  </div>
                </div>
                <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /> : <Sparkles className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{form.name || "Your Community"}</p>
                    <p className="text-muted-foreground text-xs truncate">{form.tagline || "Your tagline here"}</p>
                    <span className="inline-block mt-1 text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{form.category || "Category"}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-1" onClick={handleCreate} disabled={saving}>{saving ? "Creating…" : "Create community 🎉"}</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityCreateForm;
