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
  ChevronDown,
  Play,
  CheckCircle2,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

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

const totalTools = sparkSteps.reduce((acc, s) => acc + s.cards.length, 0);

const SparkFramework = () => {
  const [expandedStep, setExpandedStep] = useState(0);
  const [selectedCard, setSelectedCard] = useState<{ stepIdx: number; cardIdx: number }>({ stepIdx: 0, cardIdx: 0 });
  const navigate = useNavigate();

  const currentCard = sparkSteps[selectedCard.stepIdx].cards[selectedCard.cardIdx];
  const currentStep = sparkSteps[selectedCard.stepIdx];

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-3.5rem)]">
        {/* Left panel — accordion course-style sidebar */}
        <div className="lg:w-[340px] flex-shrink-0 border-r border-border bg-card overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-bold text-foreground text-lg">S.P.A.R.K.™ Framework</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">0 / {totalTools} complete</p>
            <Progress value={0} className="h-2" />
          </div>

          {/* Accordion steps */}
          <div className="py-1">
            {sparkSteps.map((step, stepIdx) => {
              const isExpanded = expandedStep === stepIdx;
              return (
                <div key={step.letter}>
                  {/* Step header */}
                  <button
                    onClick={() => setExpandedStep(isExpanded ? -1 : stepIdx)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                        isExpanded ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      Phase {stepIdx + 1}: {step.title}
                    </span>
                  </button>

                  {/* Expanded tool list */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {step.cards.map((card, cardIdx) => {
                          const isSelected =
                            selectedCard.stepIdx === stepIdx && selectedCard.cardIdx === cardIdx;
                          return (
                            <button
                              key={card.title}
                              onClick={() => setSelectedCard({ stepIdx, cardIdx })}
                              className={`w-full flex items-center gap-3 pl-11 pr-4 py-2.5 text-left text-sm transition-colors ${
                                isSelected
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                              }`}
                            >
                              <Play className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{card.title}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right content — selected tool detail */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCard.stepIdx}-${selectedCard.cardIdx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h1 className="font-heading text-xl font-semibold text-foreground">
                  {currentCard.title}
                </h1>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate(currentCard.link)}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Complete
                </Button>
              </div>

              {/* Main content area */}
              <div className="flex-1 p-6">
                <div className={`w-full rounded-xl ${currentStep.bgColor} border ${currentStep.borderColor} flex flex-col items-center justify-center min-h-[400px] gap-6`}>
                  <currentCard.icon className={`w-20 h-20 ${currentStep.color} opacity-60`} />
                  <div className="text-center max-w-md px-4">
                    <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
                      {currentCard.title}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {currentCard.description}
                    </p>
                    <Button onClick={() => navigate(currentCard.link)} className="gap-2">
                      {currentCard.action}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SparkFramework;
