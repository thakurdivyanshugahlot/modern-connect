import 'dotenv/config';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { conn } from '../db';

export const corsair = createCorsair({
    plugins: [gmail(), googlecalendar()],
    database: conn,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});

export async function bootstrapCorsairCredentials() {
  await corsair.keys.gmail.set_client_id(process.env.GMAIL_CLIENT_ID!);
  await corsair.keys.gmail.set_client_secret(process.env.GMAIL_CLIENT_SECRET!);
  await corsair.keys.googlecalendar.set_client_id(process.env.GMAIL_CLIENT_ID!);
  await corsair.keys.googlecalendar.set_client_secret(process.env.GMAIL_CLIENT_SECRET!);
}