// Run this every 6 days: node scripts/renew-webhooks.mjs
const res = await fetch("http://localhost:3000/api/cron/renew-webhooks", {
  headers: {
    authorization: `Bearer ${process.env.CRON_SECRET ?? "your-secret-here"}`,
  },
});
const data = await res.json();
console.log("Renewal result:", JSON.stringify(data, null, 2));