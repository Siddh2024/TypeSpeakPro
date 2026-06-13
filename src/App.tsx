import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Practice from "./pages/Practice";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PracticeHub from "./pages/PracticeHub";
import VoicePractice from "./pages/VoicePractice";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
// import CommunicationPractice from "./pages/CommunicationPractice"; // Deprecated
import CommunicationLanding from "./pages/communication/CommunicationLanding";
import ReadingPractice from "./pages/communication/ReadingPractice";
import SpeakingPractice from "./pages/communication/SpeakingPractice";
import WritingPractice from "./pages/communication/WritingPractice";
import ListeningPractice from "./pages/communication/ListeningPractice";
import VerbalPracticeLanding from "./pages/VerbalPracticeLanding";
import VerbalGame from "./pages/VerbalGame";
import AdaptiveCoach from "./pages/AdaptiveCoach";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import BackToTopButton from "./components/BackToTopButton";

const queryClient = new QueryClient();

const App = () => (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BackToTopButton />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/practice" element={<Practice />} />
              </Route>

              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/voice-practice" element={<VoicePractice />} />
              <Route
                path="/voice-practice/communication"
                element={<CommunicationLanding />}
              />
              <Route
                path="/voice-practice/communication/reading"
                element={<ReadingPractice />}
              />
              <Route
                path="/voice-practice/communication/speaking"
                element={<SpeakingPractice />}
              />
              <Route
                path="/voice-practice/communication/writing"
                element={<WritingPractice />}
              />
              <Route
                path="/voice-practice/communication/listening"
                element={<ListeningPractice />}
              />
              <Route path="/voice-practice/:module" element={<PracticeHub />} />
              <Route
                path="/verbal-practice"
                element={<VerbalPracticeLanding />}
              />
              <Route
                path="/verbal-practice/:categoryId"
                element={<VerbalGame />}
              />
              <Route path="/adaptive-coach" element={<AdaptiveCoach />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
