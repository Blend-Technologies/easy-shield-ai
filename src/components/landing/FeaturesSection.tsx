import { motion } from "framer-motion";
import { Shield, Search, BookOpen, Eye, Plug, ArrowRight, FileEdit, Sparkles, Users, MessageSquare, Star, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sparkSteps = [
  { letter: "S", title: "Scope the Solution", description: "Design the software or analytics roadmap." },
  { letter: "P", title: "Protect the Pipeline", description: "Architect security, compliance, and infrastructure in Azure/AWS/GCP." },
  { letter: "A", title: "Assemble the Build", description: "Develop or configure the AI system using Lovable or Claude." },
  { letter: "R", title: "Review & Reinforce", description: "Expert validation and vulnerability check. Run structured audits before release." },
  { letter: "K", title: "Kickoff Delivery", description: "Deploy confidently and deliver to stakeholders." },
];

const features = [
  {
    icon: Search,
    title: "Contextual Best Practice Engine",
    description:
      "Real-time, AI-powered recommendations tailored to your specific platform, integration scenario, and enterprise context.",
    accent: "neon-pink" as const,
    gradient: "from-neon-pink-400/20 to-indigo-bloom-400/20",
    iconBg: "bg-neon-pink-400/15",
    iconColor: "text-neon-pink-400",
    borderHover: "hover:border-neon-pink-400/40",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(330_93%_56%/0.15)]",
  },
  {
    icon: Shield,
    title: "Cybersecurity",
    description:
      "Automated analysis of your configurations to identify vulnerabilities and bottlenecks with actionable remediation steps.",
    accent: "sky-aqua" as const,
    gradient: "from-sky-aqua-400/20 to-electric-sapphire-400/20",
    iconBg: "bg-sky-aqua-400/15",
    iconColor: "text-sky-aqua-400",
    borderHover: "hover:border-sky-aqua-400/40",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(196_86%_62%/0.15)]",
  },
  {
    icon: BookOpen,
    title: "Collaborative Knowledge Base",
    description:
      "Community-driven repository of proven patterns and validated solutions, curated by industry experts.",
    accent: "indigo-bloom" as const,
    gradient: "from-indigo-bloom-400/20 to-vivid-royal-400/20",
    iconBg: "bg-indigo-bloom-400/15",
    iconColor: "text-indigo-bloom-300",
    borderHover: "hover:border-indigo-bloom-400/40",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(275_90%_39%/0.15)]",
  },
  {
    icon: Eye,
    title: "End-to-End Design Visualizer",
    description:
      "Generate comprehensive visual designs of your application pipeline, illustrating data flow and security layers.",
    accent: "electric-sapphire" as const,
    gradient: "from-electric-sapphire-400/20 to-sky-aqua-400/20",
    iconBg: "bg-electric-sapphire-400/15",
    iconColor: "text-electric-sapphire-300",
    borderHover: "hover:border-electric-sapphire-400/40",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(229_83%_60%/0.15)]",
    link: "/dashboard/visualizer",
  },
  {
    icon: Plug,
    title: "Platform Integration Manager",
    description:
      "Seamlessly connect to Salesforce, OutSystems, Mendix, Bubble and more via secure API or OAuth flows.",
    accent: "vivid-royal" as const,
    gradient: "from-vivid-royal-400/20 to-neon-pink-400/20",
    iconBg: "bg-vivid-royal-400/15",
    iconColor: "text-vivid-royal-200",
    borderHover: "hover:border-vivid-royal-400/40",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(257_88%_34%/0.15)]",
  },
  {
    icon: FileEdit,
    title: "Proposal Writer",
    description:
      "AI-powered proposal generator for enterprise and government contracts. Upload docs, select your model, and export as Word.",
    accent: "sky-aqua" as const,
    gradient: "from-sky-aqua-400/20 to-neon-pink-400/20",
    iconBg: "bg-sky-aqua-400/15",
    iconColor: "text-sky-aqua-400",
    borderHover: "hover:border-sky-aqua-400/40",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(196_86%_62%/0.15)]",
    link: "/dashboard/proposal-writer",
  },
];

const letterColors = [
  "text-neon-pink-400",
  "text-indigo-bloom-300",
  "text-electric-sapphire-300",
  "text-sky-aqua-400",
  "text-vivid-royal-200",
];

