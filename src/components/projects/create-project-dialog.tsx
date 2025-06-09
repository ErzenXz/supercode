'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, Loader2, Code } from 'lucide-react'

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated: () => void
}

export function CreateProjectDialog({ open, onOpenChange, onProjectCreated }: CreateProjectDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    path: '',
    language: '',
    framework: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onProjectCreated()
        onOpenChange(false)
        setFormData({
          name: '',
          description: '',
          path: '',
          language: '',
          framework: '',
        })
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create project')
      }
    } catch (error) {
      setError('Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  const selectFolder = async () => {
    try {
      // For now, we'll use a simple prompt. In a real app, you'd use a file picker
      const path = prompt('Enter the path to your project folder:')
      if (path) {
        setFormData(prev => ({ ...prev, path }))
        
        // Auto-detect project name from path
        if (!formData.name) {
          const folderName = path.split(/[/\\]/).pop() || ''
          setFormData(prev => ({ ...prev, name: folderName }))
        }
      }
    } catch (error) {
      console.error('Error selecting folder:', error)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg mx-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Code className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Create New Project
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Add a new code project to index and analyze with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 p-4 rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Project Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Awesome Project"
                required
                className="bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A brief description of your project"
                className="bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Project Path *
              </label>
              <div className="flex gap-2">
                <Input
                  value={formData.path}
                  onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))}
                  placeholder="/path/to/your/project"
                  required
                  className="bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={selectFolder}
                  className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter the full path to your project directory
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Language
                </label>
                <Input
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  placeholder="JavaScript"
                  className="bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Framework
                </label>
                <Input
                  value={formData.framework}
                  onChange={(e) => setFormData(prev => ({ ...prev, framework: e.target.value }))}
                  placeholder="React"
                  className="bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
