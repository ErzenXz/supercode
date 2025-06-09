import { AIProvider, ChatMessage, ChatResponse, ProviderConfig } from './types'

export class AnthropicProvider implements AIProvider {
  name = 'anthropic'
  displayName = 'Anthropic'
  
  private config: ProviderConfig

  constructor(config: ProviderConfig) {
    this.config = {
      model: 'claude-3-sonnet-20240229',
      maxTokens: 4000,
      temperature: 0.7,
      ...config,
    }
  }

  async chat(messages: ChatMessage[], functions?: Function[]): Promise<ChatResponse> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured')
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: messages.filter(msg => msg.role !== 'system').map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        system: messages.find(msg => msg.role === 'system')?.content,
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      content: data.content[0]?.text || '',
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey
  }
}
