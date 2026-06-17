import { corsair } from "@/server/lib/corsair";

export async function GET() {
  try {
    await corsair.keys.gmail.set_client_id(
      process.env.GMAIL_CLIENT_ID!
    );

    await corsair.keys.gmail.set_client_secret(
      process.env.GMAIL_CLIENT_SECRET!
    );

    return Response.json({
      success: true,
    });
  } catch (e) {
    console.error(e);

    return Response.json(
      {
        error: String(e),
      },
      {
        status: 500,
      }
    );
  }
}