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
import Connections from "./pages/Connections";
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
import CourseBuilder from "./pages/CourseBuilder";
import CoursePlayer from "./pages/CoursePlayer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/connections" element={<Connections />} />
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
          <Route path="/community/create" element={<CommunityCreate />} />
          <Route path="/community/hub" element={<CommunityHub />} />
          <Route path="/community/course-builder/:courseId" element={<CourseBuilder />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
