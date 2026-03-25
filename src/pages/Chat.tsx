import { useState, useRef, useEffect, FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { api } from '../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolStep {
  toolId: string
  name: string
  input?: any
  result?: string
  status: 'running' | 'done'
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolSteps?: ToolStep[]
}

interface Session {
  id: string
  title: string
  model_tier: string
  sdk_session_id?: string
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------

function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const code = String(children).replace(/\n$/, '')
          if (match) {
            return (
              <div className="relative group">
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs bg-[#2e303a] text-gray-400 hover:text-white px-2 py-1 rounded transition-opacity"
                >
                  Copy
                </button>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '0.8rem' }}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            )
          }
          return (
            <code className="bg-[#2e303a] text-orange-300 px-1.5 py-0.5 rounded text-sm" {...props}>
              {children}
            </code>
          )
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full text-sm border border-[#2e303a]">{children}</table>
            </div>
          )
        },
        th({ children }) {
          return <th className="px-3 py-1.5 bg-[#2e303a] text-left text-gray-300 font-medium border border-[#3e404a]">{children}</th>
        },
        td({ children }) {
          return <td className="px-3 py-1.5 border border-[#2e303a] text-gray-300">{children}</td>
        },
        a({ href, children }) {
          return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>
        },
        ul({ children }) {
          return <ul className="list-disc ml-4 space-y-0.5">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal ml-4 space-y-0.5">{children}</ol>
        },
        blockquote({ children }) {
          return <blockquote className="border-l-2 border-blue-500 pl-3 text-gray-400 italic">{children}</blockquote>
        },
        h1({ children }) { return <h1 className="text-lg font-bold mt-3 mb-1">{children}</h1> },
        h2({ children }) { return <h2 className="text-base font-bold mt-3 mb-1">{children}</h2> },
        h3({ children }) { return <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3> },
        p({ children }) { return <p className="my-1">{children}</p> },
        hr() { return <hr className="border-[#2e303a] my-2" /> },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// ---------------------------------------------------------------------------
// Tool step display
// ---------------------------------------------------------------------------

