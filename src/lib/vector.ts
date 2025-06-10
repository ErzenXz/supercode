import { Index } from "@upstash/vector";
import { analyzeQuery } from "./query-analysis";

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

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: CodeMetadata;
  relevanceReason?: string;
}

export interface EnhancedSearchResults {
  success: boolean;
  error?: any;
  results: SearchResult[];
  searchStrategy: string;
  totalSearches: number;
  contextSummary: string;
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

// Advanced multi-step search with query expansion and re-ranking
export async function enhancedSearchCode(
  query: string,
  projectId: string,
  options: {
    maxResults?: number;
    searchDepth?: number;
    includeRelated?: boolean;
    contextWindow?: number;
  } = {}
): Promise<EnhancedSearchResults> {
  const {
    maxResults = 15,
    searchDepth = 3,
    includeRelated = true,
    contextWindow = 8000,
  } = options;

  if (!vectorIndex) {
    return {
      success: false,
      error: "Vector index not configured",
      results: [],
      searchStrategy: "none",
      totalSearches: 0,
      contextSummary: "Vector index not available",
    };
  }

  try {
    // Step 0: Analyze query for intelligent search strategy
    const queryAnalysis = analyzeQuery(query);
    console.log(
      `🧠 Query analysis: ${queryAnalysis.intent.type} (confidence: ${queryAnalysis.intent.confidence})`
    );
    console.log(
      `🎯 Search strategy: ${queryAnalysis.searchStrategy}, Priority: ${queryAnalysis.priority}`
    );

    let allResults: SearchResult[] = [];
    let totalSearches = 0;
    const searchStrategies: string[] = [`intent:${queryAnalysis.intent.type}`];

    // Adjust search parameters based on analysis
    const adjustedMaxResults =
      queryAnalysis.priority === "high" ? maxResults * 1.5 : maxResults;
    const adjustedSearchDepth =
      queryAnalysis.searchStrategy === "precise"
        ? searchDepth + 2
        : searchDepth;

    // Step 1: Direct semantic search
    const directSearch = await performDirectSearch(
      query,
      projectId,
      Math.ceil(adjustedMaxResults)
    );
    if (directSearch.success) {
      allResults.push(...directSearch.results);
      totalSearches++;
      searchStrategies.push("direct");
    }

    // Step 2: Intent-based smart query expansion
    const smartQueries = queryAnalysis.expandedQueries;
    for (const smartQuery of smartQueries.slice(0, adjustedSearchDepth - 1)) {
      const smartSearch = await performDirectSearch(
        smartQuery,
        projectId,
        Math.ceil(adjustedMaxResults / 2)
      );
      if (smartSearch.success) {
        allResults.push(
          ...smartSearch.results.map((r) => ({
            ...r,
            relevanceReason: `Smart expansion: "${smartQuery}" (${queryAnalysis.intent.type})`,
          }))
        );
        totalSearches++;
        searchStrategies.push("smart-expanded");
      }
    }

    // Step 3: Entity-based search (from query analysis)
    for (const entity of queryAnalysis.intent.entities.slice(0, 3)) {
      const entitySearch = await performSymbolSearch(
        entity,
        projectId,
        Math.ceil(adjustedMaxResults / 3)
      );
      if (entitySearch.success) {
        allResults.push(
          ...entitySearch.results.map((r) => ({
            ...r,
            relevanceReason: `Entity match: "${entity}" (${queryAnalysis.intent.type})`,
          }))
        );
        totalSearches++;
        searchStrategies.push("entity");
      }
    }

    // Step 4: Fallback symbol-based search (if needed)
    if (allResults.length < maxResults / 2) {
      const symbolQueries = extractCodeSymbols(query);
      for (const symbol of symbolQueries.slice(0, 2)) {
        const symbolSearch = await performSymbolSearch(
          symbol,
          projectId,
          Math.ceil(maxResults / 3)
        );
        if (symbolSearch.success) {
          allResults.push(
            ...symbolSearch.results.map((r) => ({
              ...r,
              relevanceReason: `Fallback symbol: "${symbol}"`,
            }))
          );
          totalSearches++;
          searchStrategies.push("fallback-symbol");
        }
      }
    }

    // Step 5: Dependency and relationship search
    if (includeRelated && allResults.length > 0) {
      const relatedResults = await findRelatedCode(
        allResults.slice(0, 5),
        projectId
      );
      allResults.push(
        ...relatedResults.map((r) => ({
          ...r,
          relevanceReason: "Related dependency",
        }))
      );
      if (relatedResults.length > 0) {
        totalSearches++;
        searchStrategies.push("related");
      }
    }

    // Step 6: Re-rank and deduplicate results with query analysis
    const rankedResults = reRankResultsWithAnalysis(
      allResults,
      query,
      queryAnalysis,
      maxResults
    );

    // Step 7: Build enhanced context summary
    const contextSummary = buildEnhancedContextSummary(
      rankedResults,
      queryAnalysis,
      contextWindow
    );

    return {
      success: true,
      results: rankedResults,
      searchStrategy: searchStrategies.join(" + "),
      totalSearches,
      contextSummary,
    };
  } catch (error) {
    console.error("Error in enhanced search:", error);
    return {
      success: false,
      error,
      results: [],
      searchStrategy: "error",
      totalSearches: 0,
      contextSummary: "Search failed",
    };
  }
}

// Helper function for direct search
async function performDirectSearch(
  query: string,
  projectId: string,
  topK: number
) {
  const filter = `projectId = '${projectId}'`;

  try {
    const results = await vectorIndex!.query({
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
    console.error("Error in direct search:", error);
    return { success: false, results: [] };
  }
}

// Generate expanded queries for better coverage
function generateExpandedQueries(originalQuery: string): string[] {
  const queries: string[] = [];
  const lowerQuery = originalQuery.toLowerCase();

  // Add technical variations
  if (lowerQuery.includes("function")) {
    queries.push(originalQuery.replace(/function/gi, "method"));
    queries.push(originalQuery.replace(/function/gi, "procedure"));
  }

  if (lowerQuery.includes("class")) {
    queries.push(originalQuery.replace(/class/gi, "component"));
    queries.push(originalQuery.replace(/class/gi, "object"));
  }

  if (lowerQuery.includes("variable")) {
    queries.push(originalQuery.replace(/variable/gi, "property"));
    queries.push(originalQuery.replace(/variable/gi, "field"));
  }

  // Add context-aware expansions
  if (lowerQuery.includes("how")) {
    queries.push(originalQuery.replace(/how/gi, "implementation"));
    queries.push(originalQuery.replace(/how/gi, "logic"));
  }

  if (lowerQuery.includes("what")) {
    queries.push(originalQuery.replace(/what/gi, "definition"));
    queries.push(originalQuery.replace(/what/gi, "purpose"));
  }

  // Add semantic variations
  queries.push(`${originalQuery} implementation`);
  queries.push(`${originalQuery} example`);
  queries.push(`${originalQuery} usage`);

  return queries.filter((q) => q !== originalQuery).slice(0, 5);
}

// Extract code symbols from query
function extractCodeSymbols(query: string): string[] {
  const symbols: string[] = [];

  // Match camelCase, PascalCase, snake_case identifiers
  const identifierRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*[a-zA-Z0-9]\b/g;
  const matches = query.match(identifierRegex) || [];

  // Filter out common words
  const commonWords = new Set([
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "up",
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "among",
    "this",
    "that",
    "these",
    "those",
    "what",
    "how",
    "when",
    "where",
    "why",
    "which",
    "who",
    "whom",
    "function",
    "class",
    "method",
    "variable",
    "property",
    "component",
  ]);

  for (const match of matches) {
    if (!commonWords.has(match.toLowerCase()) && match.length > 2) {
      symbols.push(match);
    }
  }

  return [...new Set(symbols)];
}

// Symbol-based search for exact matches
async function performSymbolSearch(
  symbol: string,
  projectId: string,
  topK: number
) {
  const filter = `projectId = '${projectId}'`;

  try {
    // Search for exact symbol matches
    const results = await vectorIndex!.query({
      data: `${symbol} function method class variable property`,
      topK,
      includeMetadata: true,
      filter,
    });

    return {
      success: true,
      results: results
        .filter((result) => {
          const content = result.metadata?.content || "";
          // Check if the symbol appears in the content
          const symbolRegex = new RegExp(`\\b${symbol}\\b`, "i");
          return symbolRegex.test(content);
        })
        .map((result) => ({
          id: result.id,
          score: result.score,
          content: result.metadata?.content || "",
          metadata: result.metadata as CodeMetadata,
        })),
    };
  } catch (error) {
    console.error("Error in symbol search:", error);
    return { success: false, results: [] };
  }
}

// Find related code based on imports, dependencies, and references
async function findRelatedCode(
  baseResults: SearchResult[],
  projectId: string
): Promise<SearchResult[]> {
  const relatedResults: SearchResult[] = [];

  try {
    for (const result of baseResults) {
      const content = result.content;
      const filePath = result.metadata.filePath;

      // Extract imports and dependencies
      const imports = extractImports(content);
      const references = extractReferences(content);

      // Search for related files
      for (const importPath of imports.slice(0, 3)) {
        const relatedSearch = await performDirectSearch(
          `file:${importPath}`,
          projectId,
          3
        );
        if (relatedSearch.success) {
          relatedResults.push(...relatedSearch.results);
        }
      }

      // Search for files that import this file
      const fileName =
        filePath
          .split("/")
          .pop()
          ?.replace(/\.[^/.]+$/, "") || "";
      if (fileName) {
        const dependentSearch = await performDirectSearch(
          `import ${fileName}`,
          projectId,
          3
        );
        if (dependentSearch.success) {
          relatedResults.push(...dependentSearch.results);
        }
      }
    }
  } catch (error) {
    console.error("Error finding related code:", error);
  }

  return relatedResults;
}

// Extract import statements from code
function extractImports(content: string): string[] {
  const imports: string[] = [];

  // JavaScript/TypeScript imports
  const jsImportRegex = /import.*?from\s+['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = jsImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Python imports
  const pyImportRegex = /(?:from\s+(\S+)\s+)?import\s+([^#\n]+)/g;
  while ((match = pyImportRegex.exec(content)) !== null) {
    if (match[1]) imports.push(match[1]);
  }

  // Java imports
  const javaImportRegex = /import\s+([^;]+);/g;
  while ((match = javaImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

// Extract code references and function calls
function extractReferences(content: string): string[] {
  const references: string[] = [];

  // Function calls
  const functionCallRegex = /(\w+)\s*\(/g;
  let match;
  while ((match = functionCallRegex.exec(content)) !== null) {
    references.push(match[1]);
  }

  return [...new Set(references)];
}

// Re-rank and deduplicate results based on relevance
function reRankResults(
  results: SearchResult[],
  originalQuery: string,
  maxResults: number
): SearchResult[] {
  // Remove duplicates based on file path and content similarity
  const uniqueResults = new Map<string, SearchResult>();

  for (const result of results) {
    const key = `${result.metadata.filePath}:${result.content.slice(0, 100)}`;
    if (
      !uniqueResults.has(key) ||
      result.score > uniqueResults.get(key)!.score
    ) {
      uniqueResults.set(key, result);
    }
  }

  // Convert back to array and sort by enhanced relevance score
  const deduplicatedResults = Array.from(uniqueResults.values());

  // Calculate enhanced relevance scores
  const rankedResults = deduplicatedResults.map((result) => {
    let relevanceScore = result.score;

    // Boost score for exact keyword matches
    const queryWords = originalQuery.toLowerCase().split(/\s+/);
    const contentLower = result.content.toLowerCase();

    for (const word of queryWords) {
      if (word.length > 2) {
        const exactMatches = (
          contentLower.match(new RegExp(`\\b${word}\\b`, "g")) || []
        ).length;
        relevanceScore += exactMatches * 0.1;
      }
    }

    // Boost score for function/class definitions
    if (
      result.content.includes("function ") ||
      result.content.includes("class ") ||
      result.content.includes("def ") ||
      result.content.includes("const ")
    ) {
      relevanceScore += 0.2;
    }

    // Boost score for files with better metadata
    if (result.metadata.language) {
      relevanceScore += 0.05;
    }

    return { ...result, enhancedScore: relevanceScore };
  });

  // Sort by enhanced score and return top results
  return rankedResults
    .sort((a, b) => b.enhancedScore - a.enhancedScore)
    .slice(0, maxResults);
}

// Enhanced re-ranking with query analysis
function reRankResultsWithAnalysis(
  results: SearchResult[],
  originalQuery: string,
  queryAnalysis: any,
  maxResults: number
): SearchResult[] {
  // Remove duplicates based on file path and content similarity
  const uniqueResults = new Map<string, SearchResult>();

  for (const result of results) {
    const key = `${result.metadata.filePath}:${result.content.slice(0, 100)}`;
    if (
      !uniqueResults.has(key) ||
      result.score > uniqueResults.get(key)!.score
    ) {
      uniqueResults.set(key, result);
    }
  }

  // Convert back to array and sort by enhanced relevance score
  const deduplicatedResults = Array.from(uniqueResults.values());

  // Calculate enhanced relevance scores with query analysis
  const rankedResults = deduplicatedResults.map((result) => {
    let relevanceScore = result.score;

    // Boost score for intent-specific matches
    if (
      queryAnalysis.intent.type === "function" &&
      (result.content.includes("function ") ||
        result.content.includes("def ") ||
        result.content.includes("const "))
    ) {
      relevanceScore += 0.3;
    }

    if (
      queryAnalysis.intent.type === "class" &&
      (result.content.includes("class ") ||
        result.content.includes("component"))
    ) {
      relevanceScore += 0.3;
    }

    if (
      queryAnalysis.intent.type === "debug" &&
      (result.content.includes("try") ||
        result.content.includes("catch") ||
        result.content.includes("error"))
    ) {
      relevanceScore += 0.25;
    }

    // Boost score for entity matches
    for (const entity of queryAnalysis.intent.entities) {
      const entityRegex = new RegExp(`\\b${entity}\\b`, "gi");
      const matches = (result.content.match(entityRegex) || []).length;
      relevanceScore += matches * 0.15;
    }

    // Boost score for exact keyword matches
    const queryWords = originalQuery.toLowerCase().split(/\s+/);
    const contentLower = result.content.toLowerCase();

    for (const word of queryWords) {
      if (word.length > 2) {
        const exactMatches = (
          contentLower.match(new RegExp(`\\b${word}\\b`, "g")) || []
        ).length;
        relevanceScore += exactMatches * 0.1;
      }
    }

    // Boost score for files with better metadata
    if (result.metadata.language) {
      relevanceScore += 0.05;
    }

    return { ...result, enhancedScore: relevanceScore };
  });

  // Sort by enhanced score and return top results
  return rankedResults
    .sort((a, b) => b.enhancedScore - a.enhancedScore)
    .slice(0, maxResults);
}

// Build enhanced context summary with query analysis
function buildEnhancedContextSummary(
  results: SearchResult[],
  queryAnalysis: any,
  maxTokens: number
): string {
  if (results.length === 0) {
    return "No relevant code found in the project.";
  }

  let summary = `Query Intent: ${queryAnalysis.intent.type} (confidence: ${queryAnalysis.intent.confidence})\n`;
  summary += `Context: ${queryAnalysis.intent.context}\n`;

  if (queryAnalysis.intent.entities.length > 0) {
    summary += `Key Entities: ${queryAnalysis.intent.entities.join(", ")}\n`;
  }

  summary += `\nCode Analysis Results:\n`;

  let tokenCount = summary.length * 0.25;
  const avgTokensPerChar = 0.25;

  // Group results by file for better organization
  const fileGroups = new Map<string, SearchResult[]>();
  for (const result of results) {
    const filePath = result.metadata.filePath;
    if (!fileGroups.has(filePath)) {
      fileGroups.set(filePath, []);
    }
    fileGroups.get(filePath)!.push(result);
  }

  // Build context from each file group
  for (const [filePath, fileResults] of fileGroups) {
    if (tokenCount >= maxTokens) break;

    const fileHeader = `\n\n=== ${filePath} ===\n`;
    const headerTokens = fileHeader.length * avgTokensPerChar;

    if (tokenCount + headerTokens < maxTokens) {
      summary += fileHeader;
      tokenCount += headerTokens;

      for (const result of fileResults) {
        const contentTokens = result.content.length * avgTokensPerChar;
        if (tokenCount + contentTokens < maxTokens) {
          summary += `\n${result.content}\n`;
          tokenCount += contentTokens;

          if (result.relevanceReason) {
            summary += `// Relevance: ${result.relevanceReason}\n`;
          }
        } else {
          // Add truncated content if we're near the limit
          const remainingTokens = maxTokens - tokenCount;
          const remainingChars = Math.floor(remainingTokens / avgTokensPerChar);
          if (remainingChars > 100) {
            summary += `\n${result.content.slice(0, remainingChars)}...\n`;
          }
          break;
        }
      }
    }
  }

  return summary;
}

// Build comprehensive context summary (fallback)
function buildContextSummary(
  results: SearchResult[],
  maxTokens: number
): string {
  return buildEnhancedContextSummary(
    results,
    {
      intent: {
        type: "general",
        confidence: 0.5,
        context: "General search",
        entities: [],
      },
    },
    maxTokens
  );
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
