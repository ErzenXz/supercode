import * as fs from "fs";
import * as path from "path";
import { db } from "./db";
import { upsertCodeChunk, CodeMetadata } from "./vector";
import {
  shouldIndexFile,
  getFileExtension,
  getLanguageFromExtension,
  chunkCode,
  extractCodeSymbols,
  formatFileSize,
} from "./utils";
import crypto from "crypto";

export interface IndexingProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
  status: "scanning" | "indexing" | "completed" | "failed";
  error?: string;
}

export async function indexProject(
  projectId: string,
  onProgress?: (progress: IndexingProgress) => void,
  incrementalOnly: boolean = false
) {
  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Update project status
    await db.project.update({
      where: { id: projectId },
      data: { indexingStatus: "indexing" },
    });

    const progressUpdate = {
      totalFiles: 0,
      processedFiles: 0,
      currentFile: "Scanning files...",
      status: "scanning" as const,
    };

    onProgress?.(progressUpdate);

    // Update progress in global store for real-time tracking
    if (typeof globalThis !== "undefined") {
      globalThis.indexingProgress = globalThis.indexingProgress || new Map();
      globalThis.indexingProgress.set(projectId, {
        ...progressUpdate,
        startTime: new Date(),
      });
    }

    let filesToProcess: Array<{
      path: string;
      relativePath: string;
      name: string;
      size: number;
      lines: number;
    }> = [];

    if (incrementalOnly) {
      // Only process files that are not indexed or have been updated
      const unindexedFiles = await db.projectFile.findMany({
        where: {
          projectId,
          isIndexed: false,
        },
      });

      // Convert database files to the expected format
      filesToProcess = unindexedFiles.map((file) => ({
        path: `${project.path}/${file.path}`,
        relativePath: file.path,
        name: file.name,
        size: file.size,
        lines: file.lines,
      }));
    } else {
      // Scan directory for all files
      const files = await scanDirectory(project.path);
      filesToProcess = files.filter((file) => shouldIndexFile(file.path));
    }

    const indexableFiles = filesToProcess;

    const indexingUpdate = {
      totalFiles: indexableFiles.length,
      processedFiles: 0,
      currentFile: "Starting indexing...",
      status: "indexing" as const,
    };

    onProgress?.(indexingUpdate);

    // Update global progress
    if (typeof globalThis !== "undefined" && globalThis.indexingProgress) {
      const existing = globalThis.indexingProgress.get(projectId);
      globalThis.indexingProgress.set(projectId, {
        ...existing,
        ...indexingUpdate,
      });
    }

    let processedCount = 0;
    let totalLines = 0;

    for (const file of indexableFiles) {
      try {
        const fileUpdate = {
          totalFiles: indexableFiles.length,
          processedFiles: processedCount,
          currentFile: file.relativePath,
          status: "indexing" as const,
        };

        onProgress?.(fileUpdate);

        // Update global progress
        if (typeof globalThis !== "undefined" && globalThis.indexingProgress) {
          const existing = globalThis.indexingProgress.get(projectId);
          globalThis.indexingProgress.set(projectId, {
            ...existing,
            ...fileUpdate,
          });
        }

        await indexFile(projectId, file);
        totalLines += file.lines;
        processedCount++;
      } catch (error) {
        console.error(`Error indexing file ${file.path}:`, error);
        // Continue with other files
      }
    }

    // Update project statistics
    await db.project.update({
      where: { id: projectId },
      data: {
        indexingStatus: "completed",
        isIndexed: true,
        totalFiles: indexableFiles.length,
        indexedFiles: processedCount,
        totalLines,
        lastIndexedAt: new Date(),
      },
    });

    const completedUpdate = {
      totalFiles: indexableFiles.length,
      processedFiles: processedCount,
      currentFile: "Completed!",
      status: "completed" as const,
    };

    onProgress?.(completedUpdate);

    // Update global progress
    if (typeof globalThis !== "undefined" && globalThis.indexingProgress) {
      const existing = globalThis.indexingProgress.get(projectId);
      globalThis.indexingProgress.set(projectId, {
        ...existing,
        ...completedUpdate,
      });

      // Clear progress after 30 seconds
      setTimeout(() => {
        if (globalThis.indexingProgress) {
          globalThis.indexingProgress.delete(projectId);
        }
      }, 30000);
    }

    return { success: true, processedFiles: processedCount, totalLines };
  } catch (error) {
    console.error("Error indexing project:", error);

    await db.project.update({
      where: { id: projectId },
      data: { indexingStatus: "failed" },
    });

    const errorUpdate = {
      totalFiles: 0,
      processedFiles: 0,
      currentFile: "",
      status: "failed" as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };

    onProgress?.(errorUpdate);

    // Update global progress
    if (typeof globalThis !== "undefined" && globalThis.indexingProgress) {
      const existing = globalThis.indexingProgress.get(projectId);
      globalThis.indexingProgress.set(projectId, {
        ...existing,
        ...errorUpdate,
      });
    }

    return { success: false, error };
  }
}

