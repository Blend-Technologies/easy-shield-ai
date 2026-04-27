import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";

import DesignVisualizer from "./pages/DesignVisualizer";
import ProposalWriter from "./pages/ProposalWriter";
import ProposalEvaluator from "./pages/ProposalEvaluator";
import SparkFramework from "./pages/SparkFramework";
import WorkItems from "./pages/WorkItems";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import KanbanBoard from "./pages/KanbanBoard";
import DiagramEditor from "./pages/DiagramEditor";
import NotFound from "./pages/NotFound";
import CommunityCreate from "./pages/CommunityCreate";
import CommunityHub from "./pages/CommunityHub";
import CommunityJoin from "./pages/CommunityJoin";
import CourseBuilder from "./pages/CourseBuilder";
import CoursePlayer from "./pages/CoursePlayer";
import MiniCourseViewer from "./pages/MiniCourseViewer";
import AccountSettings from "./pages/AccountSettings";
import ProfileSettings from "./pages/ProfileSettings";
import { useOnlinePresence } from "./hooks/useOnlinePresence";
import { useEffect } from "react";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

const OnlinePresenceTracker = () => {
  useOnlinePresence();
  return null;
};

// Auto-enroll user in a community after signup via invite link
const PendingCommunityJoin = () => {
  useEffect(() => {
    const handleJoin = async () => {
      const communityId = localStorage.getItem("pendingCommunityJoin");
      if (!communityId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already enrolled
      const { data: existing } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("course_id", communityId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("course_enrollments").insert({
          course_id: communityId,
          user_id: user.id,
        });
      }
      localStorage.removeItem("pendingCommunityJoin");
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        handleJoin();
      }
    });
    // Also check on mount (e.g. returning from email confirmation)
    handleJoin();

    return () => subscription.unsubscribe();
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OnlinePresenceTracker />
      <PendingCommunityJoin />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/dashboard/visualizer" element={<DesignVisualizer />} />
          <Route path="/dashboard/proposal-writer" element={<ProposalWriter />} />
          <Route path="/dashboard/proposal-evaluator" element={<ProposalEvaluator />} />
          <Route path="/dashboard/spark" element={<SparkFramework />} />
          <Route path="/dashboard/spark/:projectName" element={<SparkFramework />} />
          <Route path="/dashboard/:projectName" element={<SparkFramework />} />
          <Route path="/dashboard/:projectName/work-items" element={<WorkItems />} />
          <Route path="/dashboard/:projectName/analytics" element={<AnalyticsDashboard />} />
          <Route path="/dashboard/:projectName/boards" element={<KanbanBoard />} />
          <Route path="/dashboard/diagram/:diagramId" element={<DiagramEditor />} />
          <Route path="/community/join/:communityId" element={<CommunityJoin />} />
          <Route path="/community/create" element={<CommunityCreate />} />
          <Route path="/community/hub/:communityId" element={<CommunityHub />} />
          <Route path="/community/hub/:communityId/:tab" element={<CommunityHub />} />
          <Route path="/community/hub/:communityId/programs/:courseId" element={<MiniCourseViewer />} />
          <Route path="/community/course-builder/:courseId" element={<CourseBuilder />} />
          <Route path="/community/course/:courseId" element={<CoursePlayer />} />
          <Route path="/community/settings" element={<AccountSettings />} />
          <Route path="/community/profile" element={<ProfileSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
