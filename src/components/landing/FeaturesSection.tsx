import { motion } from "framer-motion";
import { Shield, Search, BookOpen, Eye, Plug } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Contextual Best Practice Engine",
    description:
      "Real-time, AI-powered recommendations tailored to your specific platform, integration scenario, and enterprise context.",
    accent: "primary",
  },
  {
    icon: Shield,
    title: "Security & Scalability Scanner",
    description:
      "Automated analysis of your configurations to identify vulnerabilities and bottlenecks with actionable remediation steps.",
    accent: "accent",
  },
  {
    icon: BookOpen,
    title: "Collaborative Knowledge Base",
    description:
      "Community-driven repository of proven patterns and validated solutions, curated by industry experts.",
    accent: "secondary",
  },
  {
    icon: Eye,
    title: "End-to-End Design Visualizer",
    description:
      "Generate comprehensive visual designs of your application pipeline, illustrating data flow and security layers.",
    accent: "primary",
  },
  {
    icon: Plug,
    title: "Platform Integration Manager",
    description:
      "Seamlessly connect to Salesforce, OutSystems, Mendix, Bubble and more via secure API or OAuth flows.",
    accent: "accent",
  },
];

const iconColors: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  accent: "text-accent bg-accent/10",
  secondary: "text-secondary bg-secondary/10",
};

const FeaturesSection = () => {
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
              className="group glass-card rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${iconColors[feature.accent]}`}
              >
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
