import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GoogleProvider } from "./google";
import { OpenRouterProvider } from "./openrouter";
import { AIProvider, ProviderConfig } from "./types";

export * from "./types";

export function createProvider(
  name: string,
  config: ProviderConfig
): AIProvider {
  switch (name) {
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "google":
      return new GoogleProvider(config);
    case "openrouter":
      return new OpenRouterProvider(config);
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

export function getAvailableProviders(): Array<{
  name: string;
  displayName: string;
}> {
  return [
    { name: "openai", displayName: "OpenAI" },
    { name: "anthropic", displayName: "Anthropic" },
    { name: "google", displayName: "Google AI" },
    { name: "openrouter", displayName: "OpenRouter" },
  ];
}

export function getConfiguredProviders(): Array<{
  name: string;
  displayName: string;
  isConfigured: boolean;
}> {
  const providers = getAvailableProviders();

  return providers.map((provider) => {
    let isConfigured = false;

    try {
      const config = getProviderConfig(provider.name);
      const providerInstance = createProvider(provider.name, config);
      isConfigured = providerInstance.isConfigured();
    } catch (error) {
      // Provider not configured
    }

    return {
      ...provider,
      isConfigured,
    };
  });
}

export function getProviderConfig(name: string): ProviderConfig {
  switch (name) {
    case "openai":
      return {
        apiKey: process.env.OPENAI_API_KEY,
      };
    case "anthropic":
      return {
        apiKey: process.env.ANTHROPIC_API_KEY,
      };
    case "google":
      return {
        apiKey: process.env.GOOGLE_API_KEY,
      };
    case "openrouter":
      return {
        apiKey: process.env.OPENROUTER_API_KEY,
      };
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}
