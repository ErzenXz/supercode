'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Eye, EyeOff, CheckCircle, XCircle, Zap, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navigation/navbar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'

interface Provider {
  name: string
  displayName: string
  isConfigured: boolean
  description: string
  websiteUrl: string
}

interface Model {
  id: string
  name: string
  description: string
  pricing: {
    prompt: string
    completion: string
  }
  contextLength: number
  isFree: boolean
  provider: string
}

export function SettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('qwen/qwen-2.5-72b-instruct:free')
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  useEffect(() => {
    fetchProviders()
    fetchModels()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/settings/providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchModels = async () => {
    setIsLoadingModels(true)
    try {
      const response = await fetch('/api/settings/models')
      if (response.ok) {
        const data = await response.json()
        setModels(data.models || [])
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setIsLoadingModels(false)
    }
  }

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }))
  }

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }))
  }

  const saveSettings = async () => {
    setIsSaving(true)
    setSaveStatus('idle')

    try {
      // Save API keys
      const providersResponse = await fetch('/api/settings/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKeys }),
      })

      // Save model selection
      const selectedModelData = models.find(m => m.id === selectedModel)
      const modelsResponse = await fetch('/api/settings/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedModel,
          provider: selectedModelData?.provider
        }),
      })

      if (providersResponse.ok && modelsResponse.ok) {
        setSaveStatus('success')
        fetchProviders() // Refresh provider status
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const getProviderInfo = (name: string) => {
    const info = {
      openai: {
        description: 'GPT-4 and other OpenAI models',
        websiteUrl: 'https://platform.openai.com/api-keys',
      },
      anthropic: {
        description: 'Claude 3 and other Anthropic models',
        websiteUrl: 'https://console.anthropic.com/',
      },
      google: {
        description: 'Gemini and other Google AI models',
        websiteUrl: 'https://makersuite.google.com/app/apikey',
      },
      openrouter: {
        description: 'Access to multiple AI models through one API',
        websiteUrl: 'https://openrouter.ai/keys',
      },
    }
    return info[name as keyof typeof info] || { description: '', websiteUrl: '' }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Navbar />
      {/* Header */}
      <div className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-slate-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mt-2 text-lg">
                  Configure AI providers and other settings
                </p>
              </div>
            </div>
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Save Status */}
          {saveStatus !== 'idle' && (
            <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-sm ${
              saveStatus === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
            }`}>
              {saveStatus === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="font-medium">
                {saveStatus === 'success'
                  ? 'Settings saved successfully!'
                  : 'Failed to save settings. Please try again.'
                }
              </span>
            </div>
          )}

          {/* AI Providers */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                AI Providers
              </CardTitle>
              <CardDescription className="text-base">
                Configure API keys for different AI providers. You need at least one configured provider to use the chat feature.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {providers.map((provider) => {
                const info = getProviderInfo(provider.name)
                return (
                  <div key={provider.name} className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-800/50 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{provider.displayName}</h3>
                        <Badge
                          variant={provider.isConfigured ? 'default' : 'secondary'}
                          className={provider.isConfigured
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }
                        >
                          {provider.isConfigured ? 'Configured' : 'Not Configured'}
                        </Badge>
                      </div>
                      <a
                        href={info.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Get API Key →
                      </a>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                      {info.description}
                    </p>

                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Input
                          type={showKeys[provider.name] ? 'text' : 'password'}
                          placeholder={`Enter ${provider.displayName} API key`}
                          value={apiKeys[provider.name] || ''}
                          onChange={(e) => handleApiKeyChange(provider.name, e.target.value)}
                          className="h-12 rounded-xl border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleShowKey(provider.name)}
                        className="h-12 w-12 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        {showKeys[provider.name] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Model Selection */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    AI Model Selection
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Choose the AI model for chat interactions. Free models are recommended to start.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchModels}
                  disabled={isLoadingModels}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {isLoadingModels ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh Models
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                  Select AI Model
                </label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.length === 0 ? (
                      <SelectItem value="loading" disabled>
                        {isLoadingModels ? 'Loading models...' : 'No models available'}
                      </SelectItem>
                    ) : (
                      models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-slate-900 dark:text-slate-100">{model.name}</span>
                              {model.isFree && (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Free
                                </Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Model Details */}
              {selectedModel && models.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50">
                  {(() => {
                    const model = models.find(m => m.id === selectedModel)
                    if (!model) return null

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{model.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-slate-300 dark:border-slate-600">{model.provider}</Badge>
                            {model.isFree && (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Free
                              </Badge>
                            )}
                          </div>
                        </div>

                        {model.description && (
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {model.description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Context Length</span>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {model.contextLength.toLocaleString()} tokens
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Input Cost</span>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {model.isFree ? 'Free' : `$${model.pricing.prompt}/1K tokens`}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Output Cost</span>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {model.isFree ? 'Free' : `$${model.pricing.completion}/1K tokens`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Recommended Models */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Recommended Models</h4>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">Qwen 2.5 72B Instruct</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          High-quality free model, great for code analysis
                        </div>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 mt-1">
                          Free
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant={selectedModel === 'qwen/qwen-2.5-72b-instruct:free' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedModel('qwen/qwen-2.5-72b-instruct:free')}
                      disabled={selectedModel === 'qwen/qwen-2.5-72b-instruct:free'}
                      className={selectedModel === 'qwen/qwen-2.5-72b-instruct:free' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    >
                      {selectedModel === 'qwen/qwen-2.5-72b-instruct:free' ? 'Selected' : 'Select'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">GPT-4o Mini</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Fast and affordable, requires OpenAI API key
                        </div>
                        <Badge variant="outline" className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 mt-1">
                          Paid
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant={selectedModel === 'gpt-4o-mini' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedModel('gpt-4o-mini')}
                      disabled={selectedModel === 'gpt-4o-mini'}
                      className={selectedModel === 'gpt-4o-mini' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      {selectedModel === 'gpt-4o-mini' ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vector Database */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                Vector Database
              </CardTitle>
              <CardDescription className="text-base">
                Configure Upstash Vector for code indexing and search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Upstash Vector REST URL</label>
                  <Input
                    placeholder="https://your-vector-db.upstash.io"
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Upstash Vector REST Token</label>
                  <Input
                    type="password"
                    placeholder="Your vector database token"
                    className="h-12 rounded-xl border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Get your Upstash Vector credentials from{' '}
                    <a
                      href="https://console.upstash.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline hover:no-underline"
                    >
                      Upstash Console →
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
