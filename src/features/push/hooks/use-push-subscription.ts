// src/features/push/hooks/use-push-subscription.ts
"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/axios";

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
 * Registers the current browser/mobile device for OS-level Web Push notifications
 * so that tasks, inquiries, mentions, and alerts are delivered even when the tab is closed.
 */
export function usePushSubscription(userId?: string) {
  const subscribedEndpointRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) {
      console.warn("[Push] Service Worker is not supported in this browser");
      return;
    }

    let cancelled = false;

    const initAndSubscribe = async () => {
      try {
        // 1. Explicitly register service worker first
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        console.log("[Push] Service worker active with scope:", reg.scope);

        if (!("PushManager" in window)) {
          console.warn("[Push] PushManager not supported in this browser");
          return;
        }

        if (cancelled) return;

        // Auto request permission if default (or proceed if granted)
        let currentPermission = Notification.permission;
        if (currentPermission === "default") {
          try {
            currentPermission = await Notification.requestPermission();
          } catch (pErr) {
            console.warn("[Push] Request permission error:", pErr);
          }
        }

        if (currentPermission !== "granted" || cancelled) return;

        // 2. Obtain VAPID Public Key
        let vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          try {
            const keyRes = await api.get("/push/vapid-public-key");
            vapidKey = keyRes.data?.publicKey;
          } catch (e) {
            console.warn("[Push] Failed to fetch VAPID key from backend:", e);
          }
        }

        if (!vapidKey) {
          console.warn("[Push] VAPID public key missing — cannot subscribe");
          return;
        }

        // 3. Subscribe with PushManager
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
        }

        if (cancelled || !sub) return;

        // Avoid re-posting identical subscription
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
        console.log("[Push] Registered device for OS push notifications");
      } catch (err) {
        console.warn("[Push] Push registration notice:", err);
      }
    };

    void initAndSubscribe();

    // Safe permission change listener for mobile & desktop
    try {
      if ("permissions" in navigator && navigator.permissions.query) {
        navigator.permissions
          .query({ name: "notifications" as PermissionName })
          .then((status) => {
            status.addEventListener("change", () => {
              if (Notification.permission === "granted") {
                void initAndSubscribe();
              }
            });
          })
          .catch(() => {});
      }
    } catch {}

    return () => {
      cancelled = true;
    };
  }, [userId]);
}
