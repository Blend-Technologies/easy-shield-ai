import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Integration Architect, Deloitte",
    quote: "EZShield+AI cut our security review time by 70%. What used to take days now takes hours with actionable, expert-level recommendations.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Senior Consultant, Accenture",
    quote: "The automated scanner caught vulnerabilities we missed in three separate manual reviews. This is a game-changer for enterprise integrations.",
    rating: 5,
  },
  {
    name: "Priya Patel",
    role: "Tech Lead, Capgemini",
    quote: "The knowledge base alone is worth the subscription. Having validated patterns from real enterprise implementations saves us weeks per project.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4 text-foreground">
            Trusted by <span className="text-gradient-primary">Enterprise Teams</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            See how integration consultants are saving time and delivering better results.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-8"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground/80 mb-6 text-sm leading-relaxed italic">
                "{t.quote}"
              </p>
              <div>
                <p className="font-heading font-semibold text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
