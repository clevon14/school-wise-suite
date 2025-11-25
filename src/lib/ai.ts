/**
 * Puter AI Integration Library
 * 
 * This library provides a unified interface for AI operations using Puter AI.
 * Puter AI is free-to-use but rate-limited. No API key required.
 * 
 * @see https://puter.com for more information
 */

declare global {
  interface Window {
    AI?: {
      chat: {
        completions: {
          create: (params: {
            model: string;
            messages: Array<{ role: string; content: string }>;
            stream?: boolean;
          }) => Promise<any>;
        };
      };
    };
  }
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatOptions {
  model?: string;
  stream?: boolean;
}

/**
 * Check if Puter AI is available
 */
export function isPuterAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.AI !== 'undefined';
}

/**
 * Chat with Puter AI
 * 
 * @param messages - Array of chat messages
 * @param options - Chat options (model, stream)
 * @returns Promise with AI response
 * 
 * @example
 * const response = await puterChat([
 *   { role: "system", content: "You are a helpful assistant" },
 *   { role: "user", content: "Hello!" }
 * ]);
 */
export async function puterChat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<any> {
  if (!isPuterAvailable()) {
    throw new Error("AI service is temporarily unavailable. Please try again later.");
  }

  try {
    const response = await window.AI!.chat.completions.create({
      model: options.model || "gpt-4o-mini",
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: options.stream || false,
    });

    return response;
  } catch (error) {
    console.error("Puter AI error:", error);
    throw new Error("AI service is temporarily unavailable. Please try again later.");
  }
}

/**
 * Stream chat with Puter AI
 * 
 * @param messages - Array of chat messages
 * @param onDelta - Callback for each token chunk
 * @param onDone - Callback when stream is complete
 * @param onError - Callback for errors
 * @param options - Chat options (model)
 * 
 * @example
 * await puterChatStream(
 *   [{ role: "user", content: "Tell me a story" }],
 *   (chunk) => console.log(chunk),
 *   () => console.log("Done"),
 *   (error) => console.error(error)
 * );
 */
export async function puterChatStream(
  messages: ChatMessage[],
  onDelta: (deltaText: string) => void,
  onDone: () => void,
  onError: (error: Error) => void,
  options: ChatOptions = {}
): Promise<void> {
  if (!isPuterAvailable()) {
    onError(new Error("AI service is temporarily unavailable. Please try again later."));
    return;
  }

  try {
    const response = await window.AI!.chat.completions.create({
      model: options.model || "gpt-4o-mini",
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
    });

    // Handle streaming response
    for await (const chunk of response) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        onDelta(content);
      }
    }

    onDone();
  } catch (error) {
    console.error("Puter AI stream error:", error);
    onError(new Error("AI service is temporarily unavailable. Please try again later."));
  }
}

/**
 * Get available AI models
 */
export function getAvailableModels(): string[] {
  return [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4-turbo",
    "gpt-3.5-turbo",
  ];
}

/**
 * Wait for Puter AI to load
 * 
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * @returns Promise that resolves when Puter is available or rejects on timeout
 */
export function waitForPuter(timeout: number = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isPuterAvailable()) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isPuterAvailable()) {
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error("Puter AI failed to load. Please refresh the page."));
      }
    }, 100);
  });
}
