// public/sw.js

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});


self.addEventListener("push", (event) => {
  let payload = {
    title: "Dwellr",
    body: "",
    tag: `push-${Date.now()}`,
    url: "/dashboard/team-chat",
    renotify: true,
  };

  try {
    if (event.data) {
      const data = event.data.json();
      payload = { ...payload, ...data };
    }
  } catch (err) {
    // Non-JSON payload — fall back to raw text
    try {
      payload.body = event.data ? event.data.text() : payload.body;
    } catch {}
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag || `push-${Date.now()}`,
      renotify: payload.renotify !== false,
      data: { url: payload.url || "/dashboard/team-chat" },
    })
  );
});

// Listen to message post events from the frontend chat socket hook
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, tag, url } = event.data.payload;

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        tag: tag || "chat-msg",
        renotify: true,
        requireInteraction: true,
        data: { url: url || "/dashboard/team-chat" },
      })
    );
  }
});

// Listen to notification clicks and focus or open the target page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard/team-chat";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a tab for the target page is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise focus any dashboard tab, or open the target
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // No dashboard tab — open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
