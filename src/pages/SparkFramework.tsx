import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Compass,
  ShieldCheck,
  Wrench,
  ClipboardCheck,
  Rocket,
  ArrowRight,
  Eye,
  Shield,
  Search,
  FileEdit,
  Plug,
  BookOpen,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const sparkSteps = [
  {
    letter: "S",
    title: "Scope the Solution",
    icon: Compass,
    color: "text-neon-pink-400",
    bgColor: "bg-neon-pink-400/10",
    borderColor: "border-neon-pink-400/40",
    description: "Design the software or analytics roadmap.",
    detail: "Define your project scope, identify requirements, and create a comprehensive roadmap for your software or analytics solution.",
    cards: [
      { title: "Best Practice Engine", description: "Get AI-powered recommendations tailored to your platform, integration scenario, and enterprise context.", action: "Launch Engine", link: "/dashboard/best-practices", icon: Search },
      { title: "Design Visualizer", description: "Generate comprehensive visual designs of your application pipeline, illustrating data flow and architecture.", action: "Open Visualizer", link: "/dashboard/visualizer", icon: Eye },
      { title: "Proposal Writer", description: "Generate enterprise-ready proposals from your RFP documents with AI-powered compliance analysis.", action: "Write Proposal", link: "/dashboard/proposal-writer", icon: FileEdit },
    ],
  },
  {
    letter: "P",
    title: "Protect the Pipeline",
    icon: ShieldCheck,
    color: "text-indigo-bloom-300",
    bgColor: "bg-indigo-bloom-400/10",
    borderColor: "border-indigo-bloom-400/40",
    description: "Architect security, compliance, and infrastructure.",
    detail: "Establish security guardrails, compliance frameworks, and cloud infrastructure best practices for your deployment targets.",
    cards: [
      { title: "Security Scanner", description: "Automated vulnerability analysis of your configurations with actionable remediation steps.", action: "Run Scanner", link: "/dashboard/scanner", icon: Shield },
      { title: "Platform Connections", description: "Securely connect to Salesforce, OutSystems, Mendix, Bubble, and more via API or OAuth.", action: "Manage Connections", link: "/dashboard/connections", icon: Plug },
    ],
  },
  {
    letter: "A",
    title: "Assemble the Build",
    icon: Wrench,
    color: "text-electric-sapphire-300",
    bgColor: "bg-electric-sapphire-400/10",
    borderColor: "border-electric-sapphire-400/40",
    description: "Develop or configure the AI system.",
    detail: "Build your solution with AI-assisted development tools. Configure integrations, set up data pipelines, and assemble components.",
    cards: [
      { title: "Design Visualizer", description: "Map out your system architecture, data flows, and integration points visually.", action: "Open Visualizer", link: "/dashboard/visualizer", icon: Eye },
      { title: "Knowledge Base", description: "Access community-driven repository of proven patterns and validated solutions.", action: "Browse Knowledge", link: "/dashboard/knowledge", icon: BookOpen },
    ],
  },
  {
    letter: "R",
    title: "Review & Reinforce",
    icon: ClipboardCheck,
    color: "text-sky-aqua-400",
    bgColor: "bg-sky-aqua-400/10",
    borderColor: "border-sky-aqua-400/40",
    description: "Expert validation and vulnerability check.",
    detail: "Conduct thorough reviews, run security audits, and validate your build against enterprise standards before deployment.",
    cards: [
      { title: "Security Scanner", description: "Run a final vulnerability scan and compliance check before deploying your solution.", action: "Run Audit", link: "/dashboard/scanner", icon: Shield },
      { title: "Best Practice Engine", description: "Validate your implementation against industry best practices and enterprise patterns.", action: "Validate", link: "/dashboard/best-practices", icon: Search },
    ],
  },
  {
    letter: "K",
    title: "Kickoff Delivery",
    icon: Rocket,
    color: "text-vivid-royal-200",
    bgColor: "bg-vivid-royal-400/10",
    borderColor: "border-vivid-royal-400/40",
    description: "Deploy confidently and deliver to stakeholders.",
    detail: "Finalize your deliverables, generate stakeholder-ready documentation, and deploy with confidence.",
    cards: [
      { title: "Proposal Writer", description: "Generate final deliverable documentation, executive summaries, and stakeholder reports.", action: "Generate Docs", link: "/dashboard/proposal-writer", icon: FileEdit },
      { title: "Design Visualizer", description: "Export final architecture diagrams and system documentation for handoff.", action: "Export Diagrams", link: "/dashboard/visualizer", icon: Eye },
    ],
  },
];

const SparkFramework = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const current = sparkSteps[activeStep];

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left sidebar — vertical step list */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Sparkles className="w-4 h-4 text-neon-pink-400" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              S.P.A.R.K. Phases
            </span>
          </div>
          <nav className="space-y-0.5">
            {sparkSteps.map((step, i) => {
              const isActive = i === activeStep;
              return (
                <button
                  key={step.letter}
                  onClick={() => setActiveStep(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <step.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? step.color : ""}`} />
                  <span className="truncate">
                    <span className={`font-bold mr-1 ${isActive ? step.color : ""}`}>{step.letter}</span>
                    {step.title}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right content — header + cards */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="mb-6">
                <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
                  {current.detail}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {current.description}
                </p>
              </div>

              {/* Cards grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {current.cards.map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="group rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
                  >
                    {/* Illustration area */}
                    <div className={`h-36 ${current.bgColor} flex items-center justify-center`}>
                      <card.icon className={`w-14 h-14 ${current.color} opacity-50 group-hover:opacity-80 transition-opacity duration-200`} />
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1">
                      <h3 className="font-heading font-semibold text-base text-foreground mb-1">
                        {card.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="px-5 pb-5">
                      <Button
                        variant="outline"
                        className="w-full justify-center gap-2"
                        onClick={() => navigate(card.link)}
                      >
                        {card.action}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SparkFramework;
