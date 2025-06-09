import { AIProvider, ChatMessage, ChatResponse, ProviderConfig } from './types'

export class GoogleProvider implements AIProvider {
  name = 'google'
  displayName = 'Google AI'
  
  private config: ProviderConfig

  constructor(config: ProviderConfig) {
    this.config = {
      model: 'gemini-pro',
      maxTokens: 4000,
      temperature: 0.7,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      ...config,
    }
  }

  async chat(messages: ChatMessage[], functions?: Function[]): Promise<ChatResponse> {
    if (!this.isConfigured()) {
      throw new Error('Google AI API key not configured')
    }

    // Convert messages to Google's format
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const response = await fetch(
      `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: this.config.temperature,
            maxOutputTokens: this.config.maxTokens,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]

    if (!candidate) {
      throw new Error('No response from Google AI')
    }

    return {
      content: candidate.content?.parts?.[0]?.text || '',
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0,
      } : undefined,
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey
  }
}
