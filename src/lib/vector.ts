import { Index } from "@upstash/vector";

let vectorIndex: Index | null = null;

if (
  process.env.UPSTASH_VECTOR_REST_URL &&
  process.env.UPSTASH_VECTOR_REST_TOKEN
) {
  vectorIndex = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });
}

export { vectorIndex };

export interface CodeMetadata {
  projectId: string;
  fileId: string;
  filePath: string;
  fileName: string;
  language?: string;
  startLine: number;
  endLine: number;
  chunkType:
    | "function"
    | "class"
    | "interface"
    | "variable"
    | "comment"
    | "general";
  symbols?: string[]; // Function names, class names, etc.
}

export async function upsertCodeChunk(
  id: string,
  content: string,
  metadata: CodeMetadata
) {
  if (!vectorIndex) {
    console.warn("Vector index not configured, skipping upsert");
    return { success: false, error: "Vector index not configured" };
  }

  try {
    await vectorIndex.upsert({
      id,
      data: content, // Let Upstash handle embedding generation
      metadata,
    });
    return { success: true };
  } catch (error) {
    console.error("Error upserting code chunk:", error);
    return { success: false, error };
  }
}

export async function searchCode(
  query: string,
  projectId?: string,
  topK: number = 10
) {
  if (!vectorIndex) {
    console.warn("Vector index not configured, skipping search");
    return {
      success: false,
      error: "Vector index not configured",
      results: [],
    };
  }

  try {
    const filter = projectId ? `projectId = '${projectId}'` : undefined;

    const results = await vectorIndex.query({
      data: query,
      topK,
      includeMetadata: true,
      filter,
    });

    return {
      success: true,
      results: results.map((result) => ({
        id: result.id,
        score: result.score,
        content: result.metadata?.content || "",
        metadata: result.metadata as CodeMetadata,
      })),
    };
  } catch (error) {
    console.error("Error searching code:", error);
    return { success: false, error, results: [] };
  }
}

export async function deleteCodeChunks(ids: string[]) {
  if (!vectorIndex) {
    console.warn("Vector index not configured, skipping delete");
    return { success: false, error: "Vector index not configured" };
  }

  try {
    await vectorIndex.delete(ids);
    return { success: true };
  } catch (error) {
    console.error("Error deleting code chunks:", error);
    return { success: false, error };
  }
}

export async function getIndexStats() {
  if (!vectorIndex) {
    console.warn("Vector index not configured, skipping stats");
    return { success: false, error: "Vector index not configured" };
  }

  try {
    const stats = await vectorIndex.info();
    return { success: true, stats };
  } catch (error) {
    console.error("Error getting index stats:", error);
    return { success: false, error };
  }
}
