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
  ArrowLeft,
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
    description: "Design the software or analytics roadmap.",
    detail:
      "Define your project scope, identify requirements, and create a comprehensive roadmap for your software or analytics solution.",
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
    description: "Architect security, compliance, and infrastructure in Azure/AWS/GCP.",
    detail: "Establish security guardrails, compliance frameworks, and cloud infrastructure best practices.",
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
    description: "Develop or configure the AI system using Lovable or Claude.",
    detail: "Build your solution with AI-assisted development tools. Configure integrations and assemble components.",
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
    description: "Expert validation and vulnerability check before release.",
    detail: "Conduct thorough reviews, run security audits, and validate your build against enterprise standards.",
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
    description: "Deploy confidently and deliver to stakeholders.",
    detail: "Finalize your deliverables, generate stakeholder-ready documentation, and deploy with confidence.",
    cards: [
      { title: "Proposal Writer", description: "Generate final deliverable documentation, executive summaries, and stakeholder reports.", action: "Generate Docs", link: "/dashboard/proposal-writer", icon: FileEdit },
      { title: "Design Visualizer", description: "Export final architecture diagrams and system documentation for handoff.", action: "Export Diagrams", link: "/dashboard/visualizer", icon: Eye },
    ],
  },
];

const SparkFramework = () => {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const navigate = useNavigate();

  // Overview mode — show 5 SPARK step cards
  if (selectedStep === null) {
    return (
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
            The S.P.A.R.K.™ AI Framework
          </h1>
          <p className="text-muted-foreground text-sm max-w-3xl">
            Your guided workflow from scoping through secure delivery. Select a phase to explore available tools and resources.
          </p>
        </div>

        {/* Step cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sparkSteps.map((step, i) => (
            <motion.div
              key={step.letter}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setSelectedStep(i)}
              className="group cursor-pointer rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
            >
              {/* Illustration area */}
              <div className={`h-36 ${step.bgColor} flex items-center justify-center`}>
                <step.icon className={`w-14 h-14 ${step.color} opacity-50 group-hover:opacity-80 transition-opacity duration-200`} />
              </div>

              {/* Content */}
              <div className="p-5 flex-1">
                <h3 className="font-heading font-semibold text-base text-foreground mb-1">
                  <span className={step.color}>{step.letter}</span> — {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Action */}
              <div className="px-5 pb-5">
                <Button variant="outline" className="w-full justify-center gap-2">
                  Explore phase
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // Detail mode — show tools for selected step
  const current = sparkSteps[selectedStep];

  return (
    <DashboardLayout>
      {/* Back + Header */}
      <div className="mb-8">
        <button
          onClick={() => setSelectedStep(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to S.P.A.R.K. overview
        </button>
        <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
          <span className={current.color}>{current.letter}</span> — {current.title}
        </h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          {current.detail}
        </p>
      </div>

      {/* Tool cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {current.cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
            >
              <div className={`h-36 ${current.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-14 h-14 ${current.color} opacity-50 group-hover:opacity-80 transition-opacity duration-200`} />
              </div>

              <div className="p-5 flex-1">
                <h3 className="font-heading font-semibold text-base text-foreground mb-1">
                  {card.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>

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
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default SparkFramework;
