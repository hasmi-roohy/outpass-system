import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { sendChatMessageApi } from '../api/api'

export default function ChatWindow() {
  const { user }     = useAuth()
  const bottomRef    = useRef(null)

  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Hello! 👋 I am your outpass assistant. Ask me anything about outpass rules, status, or procedures.',
      time: new Date()
    }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)

  // Auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg = { from: 'user', text: input.trim(), time: new Date() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await sendChatMessageApi({
        message:   input.trim(),
        studentId: user._id
      })
      setMessages([...newMessages, {
        from: 'bot',
        text: res.data.reply,
        time: new Date()
      }])
    } catch (err) {
      setMessages([...newMessages, {
        from: 'bot',
        text: 'Sorry, I am having trouble connecting. Please try again.',
        time: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour:   '2-digit',
      minute: '2-digit'
    })
  }

  const quickQuestions = [
    'How to apply outpass?',
    'What is my status?',
    'Outpass rules?',
    'How does face scan work?'
  ]

  return (
    <div style={s.wrapper}>

      {/* Toggle button */}
      <button
        style={{
          ...s.toggleBtn,
          background: open
            ? '#fff'
            : 'linear-gradient(135deg, #4f46e5, #7c3aed)'
        }}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <span style={{ color: '#4f46e5', fontSize: '20px' }}>✕</span>
        ) : (
          <>
            <span style={s.toggleIcon}>💬</span>
            <span style={s.toggleLabel}>Assistant</span>
            {messages.length > 1 && (
              <span style={s.unreadDot} />
            )}
          </>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div style={s.chatBox}>

          {/* Header */}
          <div style={s.header}>
            <div style={s.headerLeft}>
              <div style={s.botAvatar}>🤖</div>
              <div>
                <p style={s.botName}>Outpass Assistant</p>
                <p style={s.botStatus}>
                  <span style={s.onlineDot} /> Online
                </p>
              </div>
            </div>
            <button style={s.closeBtn} onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={s.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...s.msgRow,
                  justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {msg.from === 'bot' && (
                  <div style={s.msgAvatar}>🤖</div>
                )}
                <div style={s.msgGroup}>
                  <div style={{
                    ...s.bubble,
                    background:   msg.from === 'user'
                      ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                      : '#f0f0f8',
                    color:        msg.from === 'user' ? '#fff' : '#333',
                    borderRadius: msg.from === 'user'
                      ? '18px 18px 4px 18px'
                      : '18px 18px 18px 4px'
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
                {msg.from === 'user' && (
                  <div style={s.userAvatar}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ ...s.msgRow, justifyContent: 'flex-start' }}>
                <div style={s.msgAvatar}>🤖</div>
                <div style={{ ...s.bubble, background: '#f0f0f8' }}>
                  <div style={s.typingDots}>
                    <span style={s.dot} />
                    <span style={{ ...s.dot, animationDelay: '0.2s' }} />
                    <span style={{ ...s.dot, animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div style={s.quickSection}>
              <p style={s.quickTitle}>Quick questions</p>
              <div style={s.quickBtns}>
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    style={s.quickBtn}
                    onClick={() => {
                      setInput(q)
                      setTimeout(() => {
                        setInput('')
                        const userMsg = { from: 'user', text: q, time: new Date() }
                        const newMsgs = [...messages, userMsg]
                        setMessages(newMsgs)
                        setLoading(true)
                        sendChatMessageApi({ message: q, studentId: user._id })
                          .then(res => {
                            setMessages([...newMsgs, {
                              from: 'bot',
                              text: res.data.reply,
                              time: new Date()
                            }])
                          })
                          .catch(() => {
                            setMessages([...newMsgs, {
                              from: 'bot',
                              text: 'Sorry, try again.',
                              time: new Date()
                            }])
                          })
                          .finally(() => setLoading(false))
                      }, 0)
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={s.inputRow}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder='Ask me anything...'
              style={s.input}
              disabled={loading}
            />
            <button
              style={{
                ...s.sendBtn,
                opacity: (!input.trim() || loading) ? 0.5 : 1,
                cursor:  (!input.trim() || loading) ? 'not-allowed' : 'pointer'
              }}
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              ➤
            </button>
          </div>

        </div>
      )}

      {/* Typing animation keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  )
}

const s = {
  wrapper:      { position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 },

  toggleBtn:    { width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #e0e0f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2px', boxShadow: '0 4px 20px rgba(79,70,229,0.3)', position: 'relative' },
  toggleIcon:   { fontSize: '22px', lineHeight: 1 },
  toggleLabel:  { fontSize: '9px', color: '#fff', fontWeight: '700', letterSpacing: '0.3px' },
  unreadDot:    { position: 'absolute', top: '4px', right: '4px', width: '10px', height: '10px', background: '#dc2626', borderRadius: '50%', border: '2px solid #fff' },

  chatBox:      { position: 'absolute', bottom: '72px', right: '0', width: '340px', background: '#fff', borderRadius: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' },

  header:       { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft:   { display: 'flex', alignItems: 'center', gap: '12px' },
  botAvatar:    { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  botName:      { color: '#fff', fontWeight: '700', fontSize: '14px', margin: '0 0 2px' },
  botStatus:    { color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' },
  onlineDot:    { width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' },
  closeBtn:     { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  messages:     { height: '320px', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },

  msgRow:       { display: 'flex', alignItems: 'flex-end', gap: '8px' },
  msgAvatar:    { width: '28px', height: '28px', borderRadius: '50%', background: '#f0f0f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 },
  userAvatar:   { width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  msgGroup:     { display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '75%' },
  bubble:       { padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word' },
  msgTime:      { fontSize: '10px', color: '#bbb', padding: '0 4px' },

  typingDots:   { display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' },
  dot:          { width: '7px', height: '7px', borderRadius: '50%', background: '#aaa', animation: 'bounce 1s infinite' },

  quickSection: { padding: '12px 16px', borderTop: '1px solid #f0f0f0' },
  quickTitle:   { fontSize: '11px', color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  quickBtns:    { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  quickBtn:     { background: '#f0f0ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: '20px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },

  inputRow:     { padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '8px', alignItems: 'center' },
  input:        { flex: 1, padding: '10px 14px', border: '1.5px solid #e0e0f0', borderRadius: '24px', fontSize: '14px', outline: 'none', background: '#fafafa' },
  sendBtn:      { width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
}