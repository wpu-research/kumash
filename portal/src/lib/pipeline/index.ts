import { claudeProvider } from "./claude";
import { mockProvider } from "./mock";
import type { AiProvider } from "./provider";

// AI_PROVIDER=claude | mock. Boşsa: Claude kimliği varsa claude, yoksa mock.
export function getProvider(): AiProvider {
  const choice = process.env.AI_PROVIDER?.trim();
  if (choice === "mock") return mockProvider;
  if (choice === "claude") return claudeProvider;
  return hasClaudeCredentials() ? claudeProvider : mockProvider;
}

export function hasClaudeCredentials() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}
