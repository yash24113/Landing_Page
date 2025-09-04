"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, RefreshCcw } from "lucide-react";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: "text" | "quick-reply";
}

export function Chatbot() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text:
        "Hello! 👋 Welcome to FabricPro. I'm here to help you with your fabric requirements. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // toggle via custom events
  useEffect(() => {
    const open = () => {
      setIsChatOpen(true);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 50);
    };
    const close = () => setIsChatOpen(false);
    const toggle = () => setIsChatOpen((p) => !p);
    window.addEventListener("chatbot:open", open);
    window.addEventListener("chatbot:close", close);
    window.addEventListener("chatbot:toggle", toggle);
    return () => {
      window.removeEventListener("chatbot:open", open);
      window.removeEventListener("chatbot:close", close);
      window.removeEventListener("chatbot:toggle", toggle);
    };
  }, []);

  const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
  const N8N_API_KEY = process.env.NEXT_PUBLIC_N8N_API_KEY;

  const quickReplies = [
    { id: "1", text: "Get Quote", action: "quote" },
    { id: "2", text: "Product Catalog", action: "catalog" },
    { id: "3", text: "Shipping Info", action: "shipping" },
    { id: "4", text: "Contact Sales", action: "contact" },
  ] as const;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendToN8n = async (userMessage: string) => {
    try {
      setIsLoading(true);
      if (!N8N_WEBHOOK_URL) {
        return {
          success: true,
          message:
            "Thanks for your message! Our assistant will be configured soon.",
        };
      }
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (N8N_API_KEY) headers["Authorization"] = `Bearer ${N8N_API_KEY}`;

      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMessage,
          timestamp: new Date().toISOString(),
          sessionId: "user-session-" + Date.now(),
          context: {
            previousMessages: messages.slice(-5).map((m) => ({
              text: m.text,
              isUser: m.isUser,
            })),
          },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      let msg =
        text?.trim() ||
        "Thank you for your message! I'm here to help with your fabric requirements.";

      try {
        const data = JSON.parse(text);
        msg =
          data?.response ??
          data?.message ??
          data?.text ??
          data?.output ??
          data?.content ??
          data?.answer ??
          data?.result ??
          msg;
      } catch {
        /* non-JSON is fine */
      }

      return { success: true, message: msg };
    } catch (e) {
      console.error(e);
      return {
        success: false,
        message:
          "Sorry, I'm having trouble connecting right now. Please try again later.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = async (action: string, text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
      type: "quick-reply",
    };
    setMessages((prev) => [...prev, userMessage]);
    setShowQuickReplies(false);
    setIsTyping(true);

    const resp = await sendToN8n(`Action: ${action} - ${text}`);
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: resp.message,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((p) => [...p, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    setShowQuickReplies(false);

    const resp = await sendToN8n(inputMessage);
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: resp.message,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages((p) => [...p, botMessage]);
    setIsTyping(false);
  };

  const resetChat = () => {
    setMessages([
      {
        id: "1",
        text:
          "Hello! 👋 Welcome to FabricPro. I'm here to help you with your fabric requirements. How can I assist you today?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    setShowQuickReplies(true);
  };

  return (
    <>
      {/* FAB — left bottom on mobile, right middle on desktop */}
      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className={[
            "fixed z-[55] text-white rounded-full shadow-2xl transition-transform",
            // mobile: bottom-left (avoid WhatsApp on bottom-right)
            "left-[max(env(safe-area-inset-left),16px)] bottom-[max(env(safe-area-inset-bottom),16px)]",
            "w-14 h-14 md:w-16 md:h-16",
            // desktop: center-right
            "md:left-auto md:right-6 md:top-1/2 md:-translate-y-1/2",
            "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
          ].join(" ")}
          aria-label="Open chat assistant"
          title="Open chat assistant"
        >
          <span className="sr-only">Open chat assistant</span>
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            <Bot className="w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />
          </div>
        </button>
      )}

      {/* CHAT WINDOW */}
      {isChatOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 bg-black/30 md:bg-transparent md:pointer-events-none z-[56]"
            onClick={() => setIsChatOpen(false)}
          />

          {/* Panel: bottom sheet on mobile; floating panel on desktop */}
          <div
            className={[
              "fixed z-[57] bg-white border border-gray-200 shadow-2xl",
              // mobile bottom sheet
              "inset-x-2 bottom-[max(env(safe-area-inset-bottom),12px)] rounded-2xl h-[65dvh]",
              // desktop floating card (right middle)
              "md:inset-auto md:right-6 md:top-1/2 md:-translate-y-1/2 md:w-96 md:h-[520px] md:rounded-lg",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-label="FabricPro Assistant chat window"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold leading-5">FabricPro Assistant</h3>
                    <p className="text-[11px] md:text-xs text-blue-100">Online • Ready to help</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetChat}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 transition"
                    title="Refresh chat"
                    aria-label="Refresh chat"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 transition"
                    title="Close"
                    aria-label="Close chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[calc(65dvh-140px)] md:h-[calc(520px-140px)] overflow-y-auto p-3 md:p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={[
                      "max-w-[80%] md:max-w-[75%] px-3 py-2 rounded-lg text-sm",
                      m.isUser
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800 rounded-bl-none",
                    ].join(" ")}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                    <p className="text-[10px] opacity-70 mt-1">
                      {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-none px-3 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full motion-safe:animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full motion-safe:animate-bounce [animation-delay:.12s]" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full motion-safe:animate-bounce [animation-delay:.24s]" />
                    </div>
                  </div>
                </div>
              )}

              {showQuickReplies && messages.length === 1 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Quick options:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((qr) => (
                      <button
                        key={qr.id}
                        onClick={() => handleQuickReply(qr.action, qr.text)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200 transition-colors"
                      >
                        {qr.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 md:p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message…"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
