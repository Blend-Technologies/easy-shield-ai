import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import CommunityTopNav from "@/components/community/CommunityTopNav";

const ProfileSettings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    bio: "",
    website: "",
    location: "",
    avatar_url: null as string | null,
  });
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("full_name, bio, avatar_url, location, website")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setProfile({
          full_name: data.full_name ?? "",
          bio: data.bio ?? "",
          website: (data as any).website ?? "",
          location: data.location ?? "",
          avatar_url: data.avatar_url,
        });
        const loc = data.location ?? "";
        const parts = loc.split(",").map((s: string) => s.trim());
        setCity(parts[0] || "");
        setCountry(parts[1] || "");
      }
    };
    load();
  }, [navigate]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    const location = [city, country].filter(Boolean).join(", ");
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        bio: profile.bio,
        location,
        avatar_url: profile.avatar_url,
      } as any)
      .eq("id", userId);
    
    // Update website separately since types may not include it yet
    await supabase.rpc("has_role" as any, { _user_id: userId, _role: "admin" }).then(() => {
      // Just a no-op to keep connection alive
    });
    await supabase.from("profiles").update({ website: profile.website } as any).eq("id", userId);
    
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url }).eq("id", userId);
    setProfile((p) => ({ ...p, avatar_url }));
    setUploading(false);
    toast({ title: "Photo updated" });
  };

  const handleRemovePhoto = async () => {
    if (!userId) return;
    setUploading(true);
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
    setProfile((p) => ({ ...p, avatar_url: null }));
    setUploading(false);
    toast({ title: "Photo removed" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CommunityTopNav
        communityName="Blueprint Builder"
        logo={null}
        activeTab=""
        onTabChange={() => {}}
      />

      <div className="pt-24 pb-12 max-w-2xl mx-auto px-4 sm:px-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your public profile information</p>
        </div>

        {/* Profile Picture Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
          <h2 className="text-sm font-bold text-gray-900">Profile Picture</h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">Update your profile picture</p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#6B4EFF] flex items-center justify-center text-white text-xl font-bold">
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  Change Photo
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={uploading || !profile.avatar_url}
                  onClick={handleRemovePhoto}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Photo
                </Button>
              </div>
              <p className="text-[11px] text-gray-400">Recommended: 400×400px or larger, max 5MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadPhoto}
            />
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900">Personal Information</h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-5">Update your personal details</p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName" className="text-xs font-medium text-gray-700">Display Name</Label>
              <Input
                id="displayName"
                className="mt-1.5 h-9 text-sm"
                value={profile.full_name}
                onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-xs font-medium text-gray-700">Bio</Label>
              <Textarea
                id="bio"
                className="mt-1.5 min-h-[100px] text-sm resize-y"
                placeholder="Tell us about yourself..."
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="website" className="text-xs font-medium text-gray-700">Website</Label>
              <Input
                id="website"
                className="mt-1.5 h-9 text-sm"
                placeholder="https://example.com"
                value={profile.website}
                onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-xs font-medium text-gray-700">City</Label>
                <Input
                  id="city"
                  className="mt-1.5 h-9 text-sm"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="country" className="text-xs font-medium text-gray-700">Country</Label>
                <Input
                  id="country"
                  className="mt-1.5 h-9 text-sm"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                className="bg-[#6B4EFF] hover:bg-[#5a3ee6] text-white px-6"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
