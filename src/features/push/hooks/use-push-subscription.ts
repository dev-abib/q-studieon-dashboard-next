// src/features/push/hooks/use-push-subscription.ts
"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/axios";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Registers the current browser for OS-level Web Push notifications so that
 * mentions, DMs, tasks, inquiries and alerts are delivered to the operating
 * system even when the tab is backgrounded, the window isn't focused, or (on
 * mobile) the browser is closed. Safe to call once per authenticated user.
 */
export function usePushSubscription(userId?: string) {
  const subscribedEndpointRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    if (!VAPID_PUBLIC_KEY) {
      console.warn(
        "[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set — OS push notifications disabled. Add it to the frontend env (must match the backend VAPID_PUBLIC_KEY)."
      );
      return;
    }
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[Push] Push API is not supported in this browser");
      return;
    }

    let cancelled = false;

    const subscribe = async () => {
      if (cancelled) return;
      if (Notification.permission !== "granted") return;

      try {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // Avoid re-POSTing the same subscription on every effect run
        if (subscribedEndpointRef.current === sub.endpoint) return;
        subscribedEndpointRef.current = sub.endpoint;

        const p256dh = sub.getKey("p256dh");
        const auth = sub.getKey("auth");
        if (!p256dh || !auth) return;

        await api.post("/push/subscribe", {
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(p256dh),
            auth: arrayBufferToBase64(auth),
          },
        });
        console.log("[Push] Registered for OS push notifications");
      } catch (err) {
        console.error("[Push] Failed to register for OS push:", err);
      }
    };

    // Subscribe immediately if permission is already granted
    void subscribe();

    // Re-subscribe when the user grants permission later (e.g. via banner)
    try {
      navigator.permissions
        .query({ name: "notifications" as PermissionName })
        .then((status) => {
          status.addEventListener("change", () => {
            if (Notification.permission === "granted") void subscribe();
          });
        })
        .catch(() => {});
    } catch {
      // Some browsers reject the query — subscription will still happen on
      // visibility change below.
    }

    // Fallback: retry whenever the tab becomes visible again (covers the case
    // where permission was granted via browser settings, or the permission
    // change event didn't fire).
    const onVisibility = () => {
      if (document.visibilityState === "visible") void subscribe();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Browser rotated the push subscription (expiry/re-issue) — re-register
    const onSubscriptionChange = () => {
      subscribedEndpointRef.current = null;
      void subscribe();
    };
    navigator.serviceWorker.addEventListener(
      "pushsubscriptionchange",
      onSubscriptionChange
    );

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      navigator.serviceWorker.removeEventListener(
        "pushsubscriptionchange",
        onSubscriptionChange
      );
    };
  }, [userId]);

  return null;
}
