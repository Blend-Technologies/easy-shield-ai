import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Compass,
  ChevronDown,
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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
const sparkSteps = [
  {
    letter: "S",
    title: "Scope the Solution",
    icon: Compass,
    color: "text-electric-blue-400",
    bgColor: "bg-electric-blue-400/10",
    borderColor: "border-electric-blue-400/40",
    description: "Design the software or analytics roadmap.",
    cards: [
      { title: "Proposal Writer", description: "Generate enterprise-ready proposals from your RFP documents with AI-powered compliance analysis.", action: "Write Proposal", link: "/dashboard/proposal-writer", icon: FileEdit },
      { title: "Best Practice Engine", description: "Get AI-powered recommendations tailored to your platform, integration scenario, and enterprise context.", action: "Launch Engine", link: "/dashboard/best-practices", icon: Search },
      { title: "Design Visualizer", description: "Generate comprehensive visual designs of your application pipeline, illustrating data flow and architecture.", action: "Open Visualizer", link: "/dashboard/visualizer", icon: Eye },
    ],
  },
  {
    letter: "P",
    title: "Protect the Pipeline",
    icon: ShieldCheck,
    color: "text-ai-cyan-400",
    bgColor: "bg-ai-cyan-400/10",
    borderColor: "border-ai-cyan-400/40",
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
    color: "text-contract-gold-400",
    bgColor: "bg-contract-gold-400/10",
    borderColor: "border-contract-gold-400/40",
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
    color: "text-ai-cyan-400",
    bgColor: "bg-ai-cyan-400/10",
    borderColor: "border-ai-cyan-400/40",
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
    color: "text-navy-200",
    bgColor: "bg-navy-400/10",
    borderColor: "border-navy-400/40",
    description: "Deploy confidently and deliver to stakeholders.",
    cards: [
      { title: "Proposal Writer", description: "Generate final deliverable documentation, executive summaries, and stakeholder reports.", action: "Generate Docs", link: "/dashboard/proposal-writer", icon: FileEdit },
      { title: "Design Visualizer", description: "Export final architecture diagrams and system documentation for handoff.", action: "Export Diagrams", link: "/dashboard/visualizer", icon: Eye },
    ],
  },
];

const SparkFramework = () => {
  const [selectedKey, setSelectedKey] = useState("0-0");
  const navigate = useNavigate();

  const selected = useMemo(() => {
    const [phaseIdx, cardIdx] = selectedKey.split("-").map(Number);
    const step = sparkSteps[phaseIdx];
    const card = step?.cards[cardIdx];
    return { step, card, phaseIdx, cardIdx };
  }, [selectedKey]);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
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

          <TabsContent value="courses" className="flex-1 m-0 overflow-hidden">
            <div className="flex h-full">
              {/* Accordion sidebar */}
              <div className="w-[240px] flex-shrink-0 border-r border-border bg-card overflow-y-auto">
                <div className="p-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-heading font-semibold text-sm text-foreground">S.P.A.R.K.™</span>
                  </div>
                </div>
                <Accordion type="multiple" defaultValue={["phase-0"]} className="px-1 py-1">
                  {sparkSteps.map((step, phaseIdx) => (
                    <AccordionItem key={step.letter} value={`phase-${phaseIdx}`} className="border-b-0">
                      <AccordionTrigger className="px-3 py-2.5 text-sm hover:no-underline hover:bg-muted/30 rounded-md">
                        <div className="flex items-center gap-2">
                          <step.icon className={`w-4 h-4 flex-shrink-0 ${step.color}`} />
                          <span className="font-medium">{step.letter} – {step.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-1 pt-0">
                        <nav className="flex flex-col gap-0.5 pl-4">
                          {step.cards.map((card, cardIdx) => {
                            const key = `${phaseIdx}-${cardIdx}`;
                            const isActive = selectedKey === key;
                            return (
                              <button
                                key={key}
                                onClick={() => setSelectedKey(key)}
                                className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md text-left transition-colors ${
                                  isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                }`}
                              >
                                <card.icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? step.color : ""}`} />
                                <span className="truncate">{card.title}</span>
                              </button>
                            );
                          })}
                        </nav>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Center content */}
              <div className="flex-1 min-w-0 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {selected.step && selected.card && (
                    <motion.div
                      key={selectedKey}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.2 }}
                      className="p-6"
                    >
                      {/* Phase header */}
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-10 h-10 rounded-lg ${selected.step.bgColor} border ${selected.step.borderColor} flex items-center justify-center`}>
                            <selected.step.icon className={`w-5 h-5 ${selected.step.color}`} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{selected.step.letter} – {selected.step.title}</p>
                            <h1 className="font-heading text-xl font-semibold text-foreground">
                              {selected.card.title}
                            </h1>
                          </div>
                        </div>
                      </div>

                      {/* Card detail */}
                      <div className={`rounded-xl border ${selected.step.borderColor} ${selected.step.bgColor} p-6`}>
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg bg-background/60 border ${selected.step.borderColor} flex items-center justify-center flex-shrink-0`}>
                            <selected.card.icon className={`w-6 h-6 ${selected.step.color}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-heading font-semibold text-foreground text-base mb-1">{selected.card.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{selected.card.description}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 mt-4"
                              onClick={() => navigate(selected.card.link)}
                            >
                              {selected.card.action}
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
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
