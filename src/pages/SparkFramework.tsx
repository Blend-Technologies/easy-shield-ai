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
    borderColor: "border-neon-pink-400/30",
    description: "Design the software or analytics roadmap.",
    detail:
      "Define your project scope, identify requirements, and create a comprehensive roadmap for your software or analytics solution.",
    cards: [
      {
        title: "Best Practice Engine",
        description:
          "Get AI-powered recommendations tailored to your platform, integration scenario, and enterprise context.",
        action: "Launch Engine",
        link: "/dashboard/best-practices",
        icon: Search,
      },
      {
        title: "Design Visualizer",
        description:
          "Generate comprehensive visual designs of your application pipeline, illustrating data flow and architecture.",
        action: "Open Visualizer",
        link: "/dashboard/visualizer",
        icon: Eye,
      },
      {
        title: "Proposal Writer",
        description:
          "Generate enterprise-ready proposals from your RFP documents with AI-powered compliance analysis.",
        action: "Write Proposal",
        link: "/dashboard/proposal-writer",
        icon: FileEdit,
      },
    ],
  },
  {
    letter: "P",
    title: "Protect the Pipeline",
    icon: ShieldCheck,
    color: "text-indigo-bloom-300",
    bgColor: "bg-indigo-bloom-400/10",
    borderColor: "border-indigo-bloom-400/30",
    description: "Architect security, compliance, and infrastructure in Azure/AWS/GCP.",
    detail:
      "Establish security guardrails, compliance frameworks, and cloud infrastructure best practices for your deployment targets.",
    cards: [
      {
        title: "Security Scanner",
        description:
          "Automated vulnerability analysis of your configurations with actionable remediation steps.",
        action: "Run Scanner",
        link: "/dashboard/scanner",
        icon: Shield,
      },
      {
        title: "Platform Connections",
        description:
          "Securely connect to Salesforce, OutSystems, Mendix, Bubble, and more via API or OAuth.",
        action: "Manage Connections",
        link: "/dashboard/connections",
        icon: Plug,
      },
    ],
  },
  {
    letter: "A",
    title: "Assemble the Build",
    icon: Wrench,
    color: "text-electric-sapphire-300",
    bgColor: "bg-electric-sapphire-400/10",
    borderColor: "border-electric-sapphire-400/30",
    description: "Develop or configure the AI system using Lovable or Claude.",
    detail:
      "Build your solution with AI-assisted development tools. Configure integrations, set up data pipelines, and assemble components.",
    cards: [
      {
        title: "Design Visualizer",
        description:
          "Map out your system architecture, data flows, and integration points visually.",
        action: "Open Visualizer",
        link: "/dashboard/visualizer",
        icon: Eye,
      },
      {
        title: "Knowledge Base",
        description:
          "Access community-driven repository of proven patterns and validated solutions.",
        action: "Browse Knowledge",
        link: "/dashboard/knowledge",
        icon: BookOpen,
      },
    ],
  },
  {
    letter: "R",
    title: "Review & Reinforce",
    icon: ClipboardCheck,
    color: "text-sky-aqua-400",
    bgColor: "bg-sky-aqua-400/10",
    borderColor: "border-sky-aqua-400/30",
    description: "Expert validation and vulnerability check. Run structured audits before release.",
    detail:
      "Conduct thorough reviews, run security audits, and validate your build against enterprise standards before deployment.",
    cards: [
      {
        title: "Security Scanner",
        description:
          "Run a final vulnerability scan and compliance check before deploying your solution.",
        action: "Run Audit",
        link: "/dashboard/scanner",
        icon: Shield,
      },
      {
        title: "Best Practice Engine",
        description:
          "Validate your implementation against industry best practices and enterprise patterns.",
        action: "Validate",
        link: "/dashboard/best-practices",
        icon: Search,
      },
    ],
  },
  {
    letter: "K",
    title: "Kickoff Delivery",
    icon: Rocket,
    color: "text-vivid-royal-200",
    bgColor: "bg-vivid-royal-400/10",
    borderColor: "border-vivid-royal-400/30",
    description: "Deploy confidently and deliver to stakeholders.",
    detail:
      "Finalize your deliverables, generate stakeholder-ready documentation, and deploy with confidence.",
    cards: [
      {
        title: "Proposal Writer",
        description:
          "Generate final deliverable documentation, executive summaries, and stakeholder reports.",
        action: "Generate Docs",
        link: "/dashboard/proposal-writer",
        icon: FileEdit,
      },
      {
        title: "Design Visualizer",
        description:
          "Export final architecture diagrams and system documentation for handoff.",
        action: "Export Diagrams",
        link: "/dashboard/visualizer",
        icon: Eye,
      },
    ],
  },
];

const SparkFramework = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const current = sparkSteps[activeStep];

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-pink-400/20 to-indigo-bloom-400/20 flex items-center justify-center border border-neon-pink-400/30">
            <Sparkles className="w-5 h-5 text-neon-pink-400" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              The S.P.A.R.K.™ AI Framework
            </h1>
            <p className="text-sm text-muted-foreground">
              Your guided workflow from scoping through secure delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Step tabs — horizontal like Azure */}
      <div className="flex items-center gap-1 border-b border-border mb-8 overflow-x-auto pb-px">
        {sparkSteps.map((step, i) => {
          const isActive = i === activeStep;
          return (
            <button
              key={step.letter}
              onClick={() => setActiveStep(i)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`font-heading font-extrabold text-base ${step.color}`}>
                {step.letter}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
              {isActive && (
                <motion.div
                  layoutId="spark-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step heading */}
          <div className="mb-6">
            <h2 className="font-heading text-xl font-bold text-foreground mb-1">
              {current.detail}
            </h2>
            <p className="text-muted-foreground text-sm">
              {current.description}
            </p>
          </div>

          {/* Cards grid — Azure Foundry style */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {current.cards.map((card) => (
              <div
                key={card.title}
                className="group rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Illustration area */}
                <div className={`h-40 ${current.bgColor} flex items-center justify-center border-b border-border/50`}>
                  <card.icon className={`w-16 h-16 ${current.color} opacity-60 group-hover:opacity-90 transition-opacity`} />
                </div>

                {/* Text */}
                <div className="p-5 flex-1">
                  <h3 className="font-heading font-semibold text-base text-foreground mb-1.5">
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
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default SparkFramework;
