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
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const userId = localStorage.getItem('userId');
  const isAuthPage = location === '/login';
  const isProtected = ['/dashboard', '/report', '/profile'].some(path => location.startsWith(path));

  if (isAuthPage || (!userId && isProtected)) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Practice} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/report/:id" component={Report} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAuthPage = location === '/login';

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            {!isAuthPage && <Navigation />}
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
