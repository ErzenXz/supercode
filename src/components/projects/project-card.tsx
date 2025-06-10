'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Folder, Calendar, FileText, Code } from 'lucide-react'

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

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'indexing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Indexed'
      case 'indexing': return 'Indexing...'
      case 'failed': return 'Failed'
      default: return 'Pending'
    }
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 h-full"
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg truncate">{project.name}</h3>
          </div>
          <Badge className={getStatusColor(project.indexingStatus)}>
            {getStatusText(project.indexingStatus)}
          </Badge>
        </div>
        
        {project.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {project.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {(project.language || project.framework) && (
            <div className="flex gap-2 flex-wrap">
              {project.language && (
                <Badge variant="secondary" className="text-xs">
                  {project.language}
                </Badge>
              )}
              {project.framework && (
                <Badge variant="secondary" className="text-xs">
                  {project.framework}
                </Badge>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{project.totalFiles} files</span>
            </div>
            <div className="flex items-center gap-1">
              <Code className="w-4 h-4" />
              <span>{project.totalLines.toLocaleString()} lines</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
