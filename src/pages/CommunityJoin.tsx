import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CommunityInfo {
  title: string;
  subtitle: string;
  description: string | null;
  category: string | null;
  logo_url: string | null;
}

const CommunityJoin = () => {
  const { communityId } = useParams<{ communityId: string }>();

  const [community, setCommunity] = useState<CommunityInfo | null>(null);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!communityId) { setNotFound(true); setLoadingCommunity(false); return; }
    supabase
      .from("courses")
      .select("title, subtitle, description, category, logo_url")
      .eq("id", communityId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else { setCommunity(data as CommunityInfo); }
        setLoadingCommunity(false);
      });
  }, [communityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_FUNCTIONS_URL || import.meta.env.VITE_SUPABASE_URL}/functions/v1/join-community`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ communityId, fullName, email }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Something went wrong");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCommunity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-indigo-900 to-blue-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-indigo-900 to-blue-900 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-2">Community not found</h1>
          <p className="text-white/60 text-sm">This invite link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-indigo-900 to-blue-900 flex items-center justify-center px-4 py-12">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Community branding */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-5 overflow-hidden border-2 border-white/20 shadow-xl flex items-center justify-center bg-white/10 backdrop-blur-sm">
            {community?.logo_url ? (
              <img src={community.logo_url} alt={community.title} className="w-full h-full object-cover" />
            ) : (
              <Sparkles className="w-9 h-9 text-white/80" />
            )}
          </div>
          {community?.category && (
            <span className="inline-block text-[11px] font-semibold tracking-widest uppercase text-violet-300 bg-violet-500/20 px-3 py-1 rounded-full mb-3">
              {community.category}
            </span>
          )}
          <h1 className="text-3xl font-extrabold text-white leading-tight mb-2">
            {community?.title}
          </h1>
          {community?.subtitle && (
            <p className="text-white/60 text-sm">{community.subtitle}</p>
          )}
          {community?.description && (
            <p className="text-white/50 text-sm mt-2 leading-relaxed">{community.description}</p>
          )}
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-white text-xl font-bold mb-2">You're in! 🎉</h2>
              <p className="text-white/70 text-sm leading-relaxed">
                Welcome to <strong className="text-white">{community?.title}</strong>.<br />
                The community admin will be in touch with you.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-violet-500/30 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-violet-200" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-tight">Join this community</h2>
                  <p className="text-white/50 text-xs mt-0.5">Enter your details to get access</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full h-11 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-1.5">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full h-11 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2.5 text-red-300 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !fullName.trim() || !email.trim()}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/30 mt-2"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
                  ) : (
                    <>Join {community?.title}</>
                  )}
                </button>
              </form>

              <p className="text-white/30 text-xs text-center mt-5 leading-relaxed">
                By joining you agree to the community's terms of conduct.
              </p>
            </>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Powered by <strong className="text-white/50">EZShield AI</strong>
        </p>
      </div>
    </div>
  );
};

export default CommunityJoin;
