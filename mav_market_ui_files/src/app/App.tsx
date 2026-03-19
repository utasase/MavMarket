import { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { router } from "./routes";
import { SplashScreen } from "./components/SplashScreen";
import { LoginPage } from "./components/LoginPage";

type AppState = "splash" | "login" | "app";

export default function App() {
  const [state, setState] = useState<AppState>("splash");

  useEffect(() => {
    // Show splash for 2.2 seconds, then transition to login
    const timer = setTimeout(() => {
      setState("login");
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen w-full">
      <AnimatePresence mode="wait">
        {state === "splash" && (
          <motion.div
            key="splash"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <SplashScreen onComplete={() => setState("login")} />
          </motion.div>
        )}

        {state === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-screen"
          >
            <LoginPage onLogin={() => setState("app")} />
          </motion.div>
        )}

        {state === "app" && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-screen"
          >
            <RouterProvider router={router} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
