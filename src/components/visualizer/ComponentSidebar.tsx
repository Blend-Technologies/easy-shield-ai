import { useState } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

type ComponentItem = {
  id: string;
  label: string;
  icon: string;
  description: string;
};

type Category = {
  name: string;
  items: ComponentItem[];
};

const categories: Category[] = [
  {
    name: "Platforms",
    items: [
      { id: "salesforce", label: "Salesforce", icon: "☁️", description: "CRM & Sales Cloud" },
      { id: "outsystems", label: "OutSystems", icon: "⚡", description: "Low-Code Platform" },
      { id: "mendix", label: "Mendix", icon: "🔧", description: "App Development" },
      { id: "bubble", label: "Bubble", icon: "🫧", description: "No-Code Builder" },
      { id: "power-apps", label: "Power Apps", icon: "🟣", description: "Microsoft Platform" },
    ],
  },
  {
    name: "Security Layers",
    items: [
      { id: "firewall", label: "Firewall", icon: "🛡️", description: "Network Security" },
      { id: "oauth", label: "OAuth / SSO", icon: "🔐", description: "Authentication" },
      { id: "encryption", label: "Encryption", icon: "🔒", description: "Data Protection" },
      { id: "waf", label: "WAF", icon: "🧱", description: "Web App Firewall" },
      { id: "api-gateway", label: "API Gateway", icon: "🚪", description: "Gateway & Rate Limiting" },
    ],
  },
  {
    name: "Data & Storage",
    items: [
      { id: "database", label: "Database", icon: "🗄️", description: "SQL / NoSQL Store" },
      { id: "data-lake", label: "Data Lake", icon: "🌊", description: "Raw Data Storage" },
      { id: "cache", label: "Cache", icon: "⚡", description: "Redis / Memcache" },
      { id: "blob-storage", label: "Blob Storage", icon: "📦", description: "File Storage" },
    ],
  },
  {
    name: "Integration",
    items: [
      { id: "rest-api", label: "REST API", icon: "🔗", description: "HTTP Endpoints" },
      { id: "webhook", label: "Webhook", icon: "🪝", description: "Event Triggers" },
      { id: "message-queue", label: "Message Queue", icon: "📨", description: "Async Processing" },
      { id: "etl", label: "ETL Pipeline", icon: "🔄", description: "Data Transform" },
    ],
  },
  {
    name: "Monitoring",
    items: [
      { id: "logging", label: "Logging", icon: "📋", description: "Log Aggregation" },
      { id: "alerts", label: "Alerts", icon: "🔔", description: "Notifications" },
      { id: "dashboard-widget", label: "Dashboard", icon: "📊", description: "Metrics View" },
    ],
  },
];

const ComponentSidebar = () => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Platforms: true,
    "Security Layers": true,
  });

  const toggle = (name: string) =>
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  const filtered = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  const onDragStart = (event: React.DragEvent, item: ComponentItem) => {
    event.dataTransfer.setData("application/json", JSON.stringify(item));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-60 bg-background border-r border-border flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-muted/50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.map((cat) => (
          <div key={cat.name}>
            <button
              onClick={() => toggle(cat.name)}
              className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded[cat.name] ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              {cat.name}
            </button>
            {expanded[cat.name] && (
              <div className="px-2 pb-1 space-y-0.5">
                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, item)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-muted/80 transition-colors group"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ComponentSidebar;
