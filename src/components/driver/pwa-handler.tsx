"use client";

import { useEffect } from "react";

export function PWAHandler() {
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered:", registration.scope);

            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 60000); // Check every minute
          })
          .catch((error) => {
            console.log("Service Worker registration failed:", error);
          });
      });
    }

    // Handle offline/online status
    const handleOnline = () => {
      console.log("App is online");
      // You can show a toast notification here
    };

    const handleOffline = () => {
      console.log("App is offline");
      // You can show a toast notification here
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}

