import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { getLocalStorage } from "@/lib/utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
  },
});

// Initialize dark mode before React renders
const initializeDarkMode = () => {
  try {
    const savedState = getLocalStorage('tradingState');
    const isDarkMode = savedState?.isDarkMode ?? true;
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (error) {
    // Default to dark mode if there's an error
    document.documentElement.classList.add('dark');
  }
};

initializeDarkMode();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>
);
