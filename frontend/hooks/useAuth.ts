"use client";

import { useSyncExternalStore } from "react";
import { getUserRole } from "@/lib/auth";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export const useAuth = () => {
  const token = useSyncExternalStore(
    subscribe,
    // getToken,
    () => null
  );

  const role = useSyncExternalStore(
    subscribe,
    () => getUserRole() ?? null,
    () => null
  );

  return {
    isLoggedIn: !!token,
    role,
  };
};
