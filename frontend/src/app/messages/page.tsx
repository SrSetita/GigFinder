'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Send, Wifi, WifiOff } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { connectSocket, disconnectSocket } from '@/lib/socket'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return isToday
    ? d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeConvRef = useRef<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/auth/login'); return }

    api.get<any[]>('/api/messages/conversations')
      .then(setConversations)
      .finally(() => setLoading(false))

    const socket = connectSocket()
    if (!socket) return

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('new_message', (msg: any) => {
      if (msg.conversationId === activeConvRef.current) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
      setConversations(prev => prev.map(c =>
        c.id === msg.conversationId
          ? { ...c, messages: [msg], updatedAt: msg.createdAt }
          : c
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
    })

    socket.on('messages_read', ({ conversationId }: { conversationId: string; readAt: string }) => {
      if (conversationId === activeConvRef.current) {
        setMessages(prev => prev.map(m =>
          m.senderId === user.id && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m
        ))
      }
    })

    return () => {
      socket.off('new_message')
      socket.off('messages_read')
      socket.off('connect')
      socket.off('disconnect')
      disconnectSocket()
    }
  }, [user, authLoading])

  const openConversation = async (conv: any) => {
    const socket = connectSocket()
    if (activeConvRef.current) socket?.emit('leave_conversation', activeConvRef.current)
    setActiveConv(conv)
    activeConvRef.current = conv.id
    socket?.emit('join_conversation', conv.id)
    const data = await api.get<any>(`/api/messages/conversations/${conv.id}`)
    setMessages(data.messages)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv || sending) return
    const recipient = activeConv.participants.find((p: any) => p.userId !== user?.id)
    if (!recipient) return
    setSending(true)
    try {
      const msg = await api.post<any>('/api/messages/send', {
        recipientId: recipient.userId,
        content: newMessage.trim(),
      })
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
      setNewMessage('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      setConversations(prev => prev.map(c =>
        c.id === activeConv.id ? { ...c, messages: [msg], updatedAt: msg.createdAt } : c
      ))
    } finally {
      setSending(false)
    }
  }

  const getOtherParticipant = (conv: any) =>
    conv.participants?.find((p: any) => p.userId !== user?.id)

  if (authLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-65px)] items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-65px)] border-t border-white/[0.06]">
      {/* Sidebar */}
      <aside className="w-full max-w-xs border-r border-white/[0.06] flex flex-col backdrop-blur-md bg-white/[0.02]">
        <div className="px-4 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h1 className="font-bold text-lg flex items-center gap-2">
            <MessageCircle size={18} className="text-[var(--accent)]" />
            Mensajes
          </h1>
          <span title={connected ? 'Conectado' : 'Desconectado'}>
            {connected
              ? <Wifi size={14} className="text-green-400" />
              : <WifiOff size={14} className="text-gray-600" />
            }
          </span>
        </div>

        {conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 text-center">
            <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mb-3">
              <MessageCircle size={20} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium">Sin conversaciones</p>
            <p className="text-xs mt-1 text-gray-600">Contacta desde el perfil de alguien</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => {
              const other = getOtherParticipant(conv)
              const lastMsg = conv.messages?.[0]
              const isActive = activeConv?.id === conv.id

              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] ${
                    isActive ? 'bg-[var(--accent)]/10 border-l-2 border-l-[var(--accent)]' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {other?.user?.profile?.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-sm truncate">
                        {other?.user?.profile?.displayName || 'Usuario'}
                      </span>
                      {lastMsg && (
                        <span className="text-xs text-gray-500 shrink-0 ml-2" suppressHydrationWarning>
                          {formatTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg.content}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
              <MessageCircle size={26} className="text-gray-600" />
            </div>
            <p className="font-medium">Selecciona una conversación</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-white/[0.06] backdrop-blur-md bg-white/[0.02] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-sm font-bold text-white">
                {getOtherParticipant(activeConv)?.user?.profile?.displayName?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="font-semibold">
                {getOtherParticipant(activeConv)?.user?.profile?.displayName || 'Usuario'}
              </span>
              {connected && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  En línea
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                      isMe
                        ? 'bg-[var(--accent)] text-white rounded-br-sm'
                        : 'glass rounded-bl-sm'
                    }`}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-purple-200' : 'text-gray-500'}`} suppressHydrationWarning>
                        {formatTime(msg.createdAt)}
                        {msg.readAt && isMe && ' · Leído'}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="px-6 py-4 border-t border-white/[0.06] backdrop-blur-md bg-white/[0.02] flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/50 transition-colors placeholder:text-gray-600"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-1.5"
              >
                <Send size={14} />
                {sending ? '...' : 'Enviar'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
