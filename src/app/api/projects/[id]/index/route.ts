import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { indexProject } from '@/lib/indexing'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await db.project.findUnique({
      where: { id: params.id },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if already indexing
    if (project.indexingStatus === 'indexing') {
      return NextResponse.json(
        { error: 'Project is already being indexed' },
        { status: 400 }
      )
    }

    // Start indexing in background
    indexProject(params.id).catch(error => {
      console.error('Background indexing failed:', error)
    })

    return NextResponse.json({ 
      message: 'Indexing started',
      status: 'indexing'
    })
  } catch (error) {
    console.error('Error starting indexing:', error)
    return NextResponse.json(
      { error: 'Failed to start indexing' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        files: {
          select: {
            id: true,
            path: true,
            name: true,
            extension: true,
            size: true,
            lines: true,
            isIndexed: true,
            lastIndexedAt: true,
          },
          orderBy: {
            path: 'asc',
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        indexingStatus: project.indexingStatus,
        totalFiles: project.totalFiles,
        indexedFiles: project.indexedFiles,
        totalLines: project.totalLines,
        lastIndexedAt: project.lastIndexedAt,
      },
      files: project.files,
    })
  } catch (error) {
    console.error('Error fetching indexing status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch indexing status' },
      { status: 500 }
    )
  }
}
