import { AIProvider, ChatMessage, ChatResponse, ProviderConfig } from './types'

export class OpenAIProvider implements AIProvider {
  name = 'openai'
  displayName = 'OpenAI'
  
  private config: ProviderConfig

  constructor(config: ProviderConfig) {
    this.config = {
      model: 'gpt-4',
      maxTokens: 4000,
      temperature: 0.7,
      ...config,
    }
  }

  async chat(messages: ChatMessage[], functions?: Function[]): Promise<ChatResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        functions: functions?.map(fn => ({
          name: fn.name,
          description: fn.description,
          parameters: fn.parameters,
        })),
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const choice = data.choices[0]

    return {
      content: choice.message.content || '',
      functionCalls: choice.message.function_call ? [{
        name: choice.message.function_call.name,
        arguments: JSON.parse(choice.message.function_call.arguments),
      }] : undefined,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey
  }
}
