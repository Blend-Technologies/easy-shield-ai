import { useState, useMemo } from "react";
import { MapPin, Search, MessageCircle, Users, Wifi, Clock, Map, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MockMember {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  avatarUrl?: string;
  title: string;
  location: string;
  bio: string;
  online: boolean;
  joinedDaysAgo: number;
}

const MOCK_MEMBERS: MockMember[] = [
  {
    id: "1",
    name: "Inderjeet Singh",
    initials: "IS",
    avatarColor: "hsl(var(--primary))",
    avatarUrl: "https://ui-avatars.com/api/?name=Inderjeet+Singh&background=6366f1&color=fff&size=112",
    title: "Azure-focused Solution Architect",
    location: "Toronto, Ontario, Canada",
    bio: "I'm an Azure-focused Solution Architect with 10+ years in building and scaling software. I started in December 2014 writing PHP, moved deep into the MEAN stack, and eventually grew into leading teams and owning architecture decisions end-to-end. I like solving the hard stuff: messy legacy systems, performance bottlenecks, and cloud migrations that actually work.",
    online: true,
    joinedDaysAgo: 120,
  },
  {
    id: "2",
    name: "Stefaan Meeuws",
    initials: "SM",
    avatarColor: "hsl(var(--primary))",
    avatarUrl: "https://ui-avatars.com/api/?name=Stefaan+Meeuws&background=8b5cf6&color=fff&size=112",
    title: "AI Engineer / Freelancer",
    location: "Roeselare, West Flanders, Belgium",
    bio: "See Datalumina",
    online: false,
    joinedDaysAgo: 60,
  },
  {
    id: "3",
    name: "Aarti Joshi",
    initials: "AJ",
    avatarColor: "hsl(142 71% 45%)",
    title: "",
    location: "Detroit, Michigan, United States",
    bio: "",
    online: false,
    joinedDaysAgo: 30,
  },
  {
    id: "4",
    name: "Prashant Bellad",
    initials: "PB",
    avatarColor: "hsl(var(--primary))",
    avatarUrl: "https://ui-avatars.com/api/?name=Prashant+Bellad&background=ec4899&color=fff&size=112",
    title: "Founder at Pristine Pro| AI process automation| Software QA",
    location: "Pune, Maharashtra, India",
    bio: "I help businesses turn operational chaos into scalable profit machines through intelligent, AI-driven automation. If your company is bleeding time and money on manual tasks, I design custom workflows—such as LLM-powered inquiry routing and automated prospect management—that eliminate bottlenecks and drive revenue growth.",
    online: true,
    joinedDaysAgo: 15,
  },
  {
    id: "5",
    name: "David Martin",
    initials: "DM",
    avatarColor: "hsl(0 72% 51%)",
    title: "Senior Software Engineer Specializing in Advanced AI/ML Solutions including Data Prep, ...",
    location: "Birmingham, Alabama, United States",
    bio: "Learning everything about AI engineering, currently employed as an AI/ML engineer full time, and working on building a consulting business to help escape the corporate world. LinkedIn URL...",
    online: false,
    joinedDaysAgo: 5,
  },
];

const TAGS = ["AI Engineer", "Data Scientist", "Freelancer", "Consultant", "Software Engineer"];

const MembersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [filterNearMe, setFilterNearMe] = useState(false);
  const [filterOnline, setFilterOnline] = useState(false);
  const [filterRecent, setFilterRecent] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [expandedBios, setExpandedBios] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = [...MOCK_MEMBERS];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q)
      );
    }
    if (locationQuery) {
      const q = locationQuery.toLowerCase();
      list = list.filter((m) => m.location.toLowerCase().includes(q));
    }
    if (filterNearMe) {
      list = list.filter((m) => m.location.toLowerCase().includes("united states"));
    }
    if (filterOnline) {
      list = list.filter((m) => m.online);
    }
    if (filterRecent) {
      list.sort((a, b) => a.joinedDaysAgo - b.joinedDaysAgo);
    }
    if (selectedTag) {
      const q = selectedTag.toLowerCase();
      list = list.filter((m) => m.title.toLowerCase().includes(q));
    }
    return list;
  }, [searchQuery, locationQuery, filterNearMe, filterOnline, filterRecent, selectedTag]);

  const toggleBio = (id: string) => {
    setExpandedBios((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background">
      {/* Page header */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Members</h1>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-sm text-muted-foreground"
          onClick={() => setShowMap(!showMap)}
        >
          <Map className="w-4 h-4" />
          {showMap ? "Hide map" : "Show map"}
        </Button>
      </div>

      <div className="flex px-8 gap-8">
        {/* Left panel */}
        <div className="w-[320px] flex-shrink-0 space-y-6">
          {/* Profile card */}
          <div className="rounded-2xl bg-gradient-to-br from-orange-100 via-pink-50 to-rose-100 p-6 text-center">
            <img
              src="https://ui-avatars.com/api/?name=Oscar+Adimi&background=2563EB&color=fff&size=90"
              alt="avatar"
              className="w-[90px] h-[90px] rounded-full mx-auto border-4 border-background -mt-12 mb-3"
            />
            <p className="font-bold text-foreground text-base">Oscar Adimi</p>
            <p className="text-sm text-muted-foreground">AI Engineer | Data Scientist</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <MapPin className="w-3 h-3" /> Georgia
            </p>
            <Button size="sm" className="mt-4 rounded-full px-6">
              View profile
            </Button>
          </div>

          {/* Find members */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground text-base">Find members</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter toggles */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterNearMe ? "default" : "outline"}
                size="sm"
                className="gap-1.5 text-xs rounded-full"
                onClick={() => setFilterNearMe(!filterNearMe)}
              >
                <Users className="w-3.5 h-3.5" /> Near me
              </Button>
              <Button
                variant={filterOnline ? "default" : "outline"}
                size="sm"
                className="gap-1.5 text-xs rounded-full"
                onClick={() => setFilterOnline(!filterOnline)}
              >
                <Wifi className="w-3.5 h-3.5" /> Online
              </Button>
            </div>
            <Button
              variant={filterRecent ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs rounded-full"
              onClick={() => setFilterRecent(!filterRecent)}
            >
              <Clock className="w-3.5 h-3.5" /> Recently joined
            </Button>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground">Location</label>
              <Input
                placeholder="Search location"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>

            {/* Tag */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground">Tag</label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {TAGS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0">
          {/* Map placeholder */}
          {showMap && (
            <div className="rounded-xl bg-muted border border-border h-64 flex items-center justify-center mb-6">
              <p className="text-muted-foreground text-sm">🗺️ Map view coming soon</p>
            </div>
          )}

          {/* Member list header */}
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-foreground">All members</h2>
            <span className="text-sm text-muted-foreground">{filtered.length}</span>
          </div>

          {/* Member rows */}
          <div className="space-y-0 divide-y divide-border">
            {filtered.map((member) => {
              const bioExpanded = expandedBios.has(member.id);
              const bioTruncated = member.bio.length > 160;
              const displayBio = bioExpanded || !bioTruncated ? member.bio : member.bio.slice(0, 160) + "…";

              return (
                <div key={member.id} className="flex items-start gap-4 py-5">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.initials}
                      </div>
                    )}
                    {member.online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-[15px]">{member.name}</p>
                    {member.title && (
                      <p className="text-sm text-muted-foreground truncate">{member.title}</p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {member.location}
                    </p>
                    {member.bio && (
                      <p className="text-[13px] text-muted-foreground/80 mt-1.5 leading-relaxed">
                        {displayBio}
                        {bioTruncated && (
                          <button
                            onClick={() => toggleBio(member.id)}
                            className="text-primary ml-1 hover:underline text-[13px] font-medium"
                          >
                            {bioExpanded ? "Show less" : "See more"}
                          </button>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Message button */}
                  <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0 mt-1 rounded-lg">
                    <MessageCircle className="w-3.5 h-3.5" /> Message
                  </Button>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No members found matching your filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersPage;
