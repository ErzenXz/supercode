'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Zap, 
  Clock,
  X
} from 'lucide-react'

interface IndexingProgressProps {
  projectId: string
  isIndexing: boolean
  onComplete?: () => void
  onClose?: () => void
}

interface IndexingStatus {
  status: 'scanning' | 'indexing' | 'completed' | 'failed'
  totalFiles: number
  processedFiles: number
  currentFile: string
  error?: string
  startTime?: string
  estimatedTimeRemaining?: number
}

export function IndexingProgress({ projectId, isIndexing, onComplete, onClose }: IndexingProgressProps) {
  const [progress, setProgress] = useState<IndexingStatus>({
    status: 'scanning',
    totalFiles: 0,
    processedFiles: 0,
    currentFile: 'Initializing...',
  })
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (isIndexing && !startTime) {
      setStartTime(new Date())
    }
  }, [isIndexing, startTime])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isIndexing && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isIndexing, startTime])

  useEffect(() => {
    if (!isIndexing) return

    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/index/progress`)
        if (response.ok) {
          const data = await response.json()
          setProgress(data.progress)
          
          if (data.progress.status === 'completed' || data.progress.status === 'failed') {
            onComplete?.()
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error)
      }
    }

    // Poll every 500ms for smooth progress updates
    const interval = setInterval(pollProgress, 500)
    
    // Initial poll
    pollProgress()

    return () => clearInterval(interval)
  }, [isIndexing, projectId, onComplete])

  if (!isIndexing) return null

  const progressPercentage = progress.totalFiles > 0 
    ? Math.round((progress.processedFiles / progress.totalFiles) * 100)
    : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'scanning':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
      case 'indexing':
        return <Zap className="w-5 h-5 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (progress.status) {
      case 'scanning':
        return 'Scanning files...'
      case 'indexing':
        return 'Indexing files...'
      case 'completed':
        return 'Indexing completed!'
      case 'failed':
        return 'Indexing failed'
    }
  }

  const getStatusColor = () => {
    switch (progress.status) {
      case 'scanning':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
      case 'indexing':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">{getStatusText()}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor()}>
                  {progress.status}
                </Badge>
                {elapsedTime > 0 && (
                  <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3" />
                    {formatTime(elapsedTime)}
                  </div>
                )}
              </div>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {progress.totalFiles > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Progress: {progress.processedFiles} / {progress.totalFiles} files
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {progressPercentage}%
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
          </div>
        )}

        {/* Current File */}
        {progress.currentFile && progress.status === 'indexing' && (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              Processing:
            </span>
            <span className="font-mono text-slate-900 dark:text-slate-100 truncate">
              {progress.currentFile}
            </span>
          </div>
        )}

        {/* Error Message */}
        {progress.error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4" />
              <span className="font-semibold">Error:</span>
            </div>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {progress.error}
            </p>
          </div>
        )}

        {/* Success Message */}
        {progress.status === 'completed' && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="w-4 h-4" />
              <span className="font-semibold">Success!</span>
            </div>
            <p className="text-green-600 dark:text-green-400 text-sm mt-1">
              Successfully indexed {progress.processedFiles} files in {formatTime(elapsedTime)}
            </p>
          </div>
        )}

        {/* Stats */}
        {progress.totalFiles > 0 && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {progress.totalFiles}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Total Files
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {progress.processedFiles}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Processed
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
