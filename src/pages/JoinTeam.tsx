import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Users } from "lucide-react";

type InviteInfo = {
  full_name: string;
  title: string;
  status: string;
  teams: { name: string; slug: string } | null;
};

type PageState = "loading" | "valid" | "accepting" | "done" | "accepted" | "invalid" | "error";

const JoinTeam = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<PageState>("loading");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      setErrorMsg("No invitation token found in the URL.");
      return;
    }

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      const res = await supabase.functions.invoke("invite-team-member", {
        body: { action: "lookup", token },
      });

      if (res.error || res.data?.error) {
        const msg: string = res.data?.error ?? res.error?.message ?? "Invalid invitation";
        if (msg === "Invitation already accepted") {
          setState("accepted");
        } else {
          setState("invalid");
          setErrorMsg(msg);
        }
        return;
      }

      setInvite(res.data.invite);
      setState("valid");
    };

    load();
  }, [token]);

  const handleAccept = async () => {
    setState("accepting");
    const res = await supabase.functions.invoke("invite-team-member", {
      body: { action: "accept", token },
    });

    if (res.error || res.data?.error) {
      setState("error");
      setErrorMsg(res.data?.error ?? res.error?.message ?? "Failed to accept invitation");
      return;
    }

    setState("done");
  };

  const handleSignup = () => {
    localStorage.setItem("pendingTeamInvite", token);
    navigate("/signup");
  };

  const handleLogin = () => {
    localStorage.setItem("pendingTeamInvite", token);
    navigate("/login");
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">You've joined the team!</h2>
            <p className="text-sm text-muted-foreground">
              Welcome to <strong>{invite?.teams?.name}</strong>. You've been added as{" "}
              <strong>{invite?.title}</strong>.
            </p>
            <Button className="w-full" onClick={() => navigate("/dashboard/spark")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "accepted") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <CheckCircle className="w-12 h-12 text-blue-500 mx-auto" />
            <h2 className="text-xl font-semibold">Already accepted</h2>
            <p className="text-sm text-muted-foreground">
              This invitation has already been accepted.
            </p>
            <Button className="w-full" onClick={() => navigate("/dashboard/spark")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "invalid" || state === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Invalid invitation</h2>
            <p className="text-sm text-muted-foreground">
              {errorMsg || "This invitation link is invalid or has expired."}
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // state === "valid" or "accepting"
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Team Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Team</span>
              <span className="font-medium">{invite?.teams?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your name</span>
              <span className="font-medium">{invite?.full_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary">{invite?.title}</Badge>
            </div>
          </div>

          {isLoggedIn ? (
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={state === "accepting"}
            >
              {state === "accepting" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                You need an account to join this team.
              </p>
              <Button className="w-full" onClick={handleSignup}>
                Create Account
              </Button>
              <Button variant="outline" className="w-full" onClick={handleLogin}>
                Log In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinTeam;
