import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AgendaListPage from "@/pages/AgendaListPage";
import VotingAgendasPage from "@/pages/VotingAgendasPage";
import OpinionListPage from "@/pages/OpinionListPage";
import MyPage from "@/pages/MyPage";
import MyOpinionsPage from "@/pages/MyOpinionsPage";
import LikedOpinionsPage from "@/pages/LikedOpinionsPage";
import MyAgendasPage from "@/pages/MyAgendasPage";
import BookmarkedAgendasPage from "@/pages/BookmarkedAgendasPage";
import AgendaDetailPage from "@/pages/AgendaDetailPage";
import AgendaOpinionsPage from "@/pages/AgendaOpinionsPage";
import AgendaReferencesPage from "@/pages/AgendaReferencesPage";
import OpinionDetailPage from "@/pages/OpinionDetailPage";
import NewOpinionPage from "@/pages/NewOpinionPage";
import SearchPage from "@/pages/SearchPage";
import AdminDashboard from "@/pages/AdminDashboard";
import SuccessPage from "@/pages/SuccessPage";
import SuccessAgendaPage from "@/pages/SuccessAgendaPage";
import HomePage from "@/pages/HomePage";
import HowTo from "@/pages/HowTo";
import AgendaToPolicy from "@/pages/AgendaToPolicy"
import LoginCallbackPage from "@/pages/LoginCallbackPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginCallbackPage} />
      <Route path="/agendas" component={AgendaListPage} />
      <Route path="/agendas/voting" component={VotingAgendasPage} />
      <Route path="/opinions" component={OpinionListPage} />
      <Route path="/my" component={MyPage} />
      <Route path="/my/opinions" component={MyOpinionsPage} />
      <Route path="/my/liked" component={LikedOpinionsPage} />
      <Route path="/my/agendas" component={MyAgendasPage} />
      <Route path="/my/bookmarks" component={BookmarkedAgendasPage} />
      <Route path="/agendas/:id/opinions" component={AgendaOpinionsPage} />
      <Route path="/agendas/:id/references" component={AgendaReferencesPage} />
      <Route path="/agendas/:id" component={AgendaDetailPage} />
      <Route path="/opinion/new" component={NewOpinionPage} />
      <Route path="/opinion/:id" component={OpinionDetailPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/success/agenda" component={SuccessAgendaPage} />
      <Route path="/success" component={SuccessPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/active-agendas" component={AdminDashboard} />
      <Route path="/admin/opinions" component={AdminDashboard} />
      <Route path="/admin/opinions/today" component={AdminDashboard} />
      <Route path="/admin/opinions/:subpage" component={AdminDashboard} />
      <Route path="/admin/agendas" component={AdminDashboard} />
      <Route path="/admin/agendas/:subpage" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminDashboard} />
      <Route path="/howto" component={HowTo}/>
      <Route path="/policy" component={AgendaToPolicy}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
