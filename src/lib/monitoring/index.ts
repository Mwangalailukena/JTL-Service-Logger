"use client";

import { getAnalytics, isSupported } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { app } from "@/lib/firebase";

export const initMonitoring = async () => {
  if (typeof window !== "undefined") {
    // 1. Initialize Firebase Performance Monitoring
    const perf = getPerformance(app);

    // 2. Initialize Analytics (if supported)
    const analyticsSupported = await isSupported();
    if (analyticsSupported) {
      getAnalytics(app);
    }
  }
};

export const logError = (error: Error, context?: Record<string, any>) => {
  // In a real app, send to Sentry or Crashlytics
  console.error("[Error Tracker]", error.message, context);
  
  // Example: Generic 'custom_event' to GA
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag('event', 'exception', {
      'description': error.message,
      'fatal': false
    });
  }
};
