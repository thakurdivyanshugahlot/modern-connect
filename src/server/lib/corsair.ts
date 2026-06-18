import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { conn } from '../db';
import { env } from '../../env';

export const corsair = createCorsair({
    plugins: [gmail(), googlecalendar()],
    database: conn,
    kek: env.CORSAIR_KEK,
    multiTenancy: true,
});

let bootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;

export async function bootstrapCorsairCredentials() {
  if (bootstrapped) return;
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        await corsair.keys.gmail.set_client_id(env.GMAIL_CLIENT_ID);
        await corsair.keys.gmail.set_client_secret(env.GMAIL_CLIENT_SECRET);
        await corsair.keys.googlecalendar.set_client_id(env.GMAIL_CLIENT_ID);
        await corsair.keys.googlecalendar.set_client_secret(env.GMAIL_CLIENT_SECRET);
        bootstrapped = true;
      } catch (error) {
        bootstrapPromise = null; // allow retry if it failed
        throw error;
      }
    })();
  }
  return bootstrapPromise;
}