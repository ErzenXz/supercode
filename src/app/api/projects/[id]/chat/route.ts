import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchCode, enhancedSearchCode } from "@/lib/vector";
import {
  createProvider,
  getConfiguredProviders,
  getProviderConfig,
} from "@/lib/ai-providers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { message, history = [] } = body;

    // Get project
    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Enhanced multi-step search for relevant code
    console.log(`🔍 Starting enhanced search for query: "${message}"`);
    const enhancedResults = await enhancedSearchCode(message, project.id, {
      maxResults: 20,
      searchDepth: 5,
      includeRelated: true,
      contextWindow: 12000,
    });

    let contextualInfo = "";
    let searchMetadata = "";

    if (enhancedResults.success && enhancedResults.results.length > 0) {
      console.log(
        `✅ Enhanced search completed: ${enhancedResults.totalSearches} searches, ${enhancedResults.results.length} results`
      );
      console.log(`📊 Search strategy: ${enhancedResults.searchStrategy}`);

      // Use the pre-built context summary from enhanced search
      contextualInfo = `\n\nRelevant code context (${enhancedResults.results.length} files found):\n${enhancedResults.contextSummary}`;

      // Add search metadata for the AI
      searchMetadata = `\n\nSearch Analysis:
- Total searches performed: ${enhancedResults.totalSearches}
- Search strategies used: ${enhancedResults.searchStrategy}
- Files analyzed: ${enhancedResults.results.length}
- Context quality: High (multi-step retrieval with dependency analysis)`;
    } else {
      console.log(`❌ Enhanced search failed, falling back to basic search`);
      // Fallback to basic search
      const basicResults = await searchCode(message, project.id, 10);
      if (basicResults.success && basicResults.results.length > 0) {
        contextualInfo =
          "\n\nRelevant code context:\n" +
          basicResults.results
            .map(
              (result) => `File: ${result.metadata.filePath}\n${result.content}`
            )
            .join("\n\n");
        searchMetadata =
          "\n\nSearch Analysis: Basic search used (enhanced search unavailable)";
      }
    }

    // Get selected model (default to Qwen free model)
    const selectedModel =
      process.env.SELECTED_MODEL || "qwen/qwen-2.5-72b-instruct:free";

    let aiResponse: string;

    // Try to use OpenRouter first for the selected model
    if (process.env.OPENROUTER_API_KEY && selectedModel.includes("/")) {
      try {
        const systemMessage = `You are an expert AI code assistant with advanced codebase analysis capabilities.

PROJECT INFORMATION:
- Name: "${project.name}"
- Path: "${project.path}"
${project.description ? `- Description: ${project.description}` : ""}
${project.language ? `- Primary Language: ${project.language}` : ""}
${project.framework ? `- Framework: ${project.framework}` : ""}

CONTEXT ANALYSIS:
I have performed an advanced multi-step search of the codebase to find the most relevant code for your question. This includes:
- Semantic similarity search
- Symbol and identifier matching
- Dependency and relationship analysis
- Code pattern recognition
- Cross-reference analysis

INSTRUCTIONS:
1. Use the provided code context to give accurate, specific answers
2. Reference actual file names, function names, and line numbers when possible
3. Explain code relationships and dependencies
4. Provide practical examples and usage patterns
5. If you see related code that might be helpful, mention it
6. Be precise about implementation details
7. Suggest improvements or best practices when relevant

IMPORTANT: The code context provided has been carefully curated through multiple search strategies to ensure high relevance and completeness.

${contextualInfo}
${searchMetadata}`;

        const messages = [
          { role: "system", content: systemMessage },
          ...history.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: "user", content: message },
        ];

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer":
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
              "X-Title": "Code Index Chat",
            },
            body: JSON.stringify({
              model: selectedModel,
              messages,
              temperature: 0.7,
              max_tokens: 2000,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          aiResponse =
            data.choices[0]?.message?.content || "No response generated";
        } else {
          throw new Error(`OpenRouter API error: ${response.status}`);
        }
      } catch (error) {
        console.error("OpenRouter API error:", error);
        // Fall back to other providers or mock response
        aiResponse =
          (await tryOtherProviders(
            message,
            project,
            contextualInfo,
            history
          )) ||
          generateMockResponse(
            message,
            project,
            enhancedResults.success ? enhancedResults.results : [],
            enhancedResults
          );
      }
    } else {
      // Fall back to configured providers
      aiResponse =
        (await tryOtherProviders(message, project, contextualInfo, history)) ||
        generateMockResponse(
          message,
          project,
          enhancedResults.success ? enhancedResults.results : [],
          enhancedResults
        );
    }

    // Save chat session and messages
    let chatSession = await db.chatSession.findFirst({
      where: { projectId: project.id },
      orderBy: { updatedAt: "desc" },
    });

    if (!chatSession) {
      chatSession = await db.chatSession.create({
        data: {
          projectId: project.id,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        },
      });
    }

    // Save user message
    await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "user",
        content: message,
      },
    });

    // Save assistant response
    await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "assistant",
        content: aiResponse,
      },
    });

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

