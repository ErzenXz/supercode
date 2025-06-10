'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface ProjectsHeaderProps {
  onCreateProject: () => void
}

export function ProjectsHeader({ onCreateProject }: ProjectsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Your Projects
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage and analyze your code projects with AI
        </p>
      </div>
      
      <Button 
        onClick={onCreateProject}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Project
      </Button>
    </div>
  )
}
