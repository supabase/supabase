import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type LangCode, LANGUAGES, t } from 'lib/i18n/translations'
import type { NextPageWithLayout } from 'types'

// ─── TI-LEX-AL AI RESPONSES ──────────────────────────────
const TILEXAL_RESPONSES: Record<string, string[]> = {
  fr: [
    'Hmm, bonne question! Laisse-moi reflechir... Je pense que la meilleure approche serait de commencer par les bases et construire a partir de la.',
    'Ah, je connais ca! Dans le monde de MARCEAU, tout est possible. Voici ce que je te suggere...',
    'Ti-Lex-Al a analyse ta demande. Resultat: 99.7% de chances de succes si tu suis mes conseils!',
    'Interessant... Mon algorithme me dit que tu es sur la bonne piste. Continue comme ca!',
    'J\'ai fouille dans ma base de donnees et voici ce que j\'ai trouve pour toi...',
    'Salut! En tant qu\'IA du monde MARCEAU, je peux te confirmer que c\'est faisable. Voici le plan...',
    'Mes circuits neuraux s\'activent! Je detecte une opportunite incroyable dans ta question.',
    'Analyse complete. Ti-Lex-Al recommande: fonce, mais avec strategie!',
  ],
  en: [
    'Hmm, great question! Let me think... I believe the best approach would be to start with the basics and build from there.',
    'Ah, I know this one! In the world of MARCEAU, everything is possible. Here\'s what I suggest...',
    'Ti-Lex-Al has analyzed your request. Result: 99.7% chance of success if you follow my advice!',
    'Interesting... My algorithm tells me you\'re on the right track. Keep going!',
    'I\'ve searched through my database and here\'s what I found for you...',
    'Hi! As the AI of the MARCEAU world, I can confirm this is doable. Here\'s the plan...',
    'My neural circuits are firing! I detect an incredible opportunity in your question.',
    'Analysis complete. Ti-Lex-Al recommends: go for it, but with strategy!',
  ],
}

// ─── QUILL PEN ANIMATION ─────────────────────────────────
function QuillAnimation({ onComplete }: { onComplete: () => void }) {
  const [inkDrops, setInkDrops] = useState<{ x: number; y: number; id: number }[]>([])
  const [penPos, setPenPos] = useState({ x: 200, y: 300 })
  const [writtenText, setWrittenText] = useState('')
  const fullText = 'Ti-Lex-Al v3.0'
  const [phase, setPhase] = useState<'writing' | 'reveal'>('writing')

  useEffect(() => {
    // Pen writing animation
    let charIndex = 0
    const writeInterval = setInterval(() => {
      if (charIndex < fullText.length) {
        setWrittenText(fullText.slice(0, charIndex + 1))
        setPenPos({
          x: 200 + charIndex * 28,
          y: 295 + Math.sin(charIndex * 0.8) * 5,
        })
        // Ink drops
        if (Math.random() > 0.5) {
          setInkDrops((prev) => [
            ...prev,
            { x: 200 + charIndex * 28 + Math.random() * 10, y: 310 + Math.random() * 20, id: Date.now() },
          ])
        }
        charIndex++
      } else {
        clearInterval(writeInterval)
        setTimeout(() => setPhase('reveal'), 800)
        setTimeout(onComplete, 2500)
      }
    }, 150)

    return () => clearInterval(writeInterval)
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 bg-black flex items-center justify-center z-50"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <svg viewBox="0 0 700 500" className="w-[700px] h-[500px]">
        {/* Parchment background */}
        <rect x="50" y="100" width="600" height="300" rx="5" fill="#0d0800" stroke="#ff660033" strokeWidth="1" />

        {/* Ink drops */}
        {inkDrops.map((drop) => (
          <motion.circle
            key={drop.id}
            cx={drop.x}
            cy={drop.y}
            r="2"
            fill="#ff8c0044"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.4, scale: 1 }}
          />
        ))}

        {/* Written text */}
        <text
          x="200"
          y="310"
          fill="#ff8c00"
          fontSize="32"
          fontFamily="'Georgia', serif"
          fontWeight="bold"
          style={{ textShadow: '0 0 10px #ff6600' } as any}
        >
          {writtenText}
        </text>

        {/* Quill pen */}
        <motion.g
          animate={{ x: penPos.x - 200, y: penPos.y - 300 }}
          transition={{ duration: 0.1 }}
        >
          {/* Feather */}
          <path
            d="M200,290 Q220,250 210,200 Q205,240 195,270 Q190,250 185,200 Q190,245 195,275 Z"
            fill="#8B4513"
            stroke="#DAA520"
            strokeWidth="0.5"
            opacity="0.9"
          />
          {/* Feather detail lines */}
          <path d="M200,270 Q210,240 208,210" fill="none" stroke="#DAA52066" strokeWidth="0.5" />
          <path d="M198,275 Q192,245 190,215" fill="none" stroke="#DAA52066" strokeWidth="0.5" />
          {/* Nib */}
          <path d="M198,288 L200,298 L202,288" fill="#333" stroke="#666" strokeWidth="0.5" />
          {/* Ink tip */}
          <circle cx="200" cy="297" r="1.5" fill="#ff8c00" />
        </motion.g>

        {/* Subtitle */}
        {phase === 'reveal' && (
          <motion.text
            x="350"
            y="370"
            fill="#ff660088"
            fontSize="14"
            fontFamily="monospace"
            textAnchor="middle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Derniere version - Powered by MARCEAU
          </motion.text>
        )}
      </svg>

      {/* Floating particles */}
      {Array.from({ length: 15 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{ background: '#ff8c00' }}
          initial={{
            x: Math.random() * 700 - 350,
            y: Math.random() * 500 - 250,
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * -200 - 50],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
        }}
      />
    </motion.div>
  )
}

