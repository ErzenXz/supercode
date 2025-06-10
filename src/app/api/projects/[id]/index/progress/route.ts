import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get current progress from global store
    const progress = globalThis.indexingProgress?.get(id);

    if (!progress) {
      // Check project status from database
      const project = await db.project.findUnique({
        where: { id },
        select: {
          indexingStatus: true,
          totalFiles: true,
          indexedFiles: true,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      // Return database status if no active progress
      return NextResponse.json({
        progress: {
          status:
            project.indexingStatus === "indexing" ? "indexing" : "completed",
          totalFiles: project.totalFiles,
          processedFiles: project.indexedFiles,
          currentFile:
            project.indexingStatus === "indexing"
              ? "Processing..."
              : "Completed",
          startTime: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      progress: {
        ...progress,
        startTime: progress.startTime.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error getting indexing progress:", error);
    return NextResponse.json(
      { error: "Failed to get progress" },
      { status: 500 }
    );
  }
}
