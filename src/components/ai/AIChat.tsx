import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Sparkles, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/csv-export-client";
import { puterChatStream, waitForPuter, isPuterAvailable } from "@/lib/ai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [puterReady, setPuterReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Wait for Puter AI to load
  useEffect(() => {
    waitForPuter()
      .then(() => {
        setPuterReady(true);
        console.log("Puter AI is ready");
      })
      .catch((error) => {
        console.error("Puter AI failed to load:", error);
        toast({
          title: "AI Service Unavailable",
          description: "Please refresh the page to use AI features",
          variant: "destructive",
        });
      });
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Check if Puter is available
    if (!isPuterAvailable()) {
      toast({
        title: "AI Service Unavailable",
        description: "Please refresh the page to use AI features",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = { role: "user", content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to use the AI assistant",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Fetch RAG context from backend
      const { data: contextData, error: contextError } = await supabase.functions.invoke(
        'rag-context',
        {
          body: {
            query: currentInput,
            scope: "school",
          },
        }
      );

      if (contextError) {
        throw contextError;
      }

      const { systemPrompt } = contextData;

      // Add initial assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let assistantContent = "";

      // Stream response from Puter AI
      await puterChatStream(
        [
          { role: "system", content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: currentInput },
        ],
        (deltaText) => {
          assistantContent += deltaText;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "assistant") {
              lastMessage.content = assistantContent;
            }
            return newMessages;
          });
        },
        () => {
          setIsLoading(false);
        },
        (error) => {
          console.error("Puter AI error:", error);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          setMessages(prev => prev.slice(0, -1));
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error("AI chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">SchoolCare AI Assistant</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const now = new Date();
            try {
              await exportToCSV({
                scope: 'month_summary',
                filters: {
                  month: now.getMonth() + 1,
                  year: now.getFullYear(),
                },
              });
              toast({
                title: "Success",
                description: "Monthly summary exported successfully",
              });
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to export monthly summary",
                variant: "destructive",
              });
            }
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/20" />
            <p className="text-lg font-medium mb-2">Welcome to SchoolCare AI</p>
            <p className="text-sm">Ask me anything about students, classes, tests, or school management!</p>
          </div>
        )}
        
        <div className="space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading || !puterReady}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !puterReady}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
