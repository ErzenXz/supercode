'use client'

import { Button } from '@/components/ui/button'
import { Plus, Code2 } from 'lucide-react'

interface ProjectsEmptyStateProps {
  onCreateProject: () => void
}

export function ProjectsEmptyState({ onCreateProject }: ProjectsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-8">
        <Code2 className="w-12 h-12 text-gray-400" />
      </div>
      
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome to Code Index
      </h1>
      
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
        Index your code projects and chat with AI to understand functions, classes, and architecture. 
        Get instant insights about your codebase.
      </p>
      
      <Button 
        onClick={onCreateProject}
        size="lg"
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create Your First Project
      </Button>
    </div>
  )
}
