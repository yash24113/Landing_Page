"use client"

import { useState, useEffect, useRef } from 'react'
import { Bot, X, Send, RefreshCcw } from 'lucide-react'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  type?: 'text' | 'quick-reply'
}

interface QuickReply {
  id: string
  text: string
  action: string
}

interface N8nResponse {
  success: boolean
  message: string
  data?: any
}

export function Chatbot() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isAtProducts, setIsAtProducts] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text:
        "Hello! 👋 Welcome to FabricPro. I'm here to help you with your fabric requirements. How can I assist you today?",
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // open/close/toggle via custom events
  useEffect(() => {
    const handleOpen = () => {
      setIsChatOpen(true)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        inputRef.current?.focus()
      }, 50)
    }
    const handleClose = () => setIsChatOpen(false)
    const handleToggle = () => setIsChatOpen(prev => !prev)

    window.addEventListener('chatbot:open', handleOpen)
    window.addEventListener('chatbot:close', handleClose)
    window.addEventListener('chatbot:toggle', handleToggle)

    return () => {
      window.removeEventListener('chatbot:open', handleOpen)
      window.removeEventListener('chatbot:close', handleClose)
      window.removeEventListener('chatbot:toggle', handleToggle)
    }
  }, [])

  const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
  const N8N_API_KEY = process.env.NEXT_PUBLIC_N8N_API_KEY

  const quickReplies: QuickReply[] = [
    { id: '1', text: 'Get Quote', action: 'quote' },
    { id: '2', text: 'Product Catalog', action: 'catalog' },
    { id: '3', text: 'Shipping Info', action: 'shipping' },
    { id: '4', text: 'Contact Sales', action: 'contact' }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // observe products section
  useEffect(() => {
    if (typeof window === 'undefined') return
    const section = document.getElementById('products')
    if (!section) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsAtProducts(entry.isIntersecting && entry.intersectionRatio > 0.2)
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  // send to n8n
  const sendToN8n = async (userMessage: string): Promise<N8nResponse> => {
    try {
      setIsLoading(true)
      if (!N8N_WEBHOOK_URL) {
        return {
          success: true,
          message: 'Thanks for your message! Our assistant will be configured soon.',
          data: null
        }
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (N8N_API_KEY) headers['Authorization'] = `Bearer ${N8N_API_KEY}`

      const response = await fetch(N8N_WEBHOOK_URL as string, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMessage,
          timestamp: new Date().toISOString(),
          sessionId: 'user-session-' + Date.now(),
          context: {
            previousMessages: messages.slice(-5).map(msg => ({
              text: msg.text,
              isUser: msg.isUser
            }))
          }
        })
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const responseText = await response.text()
      if (!responseText || responseText.trim() === '') {
        return {
          success: true,
          message: "Thank you for your message! I'm here to help with your fabric requirements.",
          data: null
        }
      }

      let data: any
      try {
        data = JSON.parse(responseText)
      } catch {
        return {
          success: true,
          message:
            responseText ||
            "Thank you for your message! I'm here to help with your fabric requirements.",
          data: { rawResponse: responseText }
        }
      }

      let responseMessage = ''
      if (data?.response) responseMessage = data.response
      else if (data?.message) responseMessage = data.message
      else if (data?.text) responseMessage = data.text
      else if (data?.output) responseMessage = data.output
      else if (data?.content) responseMessage = data.content
      else if (data?.answer) responseMessage = data.answer
      else if (data?.result) responseMessage = data.result
      else if (typeof data === 'string') responseMessage = data
      else if (data?.[0]?.response) responseMessage = data[0].response
      else if (data?.[0]?.output) responseMessage = data[0].output
      else if (data?.[0]?.text) responseMessage = data[0].text
      else {
        const jsonString = JSON.stringify(data)
        if (
          jsonString.includes('"text"') ||
          jsonString.includes('"response"') ||
          jsonString.includes('"output"')
        ) {
          const extractText = (obj: any): string => {
            if (typeof obj === 'string') return obj
            if (obj?.text) return obj.text
            if (obj?.response) return obj.response
            if (obj?.output) return obj.output
            if (obj?.content) return obj.content
            if (obj?.answer) return obj.answer
            if (obj?.result) return obj.result
            if (Array.isArray(obj) && obj.length > 0) return extractText(obj[0])
            return "Thank you for your message! I'm here to help with your fabric requirements."
          }
          responseMessage = extractText(data)
        } else {
          responseMessage =
            "Thank you for your message! I'm here to help with your fabric requirements."
        }
      }

      return { success: true, message: responseMessage, data }
    } catch (error) {
      console.error('Error sending message to n8n:', error)
      return {
        success: false,
        message:
          "Sorry, I'm having trouble connecting right now. Please try again later.",
        data: null
      }
    } finally {
      setIsLoading(false)
    }
  }

  const quickRepliesData: QuickReply[] = [
    { id: '1', text: 'Get Quote', action: 'quote' },
    { id: '2', text: 'Product Catalog', action: 'catalog' },
    { id: '3', text: 'Shipping Info', action: 'shipping' },
    { id: '4', text: 'Contact Sales', action: 'contact' }
  ]

  const handleQuickReply = async (action: string) => {
    const quickReplyText = quickRepliesData.find(qr => qr.action === action)?.text || ''
    const userMessage: Message = {
      id: Date.now().toString(),
      text: quickReplyText,
      isUser: true,
      timestamp: new Date(),
      type: 'quick-reply'
    }

    setMessages(prev => [...prev, userMessage])
    setShowQuickReplies(false)
    setIsTyping(true)

    const n8nResponse = await sendToN8n(`Action: ${action} - ${quickReplyText}`)

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: n8nResponse.message,
      isUser: false,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, botMessage])
    setIsTyping(false)
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)
    setShowQuickReplies(false)

    const n8nResponse = await sendToN8n(inputMessage)

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: n8nResponse.message,
      isUser: false,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, botMessage])
    setIsTyping(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const resetChat = () => {
    setMessages([
      {
        id: '1',
        text:
          "Hello! 👋 Welcome to FabricPro. I'm here to help you with your fabric requirements. How can I assist you today?",
        isUser: false,
        timestamp: new Date()
      }
    ])
    setShowQuickReplies(true)
  }

  const containerPosition = isAtProducts
    ? 'right-4 top-16 md:right-6 md:top-14'
    : 'right-4 top-1/2 -translate-y-1/2 md:right-6 md:top-1/2'

  return (
    <div className={`fixed z-50 ${containerPosition}`}>
      {/* Hide toggle when open to avoid second X */}
{!isChatOpen && (
  <button
    type="button"
    onClick={() => setIsChatOpen(true)}
    className={`group relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-500 transform hover:scale-110 animate-bounce
                bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white`}
    style={{
      animation: 'rainbow 3s ease-in-out infinite',
      boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
    }}
    /* 👇 Accessible name for the icon-only button */
    aria-label="Open chat assistant"
    title="Open chat assistant"
  >
    <span className="sr-only">Open chat assistant</span>

    <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 group-hover:scale-150 transition-all duration-300" aria-hidden="true" />
    <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" aria-hidden="true" />
    <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" style={{ animationDelay: '0.5s' }} aria-hidden="true" />
    <div className="relative z-10">
      <Bot className="w-7 h-7 animate-bounce" aria-hidden="true" focusable="false" />
    </div>
    <>
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping" aria-hidden="true" />
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full" aria-hidden="true" />
    </>
  </button>
)}


      {/* Chat Window */}
      {isChatOpen && (
        <div
          className={
            `absolute w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-slide-in ` +
            (isAtProducts ? 'right-0 top-16' : 'right-0 top-1/3 transform -translate-y-1/2')
          }
        >
          {/* Header with BOTH buttons: Refresh + Close */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold">FabricPro Assistant</h3>
                  <p className="text-xs text-blue-100">Online • Ready to help</p>
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
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.isUser
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-none px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}

            {showQuickReplies && messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Quick options:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleQuickReply(reply.action)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200 transition-colors"
                    >
                      {reply.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
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
      )}

      {/* existing CSS */}
      <style jsx>{`
        @keyframes rainbow {
          0%, 100% { background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899); }
          25% { background: linear-gradient(45deg, #8b5cf6, #ec4899, #3b82f6); }
          50% { background: linear-gradient(45deg, #ec4899, #3b82f6, #8b5cf6); }
          75% { background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899); }
        }
        @keyframes slide-in {
          0% { transform: translateX(20px) translateY(-50%); opacity: 0; }
          100% { transform: translateX(0px) translateY(-50%); opacity: 1; }
        }
        .animate-bounce { animation: bounce 2s infinite; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        @media (max-width: 768px) {
          .animate-bounce { animation: bounce 1.5s infinite; }
        }
      `}</style>
    </div>
  )
}
