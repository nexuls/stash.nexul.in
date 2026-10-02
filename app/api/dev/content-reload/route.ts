/**
 * Development-only Server-Sent Events (SSE) route for hot reloading content and MDX components.
 *
 * Streams reload events to connected browser tabs whenever files in content/,
 * components/mdx/, lib/mdx/, or lib/content/ are modified, added, or deleted.
 */

import {
  initContentWatcher,
  subscribeToContentChanges,
} from "@/lib/dev/content-watcher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not available in production", { status: 404 });
  }

  // Ensure filesystem watchers are started
  initContentWatcher();

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));

      // Send periodic heartbeat every 15s to keep the SSE connection alive
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
          }
        }
      }, 15000);

      // Listen for file changes in content and MDX directories
      unsubscribe = subscribeToContentChanges((eventData) => {
        try {
          const payload = JSON.stringify(eventData);
          controller.enqueue(
            encoder.encode(`event: reload\ndata: ${payload}\n\n`),
          );
        } catch {
          // Stream controller closed
        }
      });
    },
    cancel() {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
