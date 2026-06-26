import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { sendChatMessageApi } from '../api/api'

export default function ChatWindow() {
  const { user } = useAuth()
  const bottomRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Hello. I can help with outpass rules, current status, parent approval, and gate procedures.',
      time: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const addBotMessage = (currentMessages, text) => {
    setMessages([
      ...currentMessages,
      { from: 'bot', text, time: new Date() }
    ])
  }

  const submitMessage = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg = { from: 'user', text: trimmed, time: new Date() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await sendChatMessageApi({
        message: trimmed,
        studentId: user?._id
      })
      addBotMessage(nextMessages, res.data.reply)
    } catch {
      addBotMessage(nextMessages, 'I am having trouble connecting right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date) => new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  const quickQuestions = [
    'How to apply outpass?',
    'What is my status?',
    'Outpass rules?',
    'How does face scan work?'
  ]

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div style={s.wrapper}>
      <button
        style={{
          ...s.toggleBtn,
          background: open ? '#fff' : '#2563eb',
          color: open ? '#2563eb' : '#fff'
        }}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? 'X' : 'AI'}
        {!open && messages.length > 1 && <span style={s.unreadDot} />}
      </button>

      {open && (
        <section style={s.chatBox}>
          <header style={s.header}>
            <div>
              <p style={s.botName}>Outpass Assistant</p>
              <p style={s.botStatus}><span style={s.onlineDot} /> Online</p>
            </div>
            <button style={s.closeBtn} onClick={() => setOpen(false)} aria-label='Close assistant'>X</button>
          </header>

          <div style={s.messages}>
            {messages.map((msg, index) => (
              <div
                key={`${msg.from}-${index}`}
                style={{
                  ...s.msgRow,
                  justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {msg.from === 'bot' && <div style={s.msgAvatar}>AI</div>}
                <div style={s.msgGroup}>
                  <div style={{
                    ...s.bubble,
                    background: msg.from === 'user' ? '#2563eb' : '#f1f5f9',
                    color: msg.from === 'user' ? '#fff' : '#172033',
                    borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{
                    ...s.msgTime,
                    textAlign: msg.from === 'user' ? 'right' : 'left'
                  }}>
                    {formatTime(msg.time)}
                  </span>
                </div>
                {msg.from === 'user' && <div style={s.userAvatar}>{userInitial}</div>}
              </div>
            ))}

            {loading && (
              <div style={{ ...s.msgRow, justifyContent: 'flex-start' }}>
                <div style={s.msgAvatar}>AI</div>
                <div style={{ ...s.bubble, background: '#f1f5f9', color: '#64748b' }}>
                  Typing...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div style={s.quickSection}>
              <p style={s.quickTitle}>Quick questions</p>
              <div style={s.quickBtns}>
                {quickQuestions.map(question => (
                  <button
                    key={question}
                    style={s.quickBtn}
                    onClick={() => submitMessage(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={s.inputRow}>
            <input
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && submitMessage(input)}
              placeholder='Ask about outpasses...'
              style={s.input}
              disabled={loading}
            />
            <button
              style={{
                ...s.sendBtn,
                opacity: (!input.trim() || loading) ? 0.55 : 1
              }}
              onClick={() => submitMessage(input)}
              disabled={!input.trim() || loading}
              aria-label='Send message'
            >
              Send
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

const s = {
  wrapper: { position: 'fixed', right: '22px', bottom: '22px', zIndex: 1000 },
  toggleBtn: {
    width: '58px',
    height: '58px',
    borderRadius: '14px',
    border: '1px solid #dbe4ef',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    boxShadow: '0 16px 34px rgba(37,99,235,0.24)',
    position: 'relative',
    fontSize: '14px',
    fontWeight: 900
  },
  unreadDot: {
    position: 'absolute',
    top: '7px',
    right: '7px',
    width: '10px',
    height: '10px',
    background: '#dc2626',
    borderRadius: '50%',
    border: '2px solid #fff'
  },
  chatBox: {
    position: 'absolute',
    right: 0,
    bottom: '72px',
    width: 'min(370px, calc(100vw - 28px))',
    background: '#fff',
    borderRadius: '10px',
    border: '1px solid #dbe4ef',
    boxShadow: '0 24px 70px rgba(15,23,42,0.18)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '16px 18px',
    background: '#0f172a',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  botName: { margin: '0 0 4px', fontSize: '15px', fontWeight: 900 },
  botStatus: { margin: 0, color: '#cbd5e1', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' },
  onlineDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' },
  closeBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.16)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 900
  },
  messages: {
    height: '330px',
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: '#fbfdff'
  },
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: '8px' },
  msgAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: '#e0edff',
    color: '#2563eb',
    display: 'grid',
    placeItems: 'center',
    fontSize: '10px',
    fontWeight: 900,
    flexShrink: 0
  },
  userAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontSize: '12px',
    fontWeight: 900,
    flexShrink: 0
  },
  msgGroup: { display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '75%' },
  bubble: { padding: '10px 13px', fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word' },
  msgTime: { color: '#94a3b8', fontSize: '10px', padding: '0 4px' },
  quickSection: { padding: '13px 16px', borderTop: '1px solid #e3e8f0', background: '#fff' },
  quickTitle: { margin: '0 0 9px', color: '#64748b', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' },
  quickBtns: { display: 'flex', flexWrap: 'wrap', gap: '7px' },
  quickBtn: {
    border: '1px solid #bfdbfe',
    background: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: '999px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 800
  },
  inputRow: {
    padding: '12px',
    borderTop: '1px solid #e3e8f0',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    background: '#fff'
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: '11px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    outline: 'none',
    fontSize: '14px',
    background: '#fff'
  },
  sendBtn: {
    border: 'none',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#fff',
    minHeight: '40px',
    padding: '0 13px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 900
  }
}