// ─── CHAT MESSAGE ─────────────────────────────────────────
interface ChatMessage {
  id: number
  role: 'user' | 'tilexal'
  text: string
  timestamp: Date
}

// ─── MAIN TI-LEX-AL PAGE ─────────────────────────────────
const TiLexAlPage: NextPageWithLayout = () => {
  const router = useRouter()
  const lang = (router.query.lang as LangCode) || 'fr'
  const [showQuill, setShowQuill] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentLang, setCurrentLang] = useState<LangCode>(lang)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  // Add greeting after quill animation (only once)
  useEffect(() => {
    if (!showQuill) {
      const greeting: ChatMessage = {
        id: Date.now(),
        role: 'tilexal',
        text: t(currentLang, 'tilexalGreeting'),
        timestamp: new Date(),
      }
      setMessages((prev) => (prev.length === 0 ? [greeting] : prev))
    }
  }, [showQuill])

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  // Send message
  const sendMessage = useCallback(() => {
    if (!input.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: input.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI response with typing effect
    const responses = TILEXAL_RESPONSES[currentLang] || TILEXAL_RESPONSES.en
    const responseText = responses[Math.floor(Math.random() * responses.length)]

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'tilexal',
        text: responseText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
    }, 1500 + Math.random() * 2000)
  }, [input, currentLang])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleQuillComplete = useCallback(() => {
    setShowQuill(false)
  }, [])

  return (
    <>
      <Head>
        <title>MARCEAU - {t(currentLang, 'tilexal')}</title>
      </Head>

      {/* Quill pen intro animation */}
      <AnimatePresence>
        {showQuill && <QuillAnimation onComplete={handleQuillComplete} />}
      </AnimatePresence>

      {/* Main chat interface */}
      <AnimatePresence>
        {!showQuill && (
          <motion.div
            className="fixed inset-0 bg-black flex flex-col"
            style={{ fontFamily: "'Courier New', monospace" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* ─── HEADER ─────────────────────────────── */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: '#ff660033', background: 'rgba(0,0,0,0.95)' }}
            >
              <div className="flex items-center gap-4">
                <Link href={`/world?lang=${currentLang}`} passHref legacyBehavior>
                  <a style={{ color: '#ff8c00' }} className="text-sm">
                    ← {t(currentLang, 'dashboard')}
                  </a>
                </Link>
                <div className="flex items-center gap-3">
                  {/* Ti-Lex-Al avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{
                      background: 'linear-gradient(135deg, #ff8c00, #ff4500)',
                      boxShadow: '0 0 15px rgba(255,140,0,0.5)',
                    }}
                  >
                    🪶
                  </div>
                  <div>
                    <h1 className="text-lg font-bold" style={{ color: '#ff8c00', textShadow: '0 0 10px #ff6600' }}>
                      Ti-Lex-Al
                    </h1>
                    <p className="text-xs" style={{ color: '#ff660088' }}>
                      v3.0 - Derniere version
                    </p>
                  </div>
                </div>
              </div>

              {/* Status + Language */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#00ff00' }}
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-xs" style={{ color: '#00ff0088' }}>Online</span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className="text-xs px-2 py-1 border rounded"
                    style={{ borderColor: '#ff6600', color: '#ff8c00' }}
                  >
                    🌐 {LANGUAGES[currentLang]}
                  </button>
                  {showLangMenu && (
                    <div
                      className="absolute right-0 mt-1 w-40 rounded border z-50 max-h-60 overflow-y-auto"
                      style={{ borderColor: '#ff6600', background: '#111' }}
                    >
                      {(Object.entries(LANGUAGES) as [LangCode, string][]).map(([code, name]) => (
                        <button
                          key={code}
                          className="block w-full text-left px-3 py-1 text-xs"
                          style={{ color: currentLang === code ? '#ff8c00' : '#666' }}
                          onClick={() => { setCurrentLang(code); setShowLangMenu(false) }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─── CHAT MESSAGES ───────────────────────── */}
            <div
              ref={chatRef}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {msg.role === 'tilexal' && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #ff8c00, #ff4500)',
                        fontSize: '14px',
                      }}
                    >
                      🪶
                    </div>
                  )}
                  <div
                    className="max-w-[70%] px-4 py-3 rounded-xl text-sm"
                    style={{
                      background:
                        msg.role === 'user'
                          ? 'rgba(255,100,0,0.2)'
                          : 'rgba(255,100,0,0.08)',
                      border: `1px solid ${msg.role === 'user' ? '#ff660066' : '#ff660033'}`,
                      color: '#ff8c00',
                    }}
                  >
                    {msg.text}
                    <div className="text-right mt-1">
                      <span className="text-[10px]" style={{ color: '#ff660044' }}>
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #ff8c00, #ff4500)',
                      fontSize: '14px',
                    }}
                  >
                    🪶
                  </div>
                  <div
                    className="px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(255,100,0,0.08)',
                      border: '1px solid #ff660033',
                      color: '#ff660088',
                    }}
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{ background: '#ff8c00' }}
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                    <span className="text-xs mt-1 block">{t(currentLang, 'thinking')}</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ─── INPUT BAR ──────────────────────────── */}
            <div
              className="px-6 py-4 border-t"
              style={{ borderColor: '#ff660033', background: 'rgba(0,0,0,0.95)' }}
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t(currentLang, 'typeMessage')}
                  className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: 'rgba(255,100,0,0.08)',
                    border: '1px solid #ff660044',
                    color: '#ff8c00',
                  }}
                />
                <motion.button
                  className="px-6 py-3 rounded-xl font-bold text-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,100,0,0.3), rgba(255,60,0,0.15))',
                    border: '1px solid #ff6600',
                    color: '#ff8c00',
                    textShadow: '0 0 8px #ff6600',
                  }}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,100,0,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                >
                  🪶 Send
                </motion.button>
              </div>
            </div>

            {/* Scanlines */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 6px)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

TiLexAlPage.getLayout = (page) => page

export default TiLexAlPage
