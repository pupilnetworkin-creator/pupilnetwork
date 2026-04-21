'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Sparkles, Bot, User, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIChatWindowProps {
  initialQuery?: string
  isPremium: boolean
  usageCount: number
}

// Typewriter hook to simulate streaming
function useTypewriter(text: string, speed = 15) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    let i = 0
    setDisplayedText('')
    
    if (!text) return

    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, i))
      i++
      if (i > text.length) clearInterval(intervalId)
    }, speed)

    return () => clearInterval(intervalId)
  }, [text, speed])

  return displayedText
}

export function AIChatWindow({ initialQuery, isPremium, usageCount }: AIChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi there! 👋 I am your AI Study Buddy. Ask me to explain a concept, solve a math problem, or review notes. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [localUsage, setLocalUsage] = useState(usageCount)
  const [rateLimited, setRateLimited] = useState(!isPremium && usageCount >= 5)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Process initial query from dashboard
  useEffect(() => {
    if (initialQuery && messages.length === 1 && !loading && !rateLimited) {
      setInput(initialQuery)
      // Need a slight delay to allow rendering before submitting
      setTimeout(() => {
         const form = document.getElementById('ai-chat-form') as HTMLFormElement
         if (form) form.requestSubmit()
      }, 100)
    }
  }, [initialQuery, rateLimited])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading || rateLimited) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userMessage,
          history: messages.filter(m => m.role !== 'assistant' || m !== messages[0]) // exclude first intro
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimited(true)
          setLocalUsage(5)
          toast.error(data.message)
        } else {
          toast.error(data.error || 'Failed to get response')
        }
        // Remove the user message if it failed completely
        setMessages(prev => prev.slice(0, -1))
        setInput(userMessage)
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        if (!isPremium && !data.cached) {
          setLocalUsage(prev => Math.min(prev + 1, 5))
          if (localUsage + 1 >= 5) setRateLimited(true)
        }
      }
    } catch (err) {
      toast.error('Network error. Please try again.')
      setMessages(prev => prev.slice(0, -1))
      setInput(userMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
              msg.role === 'assistant' 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>

            {/* Bubble */}
            <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
              <div className={`inline-block p-4 rounded-2xl max-w-full lg:max-w-[85%] text-[15px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-100 text-slate-800 rounded-tr-sm' 
                  : 'bg-white border border-slate-100 rounded-tl-sm'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="prose prose-slate prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props}: any) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <SyntaxHighlighter
                              {...props}
                              children={String(children).replace(/\n$/, '')}
                              style={oneLight}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg border border-slate-200 text-sm"
                            />
                          ) : (
                            <code {...props} className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-sm">
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {/* Only use typewriter for the most recent assistant message if not the very first intro */}
                      {i === messages.length - 1 && i !== 0
                        ? msg.content // For simplicity, we just render it. A full typewriter takes complex state management with Markdown. 
                        : msg.content} 
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0">
               <Bot className="w-5 h-5" />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-100 rounded-tl-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100">
        
        {/* Usage Bar */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {!isPremium ? (
              <div className="flex items-center gap-2 text-xs">
                 <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${rateLimited ? 'bg-red-500' : 'bg-indigo-500'}`} 
                      style={{ width: `${(localUsage / 5) * 100}%` }}
                    />
                 </div>
                 <span className={rateLimited ? 'text-red-600 font-medium' : 'text-slate-500'}>
                   {localUsage}/5 free chats
                 </span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Premium Active: Unlimited
              </span>
            )}
          </div>
          
          {rateLimited && (
            <Link href="/premium" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
              Upgrade to Premium
            </Link>
          )}
        </div>

        {/* Input Form */}
        <form id="ai-chat-form" onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={rateLimited ? "Limit reached. Upgrade for more." : "Ask me anything..."}
              disabled={loading || rateLimited}
              className={`w-full h-12 pl-4 pr-4 bg-white rounded-xl shadow-sm text-base ${rateLimited ? 'border-red-200 bg-red-50/50' : 'border-slate-200 focus-visible:ring-indigo-500'}`}
              autoComplete="off"
            />
          </div>
          <Button 
            type="submit" 
            disabled={!input.trim() || loading || rateLimited}
            className={`w-12 h-12 rounded-xl shrink-0 ${rateLimited ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </form>

        {rateLimited && (
          <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
               You have used your 5 free AI queries for this 5-hour window. They reset every 5 hours, or you can <Link href="/premium" className="font-bold underline">upgrade to Premium</Link> for unlimited access right now.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