function ToolStepView({ step }: { step: ToolStep }) {
  const [expanded, setExpanded] = useState(false)
  const icon = step.status === 'running' ? '⏳' : '✓'
  const displayName = step.name.replace(/^mcp__alphascout__/, '').replace(/_/g, ' ')

  return (
    <div className="border border-[#2e303a] rounded-lg my-1.5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:bg-[#2e303a]/50 transition-colors"
      >
        <span>{icon}</span>
        <span className="font-mono text-blue-400">{displayName}</span>
        {step.input && (
          <span className="text-gray-500 truncate max-w-[200px]">
            {typeof step.input === 'object' ? JSON.stringify(step.input) : step.input}
          </span>
        )}
        <span className="ml-auto text-gray-600">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="px-3 py-2 bg-[#12131a] text-xs border-t border-[#2e303a] space-y-2">
          {step.input && (
            <div>
              <span className="text-gray-500">Input:</span>
              <pre className="text-gray-400 mt-0.5 overflow-x-auto">{JSON.stringify(step.input, null, 2)}</pre>
            </div>
          )}
          {step.result && (
            <div>
              <span className="text-gray-500">Result:</span>
              <pre className="text-green-400/70 mt-0.5 overflow-x-auto max-h-48 overflow-y-auto">{
                typeof step.result === 'string' && step.result.length > 500
                  ? step.result.slice(0, 500) + '…'
                  : step.result
              }</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chat page
// ---------------------------------------------------------------------------

export default function Chat() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [activeTools, setActiveTools] = useState<ToolStep[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load sessions on mount
  useEffect(() => {
    api.getSessions().then(res => setSessions(res.sessions)).catch(() => {})
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, activeTools])

  // Load session messages
  const loadSession = async (sessionId: string) => {
    setActiveSessionId(sessionId)
    try {
      const res = await api.getSession(sessionId)
      setMessages(
        (res.messages || []).map((m: any) => ({
          role: m.role,
          content: m.content,
        }))
      )
    } catch {
      setMessages([])
    }
  }

  // Create new session
  const newChat = async () => {
    try {
      const session = await api.createSession()
      setSessions(prev => [session, ...prev])
      setActiveSessionId(session.id)
      setMessages([])
    } catch (err: any) {
      console.error('Failed to create session:', err)
    }
  }

  // Delete session
  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (activeSessionId === id) {
        setActiveSessionId(null)
        setMessages([])
      }
    } catch {}
  }

  // Send message with streaming
  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    // Auto-create session if none active
    let sessionId = activeSessionId
    if (!sessionId) {
      try {
        const session = await api.createSession()
        setSessions(prev => [session, ...prev])
        sessionId = session.id
        setActiveSessionId(sessionId)
      } catch (err: any) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }])
        return
      }
    }

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    setStreamingText('')
    setActiveTools([])

    try {
      let fullText = ''
      const tools: ToolStep[] = []

      for await (const event of api.chatStream(sessionId, userMsg)) {
        switch (event.type) {
          case 'text_delta':
            fullText += event.text
            setStreamingText(fullText)
            break

          case 'tool_start':
            tools.push({
              toolId: event.tool_id,
              name: event.name,
              status: 'running',
            })
            setActiveTools([...tools])
            break

          case 'tool_input_done':
            {
              const tool = tools.find(t => t.toolId === event.tool_id)
              if (tool) {
                tool.input = event.input
                setActiveTools([...tools])
              }
            }
            break

          case 'tool_result':
            {
              const tool = tools.find(t => t.toolId === event.tool_id)
              if (tool) {
                tool.result = typeof event.result === 'string' ? event.result : JSON.stringify(event.result)
                tool.status = 'done'
                setActiveTools([...tools])
              }
            }
            break

          case 'done':
            // Update session title in sidebar
            setSessions(prev =>
              prev.map(s =>
                s.id === sessionId ? { ...s, updated_at: new Date().toISOString() } : s
              )
            )
            // Refresh sessions to get auto-title
            api.getSessions().then(res => setSessions(res.sessions)).catch(() => {})
            break

          case 'error':
            fullText += `\n\n**Error:** ${event.message}`
            setStreamingText(fullText)
            break
        }
      }

      // Finalize message
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: fullText, toolSteps: tools.length > 0 ? tools : undefined },
      ])
      setStreamingText('')
      setActiveTools([])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${err.message}` }])
      setStreamingText('')
      setActiveTools([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      {/* Sidebar — sessions */}
      <div className="w-56 flex-shrink-0 flex flex-col bg-[#1a1b23] rounded-lg border border-[#2e303a]">
        <button
          onClick={newChat}
          className="m-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          + New chat
        </button>
        <div className="flex-1 overflow-auto px-2 pb-2 space-y-1">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => loadSession(s.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate flex items-center group transition-colors ${
                activeSessionId === s.id
                  ? 'bg-[#2e303a] text-white'
                  : 'text-gray-400 hover:bg-[#2e303a]/50 hover:text-gray-200'
              }`}
            >
              <span className="truncate flex-1">{s.title}</span>
              <span
                onClick={e => deleteChat(s.id, e)}
                className="ml-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
              >
                ×
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-auto bg-[#1a1b23] rounded-lg border border-[#2e303a] p-4 mb-4 space-y-4">
          {messages.length === 0 && !loading && (
            <p className="text-gray-500 text-sm text-center mt-8">
              Ask AlphaScout anything about the market, your strategies, or run backtests.
            </p>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#2e303a] text-gray-200'
              }`}>
                {msg.role === 'user' ? (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                ) : (
                  <>
                    {msg.toolSteps && msg.toolSteps.length > 0 && (
                      <div className="mb-2">
                        {msg.toolSteps.map(step => (
                          <ToolStepView key={step.toolId} step={step} />
                        ))}
                      </div>
                    )}
                    <div className="prose-invert">
                      <Markdown content={msg.content} />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Streaming state */}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg px-4 py-2.5 text-sm bg-[#2e303a] text-gray-200">
                {activeTools.length > 0 && (
                  <div className="mb-2">
                    {activeTools.map(step => (
                      <ToolStepView key={step.toolId} step={step} />
                    ))}
                  </div>
                )}
                {streamingText ? (
                  <div className="prose-invert">
                    <Markdown content={streamingText} />
                    <span className="inline-block w-1.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-text-bottom" />
                  </div>
                ) : (
                  <span className="text-gray-400">Thinking...</span>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about a ticker, run a backtest, analyze the market..."
            className="flex-1 px-4 py-3 bg-[#1a1b23] border border-[#2e303a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
