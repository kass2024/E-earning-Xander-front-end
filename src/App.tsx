import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { LanguageProvider } from "./context/LanguageContext";
import { PublicSiteChrome } from "./components/PublicSiteChrome";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

/** Standalone meeting routes — eager load so new-tab opens never fail on missing lazy chunks. */
import ZoomEmbedMeetingRoom from "./pages/ZoomEmbedMeetingRoom";
import LiveCohortMeetingRoom from "./pages/LiveCohortMeetingRoom";
import LiveCohortHostStudio from "./pages/LiveCohortHostStudio";
import MeetingEnded from "./pages/MeetingEnded";
import DailyReturn from "./pages/DailyReturn";

const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const PublicCohortJoin = lazyWithRetry(() => import("./pages/PublicCohortJoin"));
const MeetingRegistration = lazyWithRetry(() => import("./pages/MeetingRegistration"));
const Pricing = lazyWithRetry(() => import("./pages/Pricing"));
const SubscriptionSuccess = lazyWithRetry(() => import("./pages/SubscriptionSuccess"));
const InstitutionPortalHome = lazyWithRetry(() => import("./pages/InstitutionPortalHome"));

import { ZoomLaunchBridge } from "@/components/live/ZoomLaunchBridge";

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
    <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LanguageProvider>
        <BrowserRouter>
          <PublicSiteChrome />
          <ZoomLaunchBridge />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/subscription/success" element={<SubscriptionSuccess />} />
              <Route path="/meeting-registration" element={<MeetingRegistration />} />
              <Route path="/live-cohort/:cohortId/join" element={<PublicCohortJoin />} />
              <Route path="/live-cohort/:cohortId/room" element={<LiveCohortMeetingRoom />} />
              <Route path="/live-cohort/:cohortId/host" element={<LiveCohortHostStudio />} />
              <Route path="/meeting/room" element={<ZoomEmbedMeetingRoom />} />
              <Route path="/meeting-ended" element={<MeetingEnded />} />
              <Route path="/daily/return" element={<DailyReturn />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login/:slug" element={<Login />} />
              <Route path="/i/:slug" element={<InstitutionPortalHome />} />
              <Route path="/i/:slug/meeting-registration" element={<MeetingRegistration />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
