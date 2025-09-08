"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  X,
  Send,
  RefreshCcw,
  Image as ImageIcon,
  Copy,
  Check,
  Pencil,
  Square, // ⬛ stop
  Mic,    // 🎤 (optional, just for the look)
} from "lucide-react";

type MsgKind = "text" | "quick-reply" | "image";

interface Message {
  id: string;
  isUser: boolean;
  timestamp: Date;
  type?: MsgKind;
  text?: string;
  imageUrl?: string;
  caption?: string;
  edited?: boolean;
}

export function Chatbot() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      isUser: false,
      timestamp: new Date(),
      type: "text",
      text:
        "Hello! 👋 Welcome to FabricPro. I'm here to help you with your fabric requirements. How can I assist you today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  // sending vs generating:
  const [isLoading, setIsLoading] = useState(false);     // network in-flight
  const [isGenerating, setIsGenerating] = useState(false); // assistant composing

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null); // <- used for Stop

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

  /** Turn any string with escaped newlines into human text */
  function normalizeText(s: string | undefined | null): string {
    if (!s) return "";
    try {
      const maybe = JSON.parse(s);
      if (typeof maybe === "string") s = maybe;
    } catch {}
    return String(s).replace(/\r\n/g, "\n").replace(/\\n/g, "\n").trim();
  }

  /** Extract first image URL if present from several possible response shapes */
  function extractImage(payload: any): { url?: string; caption?: string } {
    if (!payload) return {};
    if (typeof payload.image === "string") {
      return { url: payload.image, caption: normalizeText(payload.caption) };
    }
    const blocks = payload?.content;
    if (Array.isArray(blocks)) {
      const imgBlock = blocks.find((b: any) => b?.type === "image_url");
      const txtBlock = blocks.find((b: any) => b?.type === "text");
      const url =
        imgBlock?.image_url?.url ||
        imgBlock?.image_url ||
        imgBlock?.url ||
        undefined;
      const caption = normalizeText(txtBlock?.text);
      if (url) return { url, caption };
    }
    const att = Array.isArray(payload.attachments)
      ? payload.attachments.find((a: any) => a?.type?.includes("image"))
      : undefined;
    if (att?.url) return { url: att.url, caption: normalizeText(att.caption) };
    return {};
  }

  /** Extract best text from many possible API shapes */
  function extractText(payload: any, fallbackText: string): string {
    const candidates: any[] = [
      payload?.reply,
      payload?.response,
      payload?.message,
      payload?.text,
      payload?.content,
      payload?.answer,
      payload?.output,
      payload?.result,
      payload?.choices?.[0]?.message?.content,
      payload?.choices?.[0]?.delta?.content,
    ].filter(Boolean);
    if (candidates.length) return normalizeText(String(candidates[0]));
    return normalizeText(fallbackText);
  }

  /** Copy helpers */
  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {}
  }

  function messagePlainText(m: Message): string {
    if (m.type === "image") {
      const cap = m.caption ? `\n${m.caption}` : "";
      return `${m.imageUrl ?? ""}${cap}`.trim();
    }
    return m.text ?? "";
  }

  /** ----- Stop generating (AbortController) ----- */
  function stopGenerating() {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsGenerating(false);
    setIsTyping(false);
    setIsLoading(false);
  }

  /** Network */
  const sendToN8n = async (userMessage: string) => {
    try {
      setIsLoading(true);
      setIsGenerating(true);

      // fresh controller for each send
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      if (!N8N_WEBHOOK_URL) {
        return {
          ok: true,
          kind: "text" as MsgKind,
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
        signal: abortRef.current.signal,
      });

      const raw = await res.text();
      let payload: any = null;
      try {
        payload = JSON.parse(raw);
      } catch {}

      const { url: imageUrl, caption } = extractImage(payload);
      if (imageUrl) {
        return { ok: true, kind: "image" as MsgKind, imageUrl, caption };
      }
      const msg = extractText(payload ?? {}, raw || "");
      return { ok: true, kind: "text" as MsgKind, message: msg || "…" };
    } catch (e: any) {
      if (e?.name === "AbortError") {
        return { ok: false, kind: "text" as MsgKind, message: "Generation stopped." };
      }
      console.error(e);
      return {
        ok: false,
        kind: "text" as MsgKind,
        message:
          "Sorry, I'm having trouble connecting right now. Please try again later.",
      };
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  /** Quick reply */
  const handleQuickReply = async (action: string, text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      isUser: true,
      timestamp: new Date(),
      type: "quick-reply",
      text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setShowQuickReplies(false);
    setIsTyping(true);

    const resp = await sendToN8n(`Action: ${action} - ${text}`);

    if (resp.kind === "image" && "imageUrl" in resp) {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        timestamp: new Date(),
        type: "image",
        imageUrl: resp.imageUrl!,
        caption: resp.caption,
      };
      setMessages((prev) => [...prev, botMsg]);
    } else {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        timestamp: new Date(),
        type: "text",
        text: (resp as any).message,
      };
      setMessages((prev) => [...prev, botMsg]);
    }
    setIsTyping(false);
  };

  /** Edit an existing user message */
  const handleEdit = (msg: Message) => {
    if (!msg.isUser) return;
    setEditingId(msg.id);
    setInputMessage(msg.text ?? "");
    inputRef.current?.focus();
  };

  /** Send / Save (supports edit mode) */
  const handleSendMessage = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;

    // If editing a previous user message
    if (editingId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingId ? { ...m, text: trimmed, edited: true } : m
        )
      );

      setIsTyping(true);
      setShowQuickReplies(false);
      setInputMessage("");

      const resp = await sendToN8n(trimmed);

      if (resp.kind === "image" && "imageUrl" in resp) {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          isUser: false,
          timestamp: new Date(),
          type: "image",
          imageUrl: resp.imageUrl!,
          caption: resp.caption,
        };
        setMessages((p) => [...p, botMsg]);
      } else {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          isUser: false,
          timestamp: new Date(),
          type: "text",
          text: (resp as any).message,
        };
        setMessages((p) => [...p, botMsg]);
      }

      setIsTyping(false);
      setEditingId(null);
      return;
    }

    // Normal (new) user message
    const userMessage: Message = {
      id: Date.now().toString(),
      isUser: true,
      timestamp: new Date(),
      type: "text",
      text: trimmed,
    };
    setMessages((p) => [...p, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    setShowQuickReplies(false);

    const resp = await sendToN8n(trimmed);

    if (resp.kind === "image" && "imageUrl" in resp) {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        timestamp: new Date(),
        type: "image",
        imageUrl: resp.imageUrl!,
        caption: resp.caption,
      };
      setMessages((p) => [...p, botMsg]);
    } else {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        timestamp: new Date(),
        type: "text",
        text: (resp as any).message,
      };
      setMessages((p) => [...p, botMsg]);
    }
    setIsTyping(false);
  };

  const resetChat = () => {
    if (isGenerating) stopGenerating();
    setMessages([
      {
        id: "1",
        isUser: false,
        timestamp: new Date(),
        type: "text",
        text:
          "Hello! 👋 Welcome to FabricPro. I'm here to help you with your fabric requirements. How can I assist you today?",
      },
    ]);
    setShowQuickReplies(true);
    setEditingId(null);
    setInputMessage("");
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
            "left-[max(env(safe-area-inset-left),16px)] bottom-[max(env(safe-area-inset-bottom),16px)]",
            "w-14 h-14 md:w-16 md:h-16",
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

          {/* Panel */}
          <div
            className={[
              "fixed z-[57] bg-white border border-gray-200 shadow-2xl",
              "inset-x-2 bottom-[max(env(safe-area-inset-bottom),12px)] rounded-2xl h-[65dvh]",
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
                    <p className="text-[11px] md:text-xs text-blue-100">
                      {isGenerating ? "Generating…" : "Online • Ready to help"}
                    </p>
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
            <div className="h-[calc(65dvh-160px)] md:h-[calc(520px-160px)] overflow-y-auto p-3 md:p-4 space-y-3">
              {messages.map((m) => {
                const isUser = m.isUser;
                const base =
                  "relative max-w-[80%] md:max-w-[75%] px-3 py-2 rounded-lg text-sm";
                const mine = isUser
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-800 rounded-bl-none";

                return (
                  <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={[base, mine].join(" ")}>
                      {/* Content */}
                      {m.type === "image" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs opacity-80">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Image</span>
                          </div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.imageUrl}
                            alt={m.caption || "Image"}
                            className="rounded-md max-h-64 object-contain"
                          />
                          {m.caption && (
                            <p className="text-xs opacity-80 whitespace-pre-line">{m.caption}</p>
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="whitespace-pre-line">
                            {m.text}
                            {m.edited && (
                              <span className="ml-2 text-[10px] opacity-75">(edited)</span>
                            )}
                          </p>
                        </>
                      )}

                      {/* Timestamp */}
                      <p className="text-[10px] opacity-70 mt-1">
                        {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>

                      {/* Actions */}
                      <div
                        className={[
                          "absolute -bottom-6",
                          isUser ? "right-0" : "left-0",
                          "flex items-center gap-2 text-[11px]",
                        ].join(" ")}
                      >
                        {/* Copy */}
                        <button
                          onClick={() => copyToClipboard(messagePlainText(m), m.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-200/70 hover:bg-gray-300 transition"
                          title="Copy"
                          aria-label="Copy message"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </>
                          )}
                        </button>

                        {/* Edit only for user messages (text) */}
                        {isUser && m.type !== "image" && (
                          <button
                            onClick={() => handleEdit(m)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-200/70 hover:bg-gray-300 transition"
                            title="Edit message"
                            aria-label="Edit message"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* typing indicator while generating */}
              {(isTyping || isGenerating) && (
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

            {/* Editing banner */}
            {editingId && (
              <div className="px-3 md:px-4 py-2 bg-yellow-50 border-t border-b border-yellow-200 text-[12px] text-yellow-900">
                Editing your previous message. Make changes and press Send to update & get a new reply.
                <button
                  onClick={() => {
                    setEditingId(null);
                    setInputMessage("");
                  }}
                  className="ml-2 underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Input bar with mic and stop as in screenshot */}
            <div className="p-3 md:p-4 border-t border-gray-200">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
                {/* plus/mic area (visual only) */}
                <button
                  type="button"
                  className="shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                  title="Voice (coming soon)"
                  aria-label="Voice"
                >
                  <Mic className="w-4 h-4 text-gray-700" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      isGenerating ? stopGenerating() : handleSendMessage();
                    }
                  }}
                  placeholder={editingId ? "Edit your message…" : "Ask anything"}
                  className="flex-1 bg-transparent outline-none text-sm px-2"
                  disabled={isLoading || isGenerating}
                />

                {/* right circular action: Stop when generating, otherwise Send */}
                {isGenerating ? (
                  <button
                    onClick={stopGenerating}
                    className="shrink-0 w-10 h-10 rounded-full bg-gray-300 hover:bg-gray-400 transition flex items-center justify-center"
                    title="Stop generating"
                    aria-label="Stop generating"
                  >
                    <Square className="w-4 h-4 text-gray-800" />
                  </button>
                ) : (
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                    title="Send"
                    aria-label="Send"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-white" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
