// scripts/setup-calendar-creds.ts
import { corsair } from "../server/lib/corsair";

async function main() {
  await corsair.keys.googlecalendar.set_client_id(process.env.GOOGLE_CLIENT_ID!);
  await corsair.keys.googlecalendar.set_client_secret(process.env.GOOGLE_CLIENT_SECRET!);
  console.log("✅ Google Calendar credentials set in Corsair");
}

main().catch(console.error);