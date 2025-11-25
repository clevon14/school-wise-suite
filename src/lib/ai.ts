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
 * @param systemPrompt - System prompt for the AI
 * @param userPrompt - User's message
 * @param options - Chat options (model)
 * @returns Promise with AI response text
 * 
 * @example
 * const response = await puterChat(
 *   "You are a helpful assistant",
 *   "Hello!"
 * );
 */
export async function puterChat(
  systemPrompt: string,
  userPrompt: string,
  options: ChatOptions = {}
): Promise<string> {
  if (!isPuterAvailable()) {
    return "AI service is temporarily unavailable. Please try again later.";
  }

  try {
    const response = await window.AI!.chat.completions.create({
      model: options.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Puter AI error:", error);
    return "AI service is temporarily unavailable. Please try again later.";
  }
}

/**
 * Chat with conversation history using Puter AI
 * 
 * @param messages - Array of chat messages including system, user, and assistant messages
 * @param options - Chat options (model)
 * @returns Promise with AI response text
 * 
 * @example
 * const response = await puterChatWithHistory([
 *   { role: "system", content: "You are a helpful assistant" },
 *   { role: "user", content: "Hello!" },
 *   { role: "assistant", content: "Hi there!" },
 *   { role: "user", content: "How are you?" }
 * ]);
 */
export async function puterChatWithHistory(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  if (!isPuterAvailable()) {
    return "AI service is temporarily unavailable. Please try again later.";
  }

  try {
    const response = await window.AI!.chat.completions.create({
      model: options.model || "gpt-4o-mini",
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Puter AI error:", error);
    return "AI service is temporarily unavailable. Please try again later.";
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
