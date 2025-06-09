'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Send, Settings, BarChart3, FileText, Code, Zap, Play, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navigation/navbar'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description?: string
  path: string
  language?: string
  framework?: string
  isIndexed: boolean
  indexingStatus: string
  totalFiles: number
  indexedFiles: number
  totalLines: number
  createdAt: string
  lastIndexedAt?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ProjectChatPageProps {
  projectId: string
}

export function ProjectChatPage({ projectId }: ProjectChatPageProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'stats' | 'files'>('chat')
  const [isIndexing, setIsIndexing] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isSending) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsSending(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          history: messages,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startIndexing = async () => {
    if (!project || isIndexing) return

    setIsIndexing(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/index`, {
        method: 'POST',
      })

      if (response.ok) {
        // Poll for indexing status
        const pollStatus = setInterval(async () => {
          const statusResponse = await fetch(`/api/projects/${projectId}`)
          if (statusResponse.ok) {
            const data = await statusResponse.json()
            setProject(data.project)

            if (data.project.indexingStatus !== 'indexing') {
              clearInterval(pollStatus)
              setIsIndexing(false)
            }
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Error starting indexing:', error)
      setIsIndexing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {project.language && <Badge variant="secondary">{project.language}</Badge>}
                  {project.framework && <Badge variant="outline">{project.framework}</Badge>}
                  <Badge variant={project.isIndexed ? 'default' : 'secondary'}>
                    {project.indexingStatus === 'indexing' ? 'Indexing...' :
                     project.isIndexed ? 'Indexed' : 'Not Indexed'}
                  </Badge>
                  {!project.isIndexed && project.indexingStatus !== 'indexing' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startIndexing}
                      disabled={isIndexing}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Indexing
                    </Button>
                  )}
                  {project.indexingStatus === 'indexing' && (
                    <Button size="sm" variant="outline" disabled>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Indexing...
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('chat')}
              >
                <Zap className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button
                variant={activeTab === 'stats' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('stats')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </Button>
              <Button
                variant={activeTab === 'files' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('files')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Files
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 mb-4 space-y-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Code className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Start chatting about your code</h3>
                  <p className="text-muted-foreground">
                    Ask questions about functions, classes, or any part of your codebase
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your code..."
                disabled={isSending}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isSending || !inputMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{project.totalFiles}</div>
                  <p className="text-sm text-muted-foreground">
                    {project.indexedFiles} indexed
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lines of Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{project.totalLines.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Total lines</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold capitalize">{project.indexingStatus}</div>
                  <p className="text-sm text-muted-foreground">
                    {project.lastIndexedAt 
                      ? `Last indexed ${new Date(project.lastIndexedAt).toLocaleDateString()}`
                      : 'Never indexed'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Project Files</CardTitle>
                <CardDescription>
                  Files in your project directory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  File browser coming soon...
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
