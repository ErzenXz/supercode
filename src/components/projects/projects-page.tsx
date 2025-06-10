'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navigation/navbar'
import { CreateProjectDialog } from './create-project-dialog'
import { ProjectsEmptyState } from './projects-empty-state'
import { ProjectsHeader } from './projects-header'
import { SearchBar } from './search-bar'
import { ProjectsGrid } from './projects-grid'
import { ProjectsLoadingSkeleton } from './projects-loading-skeleton'

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

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.language?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleProjectClick = (projectId: string) => {
    window.location.href = `/projects/${projectId}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Show empty state if no projects and not loading */}
        {projects.length === 0 && !isLoading ? (
          <ProjectsEmptyState onCreateProject={() => setIsCreateDialogOpen(true)} />
        ) : (
          <>
            {/* Header */}
            <ProjectsHeader onCreateProject={() => setIsCreateDialogOpen(true)} />
            
            {/* Search */}
            <div className="mb-8">
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search projects by name, language, or description..."
              />
            </div>
            
            {/* Projects Grid or Loading */}
            {isLoading ? (
              <ProjectsLoadingSkeleton />
            ) : (
              <ProjectsGrid 
                projects={filteredProjects}
                onProjectClick={handleProjectClick}
              />
            )}
          </>
        )}
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onProjectCreated={fetchProjects}
      />
    </div>
  )
}
