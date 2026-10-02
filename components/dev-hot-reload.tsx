"use client";

/**
 * Development-only Hot Reload client for MDX and content files.
 *
 * Listens to Server-Sent Events from /api/dev/content-reload and triggers
 * Next.js React Server Component (RSC) refresh without losing client state.
 */

import { useRouter } from "next/navigation";
import * as React from "react";

export function DevHotReload() {
  const router = useRouter();
  const routerRef = React.useRef(router);
  routerRef.current = router;

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) {
        return;
      }

      try {
        eventSource = new EventSource("/api/dev/content-reload");

        eventSource.addEventListener("reload", (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log(
              `[Stash Dev HotReload] File changed: ${data.file || "content/MDX"}. Triggering server refresh...`,
            );
          } catch {
            console.log(
              "[Stash Dev HotReload] Content or MDX component changed. Triggering server refresh...",
            );
          }
          routerRef.current.refresh();
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (isMounted) {
            reconnectTimer = setTimeout(connect, 2000);
          }
        };
      } catch {
        if (isMounted) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  return null;
}
