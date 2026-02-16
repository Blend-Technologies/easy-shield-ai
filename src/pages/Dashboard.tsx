import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Shield, Plug, Search, AlertTriangle, CheckCircle, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const stats = [
  { label: "Connected Platforms", value: "2", icon: Plug, color: "text-primary bg-primary/10" },
  { label: "Scans Completed", value: "14", icon: Search, color: "text-accent bg-accent/10" },
  { label: "Issues Found", value: "7", icon: AlertTriangle, color: "text-destructive bg-destructive/10" },
  { label: "Issues Resolved", value: "5", icon: CheckCircle, color: "text-accent bg-accent/10" },
];

const recentScans = [
  { platform: "Salesforce", date: "Feb 14, 2026", issues: 2, status: "warning" },
  { platform: "OutSystems", date: "Feb 13, 2026", issues: 0, status: "clean" },
  { platform: "Mendix", date: "Feb 12, 2026", issues: 5, status: "critical" },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your integration security posture</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-5"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent Scans */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground">Recent Scans</h2>
            <Link to="/dashboard/scanner" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentScans.map((scan) => (
              <div key={scan.platform} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Shield className={`w-5 h-5 ${scan.status === "clean" ? "text-accent" : scan.status === "warning" ? "text-primary" : "text-destructive"}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{scan.platform}</p>
                    <p className="text-xs text-muted-foreground">{scan.date}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  scan.status === "clean"
                    ? "bg-accent/10 text-accent"
                    : scan.status === "warning"
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  {scan.issues === 0 ? "Clean" : `${scan.issues} issues`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/dashboard/connections" className="glass-card rounded-xl p-6 hover:shadow-lg transition-shadow group">
            <Plug className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-heading font-semibold text-foreground mb-1">Connect a Platform</h3>
            <p className="text-sm text-muted-foreground">Add a new No-Code/Low-Code platform for analysis</p>
          </Link>
          <Link to="/dashboard/scanner" className="glass-card rounded-xl p-6 hover:shadow-lg transition-shadow group">
            <Search className="w-8 h-8 text-accent mb-3" />
            <h3 className="font-heading font-semibold text-foreground mb-1">Run a Scan</h3>
            <p className="text-sm text-muted-foreground">Analyze your integrations for security vulnerabilities</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
