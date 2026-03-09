import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

interface Community {
  id: string;
  title: string;
  subtitle: string;
  description: string | null;
  category: string | null;
  logo_url: string | null;
  created_at: string;
}

const CommunityList = ({ communities }: { communities: Community[] }) => {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {communities.map((c) => (
        <button
          key={c.id}
          onClick={() => navigate(`/community/hub`)}
          className="text-left border border-border rounded-xl p-5 bg-card hover:border-primary/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
              {c.logo_url ? (
                <img src={c.logo_url} alt={c.title} className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {c.title}
              </p>
              <p className="text-muted-foreground text-xs truncate">{c.subtitle}</p>
            </div>
          </div>
          {c.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{c.description}</p>
          )}
          {c.category && (
            <span className="inline-block text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {c.category}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default CommunityList;
