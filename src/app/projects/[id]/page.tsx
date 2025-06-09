import { ProjectChatPage } from '@/components/projects/project-chat-page'

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return <ProjectChatPage projectId={params.id} />
}
