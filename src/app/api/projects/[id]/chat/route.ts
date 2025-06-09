import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchCode } from "@/lib/vector";
import {
  createProvider,
  getConfiguredProviders,
  getProviderConfig,
} from "@/lib/ai-providers";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    // Get project
    const project = await db.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Search for relevant code
    const searchResults = await searchCode(message, project.id, 5);

    let contextualInfo = "";
    if (searchResults.success && searchResults.results.length > 0) {
      contextualInfo =
        "\n\nRelevant code context:\n" +
        searchResults.results
          .map(
            (result) => `File: ${result.metadata.filePath}\n${result.content}`
          )
          .join("\n\n");
    }

    // Get configured AI providers
    const configuredProviders = getConfiguredProviders();
    const availableProvider = configuredProviders.find((p) => p.isConfigured);

    let aiResponse: string;

    if (availableProvider) {
      // Use real AI provider
      try {
        const config = getProviderConfig(availableProvider.name);
        const provider = createProvider(availableProvider.name, config);

        const systemMessage = `You are a helpful AI assistant that helps developers understand their codebase.
You have access to the project "${project.name}" located at "${project.path}".
${project.description ? `Project description: ${project.description}` : ""}
${project.language ? `Primary language: ${project.language}` : ""}
${project.framework ? `Framework: ${project.framework}` : ""}

When answering questions about the code, be specific and reference the actual code when possible.
${contextualInfo}`;

        const messages = [
          { role: "system" as const, content: systemMessage },
          ...history.map((msg: any) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
          { role: "user" as const, content: message },
        ];

        const response = await provider.chat(messages);
        aiResponse = response.content;
      } catch (error) {
        console.error("AI provider error:", error);
        aiResponse = generateMockResponse(
          message,
          project,
          searchResults.results
        );
      }
    } else {
      // Fall back to mock response
      aiResponse = generateMockResponse(
        message,
        project,
        searchResults.results
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

function generateMockResponse(
  message: string,
  project: any,
  searchResults: any[]
): string {
  const lowerMessage = message.toLowerCase();

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
