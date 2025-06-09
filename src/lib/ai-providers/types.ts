export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: any
}

export interface FunctionCall {
  name: string
  arguments: Record<string, any>
}

export interface ChatResponse {
  content: string
  functionCalls?: FunctionCall[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIProvider {
  name: string
  displayName: string
  chat(messages: ChatMessage[], functions?: Function[]): Promise<ChatResponse>
  isConfigured(): boolean
}

export interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
  maxTokens?: number
  temperature?: number
}
