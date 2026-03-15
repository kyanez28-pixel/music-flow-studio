import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import PracticePage from "./pages/PracticePage";
import HistoryPage from "./pages/HistoryPage";
import SetlistPage from "./pages/SetlistPage";
import ScalesPage from "./pages/ScalesPage";
import HarmoniesPage from "./pages/HarmoniesPage";
import MelodiesPage from "./pages/MelodiesPage";
import RhythmsPage from "./pages/RhythmsPage";
import StatsPage from "./pages/StatsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/setlist" element={<SetlistPage />} />
            <Route path="/scales" element={<ScalesPage />} />
            <Route path="/harmonies" element={<HarmoniesPage />} />
            <Route path="/melodies" element={<MelodiesPage />} />
            <Route path="/rhythms" element={<RhythmsPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
