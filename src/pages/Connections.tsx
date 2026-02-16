import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plug, CheckCircle, ExternalLink } from "lucide-react";
import { useState } from "react";

const platforms = [
  {
    name: "Salesforce",
    description: "CRM & enterprise application platform",
    connected: true,
    icon: "🔷",
  },
  {
    name: "OutSystems",
    description: "Low-code application development",
    connected: true,
    icon: "🔴",
  },
  {
    name: "Mendix",
    description: "Enterprise low-code platform",
    connected: false,
    icon: "🟢",
  },
  {
    name: "Bubble",
    description: "No-code web application builder",
    connected: false,
    icon: "🔵",
  },
  {
    name: "Microsoft Power Platform",
    description: "Low-code business application suite",
    connected: false,
    icon: "🟣",
  },
  {
    name: "Appian",
    description: "Enterprise automation platform",
    connected: false,
    icon: "🟠",
  },
];

const Connections = () => {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = (name: string) => {
    setConnecting(name);
    setTimeout(() => setConnecting(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Platform Connections</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect your No-Code/Low-Code platforms for automated security analysis
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform, i) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-6 flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground text-sm">{platform.name}</h3>
                    <p className="text-xs text-muted-foreground">{platform.description}</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4">
                {platform.connected ? (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-accent">
                      <CheckCircle className="w-3.5 h-3.5" /> Connected
                    </span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" /> Manage
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="hero-outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleConnect(platform.name)}
                    disabled={connecting === platform.name}
                  >
                    {connecting === platform.name ? (
                      "Connecting..."
                    ) : (
                      <>
                        <Plug className="w-3.5 h-3.5 mr-1" /> Connect
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Connections;
