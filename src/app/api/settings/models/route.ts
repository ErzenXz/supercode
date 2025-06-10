import { NextRequest, NextResponse } from 'next/server'

interface OpenRouterModel {
  id: string
  name: string
  description?: string
  pricing: {
    prompt: string
    completion: string
  }
  context_length: number
  architecture: {
    modality: string
    tokenizer: string
    instruct_type?: string
  }
  top_provider: {
    context_length: number
    max_completion_tokens?: number
  }
}

export async function GET(request: NextRequest) {
  try {
    // Fetch models from OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch models from OpenRouter')
    }

    const data = await response.json()
    const models: OpenRouterModel[] = data.data || []

    // Filter and format models
    const formattedModels = models
      .filter(model => {
        // Filter for popular and free models
        return model.id.includes('free') || 
               model.id.includes('qwen') ||
               model.id.includes('llama') ||
               model.id.includes('mistral') ||
               model.id.includes('claude') ||
               model.id.includes('gpt')
      })
      .map(model => ({
        id: model.id,
        name: model.name,
        description: model.description || '',
        pricing: {
          prompt: model.pricing.prompt,
          completion: model.pricing.completion,
        },
        contextLength: model.context_length,
        isFree: model.pricing.prompt === '0' && model.pricing.completion === '0',
        provider: 'openrouter',
      }))
      .sort((a, b) => {
        // Sort free models first, then by name
        if (a.isFree && !b.isFree) return -1
        if (!a.isFree && b.isFree) return 1
        return a.name.localeCompare(b.name)
      })

    // Add some popular models from other providers
    const otherModels = [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Latest GPT-4 model with improved capabilities',
        pricing: { prompt: '0.005', completion: '0.015' },
        contextLength: 128000,
        isFree: false,
        provider: 'openai',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Faster and cheaper GPT-4 variant',
        pricing: { prompt: '0.00015', completion: '0.0006' },
        contextLength: 128000,
        isFree: false,
        provider: 'openai',
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Latest Claude model with excellent reasoning',
        pricing: { prompt: '0.003', completion: '0.015' },
        contextLength: 200000,
        isFree: false,
        provider: 'anthropic',
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Google\'s most capable model',
        pricing: { prompt: '0.00125', completion: '0.005' },
        contextLength: 2000000,
        isFree: false,
        provider: 'google',
      },
    ]

    const allModels = [...formattedModels, ...otherModels]

    return NextResponse.json({
      models: allModels,
      totalCount: allModels.length,
    })

  } catch (error) {
    console.error('Error fetching models:', error)
    
    // Return fallback models if API fails
    const fallbackModels = [
      {
        id: 'qwen/qwen-2.5-72b-instruct:free',
        name: 'Qwen 2.5 72B Instruct (Free)',
        description: 'High-quality free model from Alibaba',
        pricing: { prompt: '0', completion: '0' },
        contextLength: 32768,
        isFree: true,
        provider: 'openrouter',
      },
      {
        id: 'meta-llama/llama-3.1-8b-instruct:free',
        name: 'Llama 3.1 8B Instruct (Free)',
        description: 'Meta\'s open-source model',
        pricing: { prompt: '0', completion: '0' },
        contextLength: 131072,
        isFree: true,
        provider: 'openrouter',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'OpenAI\'s efficient model',
        pricing: { prompt: '0.00015', completion: '0.0006' },
        contextLength: 128000,
        isFree: false,
        provider: 'openai',
      },
    ]

    return NextResponse.json({
      models: fallbackModels,
      totalCount: fallbackModels.length,
      error: 'Failed to fetch latest models, showing fallback list',
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { selectedModel, provider } = await request.json()

    // Here you would save the selected model to your database or settings
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: 'Model selection saved successfully',
      selectedModel,
      provider,
    })

  } catch (error) {
    console.error('Error saving model selection:', error)
    return NextResponse.json(
      { error: 'Failed to save model selection' },
      { status: 500 }
    )
  }
}
