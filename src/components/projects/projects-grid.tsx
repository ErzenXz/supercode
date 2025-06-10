'use client'

import { ProjectCard } from './project-card'

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

interface ProjectsGridProps {
  projects: Project[]
  onProjectClick: (projectId: string) => void
}

export function ProjectsGrid({ projects, onProjectClick }: ProjectsGridProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No projects found. Try adjusting your search query.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={() => onProjectClick(project.id)}
        />
      ))}
    </div>
  )
}
