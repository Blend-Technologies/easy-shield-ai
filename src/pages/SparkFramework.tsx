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
  Users,
  GraduationCap,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const sparkSteps = [
  {
    letter: "S",
    title: "Scope the Solution",
    icon: Compass,
    color: "text-neon-pink-400",
    bgColor: "bg-neon-pink-400/10",
    borderColor: "border-neon-pink-400/40",
    description: "Design the software or analytics roadmap.",
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
    cards: [
      { title: "Proposal Writer", description: "Generate final deliverable documentation, executive summaries, and stakeholder reports.", action: "Generate Docs", link: "/dashboard/proposal-writer", icon: FileEdit },
      { title: "Design Visualizer", description: "Export final architecture diagrams and system documentation for handoff.", action: "Export Diagrams", link: "/dashboard/visualizer", icon: Eye },
    ],
  },
];

const SparkFramework = () => {
  const [activePhase, setActivePhase] = useState(0);
  const navigate = useNavigate();
  const currentStep = sparkSteps[activePhase];

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Horizontal top tabs */}
        <Tabs defaultValue="courses" className="flex flex-col h-full">
          <div className="border-b border-border px-6">
            <TabsList className="bg-transparent h-12 gap-4 p-0">
              <TabsTrigger
                value="team"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12 gap-2"
              >
                <Users className="w-4 h-4" />
                Team
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12 gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                Courses
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Team tab content */}
          <TabsContent value="team" className="flex-1 m-0 overflow-y-auto">
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
              <Users className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <h2 className="font-heading text-xl font-semibold text-foreground mb-2">Team Management</h2>
              <p className="text-muted-foreground text-sm max-w-md">
                Collaborate with your team members, assign roles across SPARK phases, and track collective progress.
              </p>
              <Button variant="outline" className="mt-6">Coming Soon</Button>
            </div>
          </TabsContent>

          {/* Courses tab content */}
          <TabsContent value="courses" className="flex-1 m-0 overflow-hidden">
            <div className="flex h-full">
              {/* Vertical phase tabs */}
              <div className="w-[220px] flex-shrink-0 border-r border-border bg-card overflow-y-auto">
                <div className="p-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-heading font-semibold text-sm text-foreground">S.P.A.R.K.™</span>
                  </div>
                </div>
                <nav className="py-1">
                  {sparkSteps.map((step, idx) => {
                    const isActive = activePhase === idx;
                    return (
                      <button
                        key={step.letter}
                        onClick={() => setActivePhase(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent"
                        }`}
                      >
                        <step.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? step.color : ""}`} />
                        <span className="truncate">{step.letter} – {step.title.split(" ").slice(0, 2).join(" ")}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Center content */}
              <div className="flex-1 min-w-0 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePhase}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    {/* Phase header */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg ${currentStep.bgColor} border ${currentStep.borderColor} flex items-center justify-center`}>
                          <currentStep.icon className={`w-5 h-5 ${currentStep.color}`} />
                        </div>
                        <div>
                          <h1 className="font-heading text-xl font-semibold text-foreground">
                            {currentStep.letter} – {currentStep.title}
                          </h1>
                          <p className="text-sm text-muted-foreground">{currentStep.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tool cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {currentStep.cards.map((card) => (
                        <div
                          key={card.title}
                          className={`rounded-xl border ${currentStep.borderColor} ${currentStep.bgColor} p-5 flex flex-col gap-4 hover:shadow-md transition-shadow`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-lg bg-background/60 border ${currentStep.borderColor} flex items-center justify-center flex-shrink-0`}>
                              <card.icon className={`w-4 h-4 ${currentStep.color}`} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-heading font-semibold text-foreground text-sm">{card.title}</h3>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{card.description}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="self-start gap-2 mt-auto"
                            onClick={() => navigate(card.link)}
                          >
                            {card.action}
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SparkFramework;