async function tryOtherProviders(
  message: string,
  project: any,
  contextualInfo: string,
  history: any[]
): Promise<string | null> {
  try {
    // Get configured AI providers
    const configuredProviders = getConfiguredProviders();
    const availableProvider = configuredProviders.find((p) => p.isConfigured);

    if (availableProvider) {
      const config = getProviderConfig(availableProvider.name);
      const provider = createProvider(availableProvider.name, config);

      const systemMessage = `You are an expert AI code assistant with advanced codebase analysis capabilities.

PROJECT INFORMATION:
- Name: "${project.name}"
- Path: "${project.path}"
${project.description ? `- Description: ${project.description}` : ""}
${project.language ? `- Primary Language: ${project.language}` : ""}
${project.framework ? `- Framework: ${project.framework}` : ""}

CONTEXT ANALYSIS:
I have performed an advanced multi-step search of the codebase to find the most relevant code for your question. This includes semantic similarity search, symbol matching, dependency analysis, and cross-reference analysis.

INSTRUCTIONS:
1. Use the provided code context to give accurate, specific answers
2. Reference actual file names, function names, and line numbers when possible
3. Explain code relationships and dependencies
4. Provide practical examples and usage patterns
5. Be precise about implementation details
6. Suggest improvements or best practices when relevant

${contextualInfo}
${searchMetadata}`;

      const messages = [
        { role: "system" as const, content: systemMessage },
        ...history.map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        { role: "user" as const, content: message },
      ];

      const response = await provider.chat(messages);
      return response.content;
    }
  } catch (error) {
    console.error("Other providers error:", error);
  }

  return null;
}

function generateMockResponse(
  message: string,
  project: any,
  searchResults: any[],
  enhancedResults?: any
): string {
  const lowerMessage = message.toLowerCase();

  // If we have enhanced search results, use them for better responses
  if (
    enhancedResults &&
    enhancedResults.success &&
    enhancedResults.results.length > 0
  ) {
    const fileCount = enhancedResults.results.length;
    const searchInfo = enhancedResults.searchStrategy;

    return `Based on my advanced analysis of your ${project.name} project, I found ${fileCount} relevant code sections using ${enhancedResults.totalSearches} different search strategies (${searchInfo}).

Here's what I discovered:

${enhancedResults.contextSummary}

This analysis used multi-step retrieval including:
- Semantic similarity matching
- Symbol and identifier recognition
- Dependency relationship mapping
- Cross-reference analysis

Would you like me to dive deeper into any specific aspect of the code I found?`;
  }

  if (lowerMessage.includes("function") || lowerMessage.includes("method")) {
    if (searchResults.length > 0) {
      return `I found some relevant functions in your ${
        project.name
      } project. Based on the code I can see, here are the functions that might be relevant to your question:\n\n${searchResults
        .map(
          (r) => `- ${r.metadata.filePath}: Contains code related to your query`
        )
        .join(
          "\n"
        )}\n\nWould you like me to explain any specific function in detail?`;
    }
    return `I'd be happy to help you understand the functions in your ${project.name} project. However, it looks like the project hasn't been fully indexed yet. Once indexing is complete, I'll be able to provide detailed information about specific functions, their parameters, return values, and usage examples.`;
  }

  if (lowerMessage.includes("class") || lowerMessage.includes("component")) {
    return `I can help you understand the classes and components in your ${
      project.name
    } project. ${
      project.language === "javascript" || project.language === "typescript"
        ? "Since this is a JavaScript/TypeScript project, I can explain React components, ES6 classes, and their relationships."
        : `Since this is a ${project.language} project, I can explain the class structure and inheritance patterns.`
    }`;
  }

  if (lowerMessage.includes("how") && lowerMessage.includes("work")) {
    return `I can explain how different parts of your ${project.name} project work together. This includes:\n\n- Code architecture and structure\n- Function and class relationships\n- Data flow and dependencies\n- Best practices and potential improvements\n\nWhat specific part would you like me to explain?`;
  }

  if (
    lowerMessage.includes("bug") ||
    lowerMessage.includes("error") ||
    lowerMessage.includes("issue")
  ) {
    return `I can help you debug issues in your ${project.name} project. To provide the best assistance, please:\n\n1. Describe the specific error or unexpected behavior\n2. Share the relevant code section\n3. Mention when the issue occurs\n\nI'll analyze your codebase and suggest potential solutions.`;
  }

  return `I'm here to help you understand your ${project.name} project! I can assist with:\n\n- Explaining how functions and classes work\n- Understanding code architecture\n- Finding specific code patterns\n- Debugging issues\n- Suggesting improvements\n\nWhat would you like to know about your codebase?`;
}