async function scanDirectory(dirPath: string): Promise<
  Array<{
    path: string;
    relativePath: string;
    name: string;
    size: number;
    lines: number;
  }>
> {
  const files: Array<{
    path: string;
    relativePath: string;
    name: string;
    size: number;
    lines: number;
  }> = [];

  async function scanRecursive(currentPath: string, relativePath: string = "") {
    try {
      const entries = await fs.promises.readdir(currentPath, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          // Skip common directories that shouldn't be indexed
          const skipDirs = [
            "node_modules",
            ".git",
            "dist",
            "build",
            ".next",
            "coverage",
            "vendor",
            "__pycache__",
            "target",
            "bin",
            "obj",
          ];
          if (!skipDirs.includes(entry.name)) {
            await scanRecursive(fullPath, relPath);
          }
        } else if (entry.isFile()) {
          try {
            const stats = await fs.promises.stat(fullPath);
            const content = await fs.promises.readFile(fullPath, "utf-8");
            const lines = content.split("\n").length;

            files.push({
              path: fullPath,
              relativePath: relPath,
              name: entry.name,
              size: stats.size,
              lines,
            });
          } catch (error) {
            // Skip files that can't be read
            console.warn(`Skipping file ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`Error scanning directory ${currentPath}:`, error);
    }
  }

  await scanRecursive(dirPath);
  return files;
}

async function indexFile(
  projectId: string,
  file: {
    path: string;
    relativePath: string;
    name: string;
    size: number;
    lines: number;
  }
) {
  const content = await fs.promises.readFile(file.path, "utf-8");
  const hash = crypto.createHash("md5").update(content).digest("hex");
  const extension = getFileExtension(file.name);
  const language = getLanguageFromExtension(extension);

  // Check if file already exists and hasn't changed
  const existingFile = await db.projectFile.findFirst({
    where: {
      projectId,
      path: file.relativePath,
    },
  });

  if (existingFile && existingFile.hash === hash && existingFile.isIndexed) {
    // File hasn't changed, skip indexing
    return;
  }

  // Create or update file record
  const projectFile = await db.projectFile.upsert({
    where: {
      projectId_path: {
        projectId,
        path: file.relativePath,
      },
    },
    update: {
      name: file.name,
      extension,
      size: file.size,
      lines: file.lines,
      content: file.size < 100000 ? content : null, // Store content for smaller files
      hash,
      isIndexed: false,
    },
    create: {
      projectId,
      path: file.relativePath,
      name: file.name,
      extension,
      size: file.size,
      lines: file.lines,
      content: file.size < 100000 ? content : null,
      hash,
      isIndexed: false,
    },
  });

  // Delete existing chunks
  await db.fileChunk.deleteMany({
    where: { fileId: projectFile.id },
  });

  // Chunk the file content
  const chunks = chunkCode(content, 1000);
  const symbols = extractCodeSymbols(content, language);

  // Index each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkId = `${projectFile.id}-chunk-${i}`;

    const metadata: CodeMetadata = {
      projectId,
      fileId: projectFile.id,
      filePath: file.relativePath,
      fileName: file.name,
      language,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      chunkType: "general",
      symbols: symbols.length > 0 ? symbols : undefined,
    };

    // Upsert to vector database
    const result = await upsertCodeChunk(chunkId, chunk.content, metadata);

    if (result.success) {
      // Save chunk to database
      await db.fileChunk.create({
        data: {
          fileId: projectFile.id,
          content: chunk.content,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          vectorId: chunkId,
        },
      });
    }
  }

  // Mark file as indexed
  await db.projectFile.update({
    where: { id: projectFile.id },
    data: {
      isIndexed: true,
      lastIndexedAt: new Date(),
    },
  });
}
