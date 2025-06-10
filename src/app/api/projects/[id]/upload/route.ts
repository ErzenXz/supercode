import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";
import { shouldUploadFile } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const paths = formData.getAll("paths") as string[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedFiles: Array<{
      path: string;
      name: string;
      size: number;
      status: "uploaded" | "updated" | "skipped" | "filtered";
    }> = [];

    let filteredCount = 0;

    // Ensure project directory exists
    const projectDir = project.path;
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = paths[i] || file.name;
      const fullPath = path.join(projectDir, relativePath);

      // Server-side filtering as safety net
      if (!shouldUploadFile(relativePath)) {
        filteredCount++;
        uploadedFiles.push({
          path: relativePath,
          name: file.name,
          size: file.size,
          status: "filtered",
        });
        continue;
      }

      try {
        // Ensure directory exists
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Read file content
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const content = buffer.toString("utf-8");

        // Calculate hash for change detection
        const hash = crypto.createHash("md5").update(content).digest("hex");

        // Check if file already exists with same content
        let status: "uploaded" | "updated" | "skipped" = "uploaded";

        if (fs.existsSync(fullPath)) {
          const existingContent = fs.readFileSync(fullPath, "utf-8");
          const existingHash = crypto
            .createHash("md5")
            .update(existingContent)
            .digest("hex");

          if (existingHash === hash) {
            status = "skipped";
          } else {
            status = "updated";
          }
        }

        // Write file only if it's new or changed
        if (status !== "skipped") {
          fs.writeFileSync(fullPath, buffer);
        }

        // Count lines
        const lines = content.split("\n").length;

        // Update database record
        const extension = path.extname(file.name).toLowerCase();

        await db.projectFile.upsert({
          where: {
            projectId_path: {
              projectId: id,
              path: relativePath,
            },
          },
          update: {
            name: file.name,
            extension,
            size: file.size,
            lines,
            content: file.size < 100000 ? content : null,
            hash,
            isIndexed: false, // Mark for re-indexing
            updatedAt: new Date(),
          },
          create: {
            projectId: id,
            path: relativePath,
            name: file.name,
            extension,
            size: file.size,
            lines,
            content: file.size < 100000 ? content : null,
            hash,
            isIndexed: false,
          },
        });

        uploadedFiles.push({
          path: relativePath,
          name: file.name,
          size: file.size,
          status,
        });
      } catch (error) {
        console.error(`Error processing file ${relativePath}:`, error);
        // Continue with other files
      }
    }

    // Update project statistics
    const totalFiles = await db.projectFile.count({
      where: { projectId: id },
    });

    const indexedFiles = await db.projectFile.count({
      where: {
        projectId: id,
        isIndexed: true,
      },
    });

    const totalLinesResult = await db.projectFile.aggregate({
      where: { projectId: id },
      _sum: { lines: true },
    });

    await db.project.update({
      where: { id },
      data: {
        totalFiles,
        indexedFiles,
        totalLines: totalLinesResult._sum.lines || 0,
        indexingStatus: "pending", // Mark for re-indexing
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Files uploaded successfully",
      uploadedFiles,
      filteredCount,
      stats: {
        totalFiles,
        indexedFiles,
        totalLines: totalLinesResult._sum.lines || 0,
      },
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