const FeaturesSection = () => {
  const navigate = useNavigate();

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4 text-foreground">
            Everything You Need to{" "}
            <span className="text-gradient-primary">Secure & Scale</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Six powerful tools working together to eliminate manual research and deliver enterprise-grade security.
          </p>
        </motion.div>

        {/* SPARK Framework Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="group relative rounded-2xl p-[1px] bg-gradient-to-r from-neon-pink-400 via-indigo-bloom-400 to-electric-sapphire-400 animate-pulse-glow cursor-pointer overflow-hidden" onClick={() => navigate("/dashboard/spark")}>
            <div className="relative rounded-2xl bg-card/95 backdrop-blur-xl p-8 md:p-10 overflow-hidden">
              {/* Background shimmer */}
              <div className="absolute inset-0 bg-gradient-to-br from-neon-pink-400/5 via-transparent to-electric-sapphire-400/5" />
              
              <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">
                {/* Left: Branding */}
                <div className="flex-shrink-0 lg:w-2/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-pink-400/20 to-indigo-bloom-400/20 flex items-center justify-center border border-neon-pink-400/30">
                      <Sparkles className="w-7 h-7 text-neon-pink-400" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-2xl text-foreground tracking-tight">
                        The S.P.A.R.K.™
                      </h3>
                      <p className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground">
                        AI Framework
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm mb-4 max-w-md">
                    A unified, end-to-end methodology that orchestrates every capability on this platform — from initial scoping through secure delivery — into one guided workflow.
                  </p>
              <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:translate-x-1 transition-transform duration-300" onClick={() => navigate("/dashboard/spark")}>
                    Start the SPARK workflow <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Right: Steps */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-3 w-full">
                  {sparkSteps.map((step, i) => (
                    <motion.div
                      key={step.letter}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="relative flex flex-col items-center text-center p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors duration-200"
                    >
                      <span className={`font-heading font-extrabold text-2xl ${letterColors[i]} mb-1`}>
                        {step.letter}
                      </span>
                      <span className="font-heading font-semibold text-xs text-foreground mb-1 leading-tight">
                        {step.title}
                      </span>
                      <span className="text-muted-foreground text-[11px] leading-snug">
                        {step.description}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Community Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="group relative rounded-2xl p-[1px] bg-gradient-to-r from-sky-aqua-400 via-electric-sapphire-400 to-indigo-bloom-400 cursor-pointer overflow-hidden" onClick={() => navigate("/community/create")}>
            <div className="relative rounded-2xl bg-card/95 backdrop-blur-xl p-8 md:p-10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-aqua-400/5 via-transparent to-indigo-bloom-400/5" />

              <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">
                {/* Left: Branding */}
                <div className="flex-shrink-0 lg:w-2/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-aqua-400/20 to-indigo-bloom-400/20 flex items-center justify-center border border-sky-aqua-400/30">
                      <Users className="w-7 h-7 text-sky-aqua-400" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-2xl text-foreground tracking-tight">
                        Create a Community
                      </h3>
                      <p className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground">
                        Collaborate & Grow Together
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm mb-4 max-w-md">
                    Build and grow a collaborative network of professionals, share knowledge, validate solutions, and accelerate delivery through collective intelligence.
                  </p>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:translate-x-1 transition-transform duration-300">
                    Join the community <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Right: Community pillars */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 w-full">
                  {[
                    { icon: MessageSquare, label: "Open Discussions", desc: "Engage in real-time threads with peers and experts.", color: "text-sky-aqua-400", bg: "bg-sky-aqua-400/15" },
                    { icon: Star, label: "Curated Resources", desc: "Access expert-vetted templates, guides and playbooks.", color: "text-neon-pink-400", bg: "bg-neon-pink-400/15" },
                    { icon: Globe, label: "Global Network", desc: "Connect with practitioners across industries worldwide.", color: "text-indigo-bloom-300", bg: "bg-indigo-bloom-400/15" },
                    { icon: Shield, label: "Trust & Safety", desc: "Verified members and moderated, secure spaces.", color: "text-electric-sapphire-300", bg: "bg-electric-sapphire-400/15" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors duration-200"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${item.bg}`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className="font-heading font-semibold text-xs text-foreground mb-1 leading-tight">
                        {item.label}
                      </span>
                      <span className="text-muted-foreground text-[11px] leading-snug">
                        {item.desc}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              onClick={() => feature.link && navigate(feature.link)}
              className={`group relative glass-card rounded-2xl p-8 cursor-pointer transition-all duration-300 ${feature.borderHover} ${feature.glowColor}`}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${feature.iconBg} transition-transform duration-300 group-hover:scale-110`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
