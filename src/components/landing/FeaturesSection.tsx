import { motion } from "framer-motion";
import { Shield, Search, BookOpen, Eye, Plug, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
            Five powerful tools working together to eliminate manual research and deliver enterprise-grade security.
          </p>
        </motion.div>

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
              {/* Gradient overlay on hover */}
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
