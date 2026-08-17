import { useEffect } from "react";
import { api } from "@/lib/axios";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush(userId?: string) {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let isMounted = true;

    async function initWebPush() {
      try {
        // 1. Register Service Worker
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        console.log("[WebPush] Service Worker registered with scope:", registration.scope);

        // If user is not logged in or notifications not supported, stop here
        if (!userId || !("PushManager" in window) || !("Notification" in window)) {
          return;
        }

        // If permission is already granted, proceed with subscription
        if (Notification.permission === "granted") {
          await subscribeUser(registration);
        } else if (Notification.permission === "default") {
          // Request permission politely
          const perm = await Notification.requestPermission();
          if (perm === "granted" && isMounted) {
            await subscribeUser(registration);
          }
        }
      } catch (err) {
        console.warn("[WebPush] Service worker registration error:", err);
      }
    }

    async function subscribeUser(registration: ServiceWorkerRegistration) {
      try {
        let vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!vapidKey) {
          try {
            const res = await api.get("/push/vapid-public-key");
            vapidKey = res.data?.publicKey;
          } catch (e) {
            console.warn("[WebPush] Failed to fetch VAPID key:", e);
          }
        }

        if (!vapidKey) {
          console.warn("[WebPush] No VAPID public key available for push subscription");
          return;
        }

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          const applicationServerKey = urlBase64ToUint8Array(vapidKey);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
          console.log("[WebPush] New Push Subscription created:", subscription);
        }

        const subJson = subscription.toJSON();
        if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
          await api.post("/push/subscribe", {
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            },
          });
          console.log("[WebPush] Successfully synced push subscription with backend.");
        }
      } catch (subErr) {
        console.warn("[WebPush] Error subscribing to push:", subErr);
      }
    }

    initWebPush();

    return () => {
      isMounted = false;
    };
  }, [userId]);
}
