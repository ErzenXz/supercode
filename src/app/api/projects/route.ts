import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // For now, we'll create a default user if none exists
    let user = await db.user.findFirst()
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo User',
        },
      })
    }

    const projects = await db.project.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, path, language, framework } = body

    if (!name || !path) {
      return NextResponse.json(
        { error: 'Name and path are required' },
        { status: 400 }
      )
    }

    // Get or create default user
    let user = await db.user.findFirst()
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo User',
        },
      })
    }

    // Check if project with same path already exists
    const existingProject = await db.project.findFirst({
      where: {
        path,
        userId: user.id,
      },
    })

    if (existingProject) {
      return NextResponse.json(
        { error: 'Project with this path already exists' },
        { status: 400 }
      )
    }

    const project = await db.project.create({
      data: {
        name,
        description,
        path,
        language,
        framework,
        userId: user.id,
      },
    })

    // Start indexing process in the background
    // For now, we'll just mark it as pending
    // In a real app, you'd trigger the indexing process here

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
