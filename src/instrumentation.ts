export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootstrapCorsairCredentials } = await import("./server/lib/corsair");
    await bootstrapCorsairCredentials().catch(console.error);
  }
}
