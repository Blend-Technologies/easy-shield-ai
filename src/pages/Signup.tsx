import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Building, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.jpeg";

const Signup = () => {
  const [formData, setFormData] = useState({ name: "", email: "", company: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Persist community invite ID so we can auto-enroll after email confirmation
  useEffect(() => {
    const communityId = searchParams.get("community");
    if (communityId) {
      localStorage.setItem("pendingCommunityJoin", communityId);
    }
  }, [searchParams]);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: formData.name, company: formData.company },
      },
    });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Signup failed", description: error.message });
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <img src={logo} alt="EZShield+AI" className="h-16 w-auto rounded-xl mb-4 mx-auto" />
          <span className="font-heading font-bold text-3xl text-foreground block mb-2">
            EZShield<span className="text-gradient-primary">+AI</span>
          </span>
          <div className="glass-card rounded-2xl p-8 mt-6">
            <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">Check your email</h2>
            <p className="text-muted-foreground text-sm">
              We've sent a confirmation link to <strong className="text-foreground">{formData.email}</strong>. Please click the link to verify your account.
            </p>
            <Link to="/login" className="inline-block mt-6">
              <Button variant="outline">Back to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="EZShield+AI" className="h-16 w-auto rounded-xl mb-4" />
          <span className="font-heading font-bold text-3xl text-foreground">
            EZShield<span className="text-gradient-primary">+AI</span>
          </span>
          <p className="text-muted-foreground text-sm mt-2">Start securing your integrations today</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="name" placeholder="John Doe" value={formData.name} onChange={update("name")} className="pl-10" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="you@company.com" value={formData.email} onChange={update("email")} className="pl-10" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company (optional)</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="company" placeholder="Your Company" value={formData.company} onChange={update("company")} className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="password" type="password" placeholder="Min. 8 characters" value={formData.password} onChange={update("password")} className="pl-10" required minLength={8} />
            </div>
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
            {!loading && <ArrowRight className="ml-1 w-4 h-4" />}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
