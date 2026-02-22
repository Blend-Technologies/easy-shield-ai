import { useState } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cloudProviders, genericCategories, type CloudService, type CloudCategory } from "./cloudServices";

const ServiceItem = ({
  service,
  onDragStart,
}: {
  service: CloudService;
  onDragStart: (e: React.DragEvent, s: CloudService) => void;
}) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, service)}
    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing hover:bg-muted/80 transition-colors"
  >
    <div
      className={`w-7 h-7 rounded-md ${service.color} ${service.textColor} flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm`}
    >
      {service.abbr}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground truncate leading-tight">
        {service.label}
      </p>
      <p className="text-[10px] text-muted-foreground truncate">
        {service.description}
      </p>
    </div>
  </div>
);

const CategoryGroup = ({
  category,
  expanded,
  onToggle,
  onDragStart,
}: {
  category: CloudCategory;
  expanded: boolean;
  onToggle: () => void;
  onDragStart: (e: React.DragEvent, s: CloudService) => void;
}) => (
  <div>
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
    >
      {expanded ? (
        <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronRight className="w-3 h-3" />
      )}
      {category.name}
      <span className="ml-auto text-[10px] font-normal opacity-60">
        {category.services.length}
      </span>
    </button>
    {expanded && (
      <div className="px-1.5 pb-1 space-y-0.5">
        {category.services.map((s) => (
          <ServiceItem key={s.id} service={s} onDragStart={onDragStart} />
        ))}
      </div>
    )}
  </div>
);

const ComponentSidebar = () => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState("aws");

  const toggle = (name: string) =>
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  const isExpanded = (name: string) => expanded[name] ?? false;

  const onDragStart = (event: React.DragEvent, service: CloudService) => {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        id: service.id,
        label: service.label,
        icon: service.abbr,
        description: service.description,
        color: service.color,
        textColor: service.textColor,
      })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  const filterCategories = (cats: CloudCategory[]) =>
    cats
      .map((cat) => ({
        ...cat,
        services: cat.services.filter(
          (s) =>
            s.label.toLowerCase().includes(search.toLowerCase()) ||
            s.description.toLowerCase().includes(search.toLowerCase()) ||
            s.abbr.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((cat) => cat.services.length > 0);

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col h-full">
      <div className="p-2.5 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm bg-muted/50"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0 shrink-0">
          {cloudProviders.map((p) => (
            <TabsTrigger
              key={p.id}
              value={p.id}
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-2 font-semibold"
            >
              {p.name}
            </TabsTrigger>
          ))}
          <TabsTrigger
            value="generic"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-2 font-semibold"
          >
            Other
          </TabsTrigger>
        </TabsList>

        {cloudProviders.map((provider) => (
          <TabsContent
            key={provider.id}
            value={provider.id}
            className="flex-1 overflow-y-auto mt-0 py-1"
          >
            {filterCategories(provider.categories).map((cat) => (
              <CategoryGroup
                key={cat.name}
                category={cat}
                expanded={isExpanded(`${provider.id}-${cat.name}`)}
                onToggle={() => toggle(`${provider.id}-${cat.name}`)}
                onDragStart={onDragStart}
              />
            ))}
          </TabsContent>
        ))}

        <TabsContent value="generic" className="flex-1 overflow-y-auto mt-0 py-1">
          {filterCategories(genericCategories).map((cat) => (
            <CategoryGroup
              key={cat.name}
              category={cat}
              expanded={isExpanded(`generic-${cat.name}`)}
              onToggle={() => toggle(`generic-${cat.name}`)}
              onDragStart={onDragStart}
            />
          ))}
        </TabsContent>
      </Tabs>
    </aside>
  );
};

export default ComponentSidebar;
