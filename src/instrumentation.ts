export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runDatabaseMigrations } = await import("@/lib/migrations");
    await runDatabaseMigrations();
  }
}
