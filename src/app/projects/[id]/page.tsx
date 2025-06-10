import { ProjectChatPage } from '@/components/projects/project-chat-page'

interface ProjectPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  return <ProjectChatPage projectId={id} />
}
