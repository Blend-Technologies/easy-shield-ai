import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 bg-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4 text-primary-foreground">
            Ready to Secure Your Integrations?
          </h2>
          <p className="text-primary-foreground/60 max-w-lg mx-auto mb-8 text-lg">
            Join hundreds of enterprise consultants who've eliminated manual security research.
          </p>
          <Link to="/signup">
            <Button variant="hero" size="xl">
              Get Started Free <ArrowRight className="ml-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
