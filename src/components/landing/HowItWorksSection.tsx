import { motion } from "framer-motion";
import { Plug, Search, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: Plug,
    step: "01",
    title: "Connect Your Platform",
    description: "Securely link your No-Code/Low-Code platform in under 2 minutes via API key or OAuth.",
  },
  {
    icon: Search,
    step: "02",
    title: "Automated Analysis",
    description: "Our AI scans your configurations, integration flows, and architecture for vulnerabilities.",
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Get Actionable Insights",
    description: "Receive expert-vetted recommendations with severity ratings and step-by-step remediation.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4 text-foreground">
            Up & Running in <span className="text-gradient-accent">3 Simple Steps</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            From connection to protection in minutes, not weeks.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="relative mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <item.icon className="w-8 h-8 text-primary" />
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">
                  {item.step}
                </span>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
