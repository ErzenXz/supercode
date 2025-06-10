'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, BarChart3, FileText, Code, Zap, Play, RefreshCw, Upload, FolderOpen, Clock, Copy, Check, MessageSquare, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navigation/navbar'
import { FileUploadDialog } from './file-upload-dialog'
import { IndexingProgress } from './indexing-progress'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/github-dark.css'

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

interface ProjectFile {
  id: string
  path: string
  name: string
  extension?: string
  size: number
  lines: number
  isIndexed: boolean
  lastIndexedAt?: string
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
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    fetchProject()
    if (activeTab === 'files') {
      fetchFiles()
    }
  }, [projectId, activeTab])

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

  const fetchFiles = async () => {
    setIsLoadingFiles(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/index`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setIsLoadingFiles(false)
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

  const startIndexing = async (incremental: boolean = false) => {
    if (!project || isIndexing) return

    setIsIndexing(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ incremental }),
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
              if (activeTab === 'files') {
                fetchFiles() // Refresh files after indexing
              }
            }
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Error starting indexing:', error)
      setIsIndexing(false)
    }
  }

  const handleUploadComplete = () => {
    fetchProject()
    if (activeTab === 'files') {
      fetchFiles()
    }
    // Start incremental indexing after upload
    setTimeout(() => {
      startIndexing(true)
    }, 1000)
  }

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-12 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Loading Project</h3>
          <p className="text-slate-600 dark:text-slate-400">Preparing your coding companion...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-12 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Code className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-slate-100">Project Not Found</h2>
                                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">The project you&apos;re looking for doesn&apos;t exist or may have been moved.</p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar />
        
        {/* Enhanced Header */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-4 py-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-slate-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                      {project.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                      {project.language && (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                          {project.language}
                        </Badge>
                      )}
                      {project.framework && (
                        <Badge variant="outline" className="border-slate-300 dark:border-slate-600 px-3 py-1 rounded-full font-medium">
                          {project.framework}
                        </Badge>
                      )}
                      <Badge variant={project.isIndexed ? 'default' : 'secondary'} className="px-3 py-1 rounded-full font-medium">
                        {project.indexingStatus === 'indexing' ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Indexing...
                          </>
                        ) : project.isIndexed ? (
                          <>
                            <Sparkles className="w-3 h-3 mr-1" />
                            Indexed
                          </>
                        ) : (
                          'Not Indexed'
                        )}
                      </Badge>
                      {!project.isIndexed && project.indexingStatus !== 'indexing' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={startIndexing}
                          disabled={isIndexing}
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/30 rounded-xl px-4 py-2"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Indexing
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Tab Navigation */}
              <div className="flex gap-2 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-1.5 border border-slate-200/50 dark:border-slate-700/50">
                <Button
                  variant={activeTab === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('chat')}
                  className={`rounded-xl px-6 py-2.5 font-semibold transition-all duration-200 ${
                    activeTab === 'chat' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </Button>
                <Button
                  variant={activeTab === 'stats' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('stats')}
                  className={`rounded-xl px-6 py-2.5 font-semibold transition-all duration-200 ${
                    activeTab === 'stats' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
                <Button
                  variant={activeTab === 'files' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('files')}
                  className={`rounded-xl px-6 py-2.5 font-semibold transition-all duration-200 ${
                    activeTab === 'files' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Files
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 container mx-auto px-6 py-8">
          {/* Indexing Progress */}
          {isIndexing && (
            <div className="mb-8">
              <IndexingProgress
                projectId={projectId}
                isIndexing={isIndexing}
                onComplete={() => {
                  setIsIndexing(false)
                  fetchProject()
                  if (activeTab === 'files') {
                    fetchFiles()
                  }
                }}
              />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="max-w-5xl mx-auto h-full flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl overflow-hidden">
              {/* Chat Header */}
              <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI Code Assistant</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Ask questions about your codebase and get intelligent responses</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 px-8 py-6 space-y-6 overflow-y-auto max-h-[calc(100vh-400px)]">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <MessageSquare className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Start a Conversation</h3>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                      Ask me anything about your codebase! I can help explain functions, analyze architecture, debug issues, and suggest improvements.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-left">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Code Analysis</h4>
                                                 <p className="text-sm text-slate-600 dark:text-slate-400">
                           &ldquo;Explain how the authentication system works&rdquo;
                         </p>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-left">
                         <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Debugging Help</h4>
                         <p className="text-sm text-slate-600 dark:text-slate-400">
                           &ldquo;Why might this function be causing errors?&rdquo;
                         </p>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-left">
                         <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Architecture</h4>
                         <p className="text-sm text-slate-600 dark:text-slate-400">
                           &ldquo;Show me the main components and their relationships&rdquo;
                         </p>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-left">
                         <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Best Practices</h4>
                         <p className="text-sm text-slate-600 dark:text-slate-400">
                           &ldquo;How can I improve this code&apos;s performance?&rdquo;
                         </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] group ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                        } rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200`}
                      >
                        <div className="px-6 py-4">
                          {message.role === 'user' ? (
                            <p className="whitespace-pre-wrap leading-relaxed font-medium">{message.content}</p>
                          ) : (
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                                components={{
                                                                     code: ({ inline, className, children, ...props }) => {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return !inline && match ? (
                                      <pre className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 overflow-x-auto">
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      </pre>
                                    ) : (
                                      <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-sm font-mono" {...props}>
                                        {children}
                                      </code>
                                    )
                                  },
                                  blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-blue-500 pl-4 italic bg-blue-50 dark:bg-blue-950/20 rounded-r-xl py-2">
                                      {children}
                                    </blockquote>
                                  ),
                                  h1: ({ children }) => (
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3 mt-6">
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 mt-4">
                                      {children}
                                    </h3>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
                                      {children}
                                    </ol>
                                  ),
                                  p: ({ children }) => (
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                      {children}
                                    </p>
                                  )
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <div className="px-6 pb-4 flex items-center justify-between">
                          <p className="text-xs opacity-70">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                          {message.role === 'assistant' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(message.content, message.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg px-3 py-1"
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-lg px-6 py-4 max-w-[85%]">
                      <div className="flex items-center gap-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-slate-600 dark:text-slate-400 font-medium">AI is analyzing your code...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced Chat Input */}
              <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your code..."
                      disabled={isSending}
                      className="pr-12 py-4 text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-2xl shadow-lg focus:shadow-xl transition-all duration-200 focus:border-blue-400 dark:focus:border-blue-500 resize-none"
                      style={{minHeight: '60px'}}
                    />
                  </div>
                  <Button 
                    onClick={sendMessage} 
                    disabled={isSending || !inputMessage.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none rounded-2xl px-6 py-4 h-[60px] font-semibold"
                  >
                    {isSending ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-10">
                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-slate-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                  Project Analytics
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Comprehensive overview of your project metrics and performance
                </p>
              </div>

              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        Files
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                      {project.totalFiles.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-slate-600 dark:text-slate-400">
                        {project.indexedFiles} indexed ({Math.round((project.indexedFiles / project.totalFiles) * 100)}%)
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Code className="w-5 h-5 text-white" />
                        </div>
                        Lines of Code
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                      {project.totalLines.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-slate-600 dark:text-slate-400">
                        Total lines across all files
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        Status
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3 capitalize">
                      {project.indexingStatus === 'completed' ? 'Ready' : project.indexingStatus}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        project.indexingStatus === 'completed' ? 'bg-green-500' : 
                        project.indexingStatus === 'indexing' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-slate-600 dark:text-slate-400">
                        {project.lastIndexedAt 
                          ? `Last indexed ${new Date(project.lastIndexedAt).toLocaleDateString()}`
                          : 'Never indexed'
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                      Project Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Primary Language</span>
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-3 py-1 rounded-full">
                          {project.language || 'Unknown'}
                        </Badge>
                      </div>
                      {project.framework && (
                        <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Framework</span>
                          <Badge variant="outline" className="border-slate-300 dark:border-slate-600 px-3 py-1 rounded-full">
                            {project.framework}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Created</span>
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Average File Size</span>
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">
                          {Math.round(project.totalLines / project.totalFiles)} lines
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                      Indexing Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Completion</span>
                          <span className="text-slate-900 dark:text-slate-100 font-bold">
                            {Math.round((project.indexedFiles / project.totalFiles) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.round((project.indexedFiles / project.totalFiles) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-4 text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {project.indexedFiles}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Indexed</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {project.totalFiles - project.indexedFiles}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Pending</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="max-w-7xl mx-auto">
              {/* Enhanced Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 gap-6">
                <div>
                  <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-slate-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                    Project Files
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400">
                    Manage, upload, and track the indexing status of your project files
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fetchFiles()}
                    disabled={isLoadingFiles}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl px-6 py-3 font-semibold shadow-lg"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => setIsUploadDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-xl px-8 py-3 font-semibold"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              </div>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <FolderOpen className="w-5 h-5 text-white" />
                        </div>
                        Files ({files.length})
                      </CardTitle>
                      <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                        {files.filter(f => f.isIndexed).length} of {files.length} files indexed 
                        ({files.length > 0 ? Math.round((files.filter(f => f.isIndexed).length / files.length) * 100) : 0}% complete)
                      </CardDescription>
                    </div>
                    {files.some(f => !f.isIndexed) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startIndexing(true)}
                        disabled={isIndexing}
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/30 rounded-xl px-6 py-3 font-semibold shadow-lg"
                      >
                        {isIndexing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Indexing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Index New Files
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingFiles ? (
                    <div className="p-8 space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                        </div>
                      ))}
                    </div>
                  ) : files.length === 0 ? (
                    <div className="text-center py-20 px-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <FileText className="w-12 h-12 text-slate-400" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">No files found</h3>
                      <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
                        Upload files to get started with your project and begin the AI-powered analysis
                      </p>
                      <Button
                        onClick={() => setIsUploadDialogOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-2xl px-8 py-4 text-lg font-semibold"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Your First Files
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {files.map((file, index) => (
                        <div
                          key={file.id}
                          className={`group p-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-950/20 dark:hover:to-purple-950/20 transition-all duration-200 ${
                            index === 0 ? 'rounded-t-3xl' : ''
                          } ${index === files.length - 1 ? 'rounded-b-3xl' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-lg mb-1">
                                  {file.path.split('/').pop() || file.path}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-2">
                                  {file.path}
                                </p>
                                <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="font-medium">{(file.size / 1024).toFixed(1)} KB</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span className="font-medium">{file.lines.toLocaleString()} lines</span>
                                  </div>
                                  {file.extension && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="font-medium">{file.extension}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge
                                variant={file.isIndexed ? 'default' : 'secondary'}
                                className={`px-4 py-2 rounded-xl font-semibold ${
                                  file.isIndexed 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800' 
                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                                }`}
                              >
                                {file.isIndexed ? (
                                  <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    Indexed
                                  </>
                                ) : (
                                  <>
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                                    Pending
                                  </>
                                )}
                              </Badge>
                              {file.lastIndexedAt && (
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                                  <Clock className="w-4 h-4" />
                                  <span className="font-medium">
                                    {new Date(file.lastIndexedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        projectId={projectId}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  )
}
