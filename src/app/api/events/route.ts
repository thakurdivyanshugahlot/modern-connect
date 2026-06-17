import { NextRequest } from "next/server";
import { requireSession } from "@/server/lib/session";
import { subscribeTenant } from "@/server/lib/notify";

export async function GET(req: NextRequest) {
  const session = await requireSession();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected" });

      const unsubscribe = subscribeTenant(session.user.id, send);

      req.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}