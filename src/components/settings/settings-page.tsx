'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navigation/navbar'
import Link from 'next/link'

interface Provider {
  name: string
  displayName: string
  isConfigured: boolean
  description: string
  websiteUrl: string
}

export function SettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    fetchProviders()
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
      const response = await fetch('/api/settings/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKeys }),
      })

      if (response.ok) {
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
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-1">
                  Configure AI providers and other settings
                </p>
              </div>
            </div>
            <Button onClick={saveSettings} disabled={isSaving}>
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
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              saveStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {saveStatus === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>
                {saveStatus === 'success' 
                  ? 'Settings saved successfully!' 
                  : 'Failed to save settings. Please try again.'
                }
              </span>
            </div>
          )}

          {/* AI Providers */}
          <Card>
            <CardHeader>
              <CardTitle>AI Providers</CardTitle>
              <CardDescription>
                Configure API keys for different AI providers. You need at least one configured provider to use the chat feature.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {providers.map((provider) => {
                const info = getProviderInfo(provider.name)
                return (
                  <div key={provider.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{provider.displayName}</h3>
                        <Badge variant={provider.isConfigured ? 'default' : 'secondary'}>
                          {provider.isConfigured ? 'Configured' : 'Not Configured'}
                        </Badge>
                      </div>
                      <a
                        href={info.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Get API Key →
                      </a>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {info.description}
                    </p>

                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          type={showKeys[provider.name] ? 'text' : 'password'}
                          placeholder={`Enter ${provider.displayName} API key`}
                          value={apiKeys[provider.name] || ''}
                          onChange={(e) => handleApiKeyChange(provider.name, e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleShowKey(provider.name)}
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

          {/* Vector Database */}
          <Card>
            <CardHeader>
              <CardTitle>Vector Database</CardTitle>
              <CardDescription>
                Configure Upstash Vector for code indexing and search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Upstash Vector REST URL</label>
                  <Input
                    placeholder="https://your-vector-db.upstash.io"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Upstash Vector REST Token</label>
                  <Input
                    type="password"
                    placeholder="Your vector database token"
                    className="mt-1"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your Upstash Vector credentials from{' '}
                  <a
                    href="https://console.upstash.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Upstash Console →
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
