export type Mode = "auto" | "explain" | "debug" | "refactor" | "optimize";

export async function askBackend(input: string, mode: Mode, language?: string) {
  const resp = await fetch(import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, mode, language }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Backend error (${resp.status}): ${text}`);
  }
  return (await resp.json()) as { output: string };
}