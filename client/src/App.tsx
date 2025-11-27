import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { Navigation } from "@/components/navigation";
import { useEffect, useState } from "react";
import Practice from "@/pages/practice";
import Dashboard from "@/pages/dashboard";
import Report from "@/pages/report";
import Login from "@/pages/login";
import Profile from "@/pages/profile";
import Scenarios from "@/pages/scenarios";
import LearningResources from "@/pages/learning-resources";
import NotFound from "@/pages/not-found";

function Router() {
  const userId = localStorage.getItem('userId');

  // If not logged in, show only login
  if (!userId) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  // If logged in, show all protected pages
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/practice" component={Practice} />
      <Route path="/report/:id" component={Report} />
      <Route path="/profile" component={Profile} />
      <Route path="/scenarios" component={Scenarios} />
      <Route path="/learning" component={LearningResources} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const userId = localStorage.getItem('userId');
  const isAuthPage = location === '/login';

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            {userId && !isAuthPage && <Navigation />}
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
