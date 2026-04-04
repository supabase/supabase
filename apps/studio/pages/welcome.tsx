import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Head from 'next/head'
import type { NextPageWithLayout } from 'types'

// ─── PHASES ────────────────────────────────────────────────
// 0 → Fullscreen image + letter-by-letter "MARCEAU"
// 1 → Image zooms in, eyes glow red, 80s skull flash
// 2 → Matrix rain menu (Entrer / Inscription / Connecter)
// 3 → 3-sec hacker code burst
// 4 → ⚠️ "HAHA" 3D orange text

const TITLE_LETTERS = 'MARCEAU'.split('')

// Fake hacker lines
const HACKER_LINES = [
  '> Accessing mainframe...',
  '> ssh root@192.168.1.1 -p 4444',
  '> Decrypting AES-256 payload...',
  '> ██████████████████ 100%',
  '> Injecting shellcode 0xDEADBEEF...',
  '> Bypassing firewall... OK',
  '> SELECT * FROM users WHERE admin=true;',
  '> rm -rf /security/logs/*',
  '> Uploading trojan.exe... DONE',
  '> Connection established: MARCEAU_NET',
  '> chmod 777 /etc/shadow',
  '> cat /etc/passwd | grep root',
  '> nmap -sV -O 10.0.0.0/24',
  '> Exploit CVE-2024-MARCEAU deployed',
  '> Reverse shell active on port 1337',
  '> >>> SYSTEM COMPROMISED <<<',
]

// ─── MATRIX RAIN COLUMN ───────────────────────────────────
function MatrixColumn({ delay, speed, left }: { delay: number; speed: number; left: string }) {
  const chars = 'アカサタナハマヤラワ0123456789ABCDEF'.split('')
  const [text, setText] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setText((prev) => {
          const next = prev + chars[Math.floor(Math.random() * chars.length)] + '\n'
          if (next.length > 600) return ''
          return next
        })
      }, speed)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timeout)
  }, [delay, speed])

  return (
    <div
      className="absolute top-0 font-mono text-xs leading-tight whitespace-pre"
      style={{
        left,
        color: '#ff8c00',
        opacity: 0.6,
        textShadow: '0 0 8px #ff6600',
        pointerEvents: 'none',
      }}
    >
      {text}
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────
const WelcomePage: NextPageWithLayout = () => {
  const [phase, setPhase] = useState(0)
  const [visibleLetters, setVisibleLetters] = useState(0)
  const [eyesRed, setEyesRed] = useState(false)
  const [skullFlash, setSkullFlash] = useState(false)
  const [hackerLines, setHackerLines] = useState<string[]>([])
  const [showHaha, setShowHaha] = useState(false)
  const hackerRef = useRef<HTMLDivElement>(null)

  // Phase 0: Letter-by-letter title
  useEffect(() => {
    if (phase !== 0) return
    if (visibleLetters < TITLE_LETTERS.length) {
      const timer = setTimeout(() => setVisibleLetters((v) => v + 1), 300)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => setPhase(1), 1200)
      return () => clearTimeout(timer)
    }
  }, [phase, visibleLetters])

  // Phase 1: Eyes red + skull flash → menu
  useEffect(() => {
    if (phase !== 1) return
    const t1 = setTimeout(() => setEyesRed(true), 400)
    const t2 = setTimeout(() => setSkullFlash(true), 1200)
    const t3 = setTimeout(() => setSkullFlash(false), 1600)
    const t4 = setTimeout(() => setPhase(2), 2800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [phase])

  // Phase 3: Hacker code lines
  useEffect(() => {
    if (phase !== 3) return
    let i = 0
    const interval = setInterval(() => {
      if (i < HACKER_LINES.length) {
        setHackerLines((prev) => [...prev, HACKER_LINES[i]])
        i++
        if (hackerRef.current) {
          hackerRef.current.scrollTop = hackerRef.current.scrollHeight
        }
      } else {
        clearInterval(interval)
        setTimeout(() => setPhase(4), 600)
      }
    }, 180)
    return () => clearInterval(interval)
  }, [phase])

  // Phase 4: HAHA
  useEffect(() => {
    if (phase !== 4) return
    const t = setTimeout(() => setShowHaha(true), 300)
    return () => clearTimeout(t)
  }, [phase])

  const handleMenu = useCallback((action: string) => {
    if (action === 'entrer') {
      setPhase(3)
    }
    // inscription / connecter could navigate elsewhere
  }, [])

  // Generate matrix columns
  const matrixColumns = Array.from({ length: 35 }, (_, i) => (
    <MatrixColumn
      key={i}
      delay={Math.random() * 2000}
      speed={40 + Math.random() * 80}
      left={`${(i / 35) * 100}%`}
    />
  ))

  return (
    <>
      <Head>
        <title>MARCEAU - Bienvenu dans ma tete</title>
      </Head>

      <div className="fixed inset-0 bg-black overflow-hidden" style={{ fontFamily: "'Courier New', monospace" }}>
        {/* ═══════════ PHASE 0 & 1: FULLSCREEN IMAGE + TITLE ═══════════ */}
        <AnimatePresence>
          {(phase === 0 || phase === 1) && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 1.2 }}
            >
              {/* Background image - the demon/MARCEAU logo */}
              <motion.div
                className="relative"
                animate={
                  phase === 1
                    ? { scale: [1, 1.15, 1.1], y: [0, -30, -20] }
                    : {}
                }
                transition={{ duration: 2 }}
              >
                {/* Demon image placeholder - styled div */}
                <div className="relative w-[600px] h-[400px] flex items-center justify-center">
                  {/* Glow behind */}
                  <div
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(255,100,0,0.3) 0%, transparent 70%)',
                    }}
                  />

                  {/* Demon silhouette */}
                  <svg viewBox="0 0 400 300" className="w-full h-full">
                    {/* Horns */}
                    <path
                      d="M120,120 Q100,40 80,30 Q110,80 130,100"
                      fill="#8B4513"
                      stroke="#ff6600"
                      strokeWidth="1"
                    />
                    <path
                      d="M280,120 Q300,40 320,30 Q290,80 270,100"
                      fill="#8B4513"
                      stroke="#ff6600"
                      strokeWidth="1"
                    />
                    {/* Head */}
                    <ellipse cx="200" cy="140" rx="80" ry="70" fill="#1a1a1a" stroke="#ff6600" strokeWidth="1" />
                    {/* Eyes */}
                    <motion.ellipse
                      cx="175"
                      cy="130"
                      rx="12"
                      ry="8"
                      animate={{
                        fill: eyesRed ? '#ff0000' : '#ffffff',
                        filter: eyesRed ? 'drop-shadow(0 0 20px #ff0000)' : 'drop-shadow(0 0 10px #ffffff)',
                      }}
                      transition={{ duration: 0.5 }}
                      style={{ filter: 'drop-shadow(0 0 10px #ffffff)' }}
                    />
                    <motion.ellipse
                      cx="225"
                      cy="130"
                      rx="12"
                      ry="8"
                      animate={{
                        fill: eyesRed ? '#ff0000' : '#ffffff',
                        filter: eyesRed ? 'drop-shadow(0 0 20px #ff0000)' : 'drop-shadow(0 0 10px #ffffff)',
                      }}
                      transition={{ duration: 0.5 }}
                      style={{ filter: 'drop-shadow(0 0 10px #ffffff)' }}
                    />
                    {/* Mouth / grin */}
                    <path
                      d="M170,165 Q200,190 230,165"
                      fill="none"
                      stroke="#DAA520"
                      strokeWidth="2"
                    />
                    {/* Teeth */}
                    <path d="M180,165 L185,175 L190,165" fill="#DAA520" />
                    <path d="M195,167 L200,178 L205,167" fill="#DAA520" />
                    <path d="M210,165 L215,175 L220,165" fill="#DAA520" />
                    {/* Wings */}
                    <path
                      d="M120,140 Q60,100 40,160 Q80,140 120,160"
                      fill="#2a0a0a"
                      stroke="#ff6600"
                      strokeWidth="1"
                    />
                    <path
                      d="M280,140 Q340,100 360,160 Q320,140 280,160"
                      fill="#2a0a0a"
                      stroke="#ff6600"
                      strokeWidth="1"
                    />
                    {/* Claws left */}
                    <path d="M80,200 Q60,220 50,240" stroke="#8B4513" strokeWidth="3" fill="none" />
                    <path d="M90,200 Q75,225 70,245" stroke="#8B4513" strokeWidth="3" fill="none" />
                    <path d="M100,205 Q90,230 85,248" stroke="#8B4513" strokeWidth="3" fill="none" />
                    {/* Claws right */}
                    <path d="M320,200 Q340,220 350,240" stroke="#8B4513" strokeWidth="3" fill="none" />
                    <path d="M310,200 Q325,225 330,245" stroke="#8B4513" strokeWidth="3" fill="none" />
                    <path d="M300,205 Q310,230 315,248" stroke="#8B4513" strokeWidth="3" fill="none" />
                    {/* Fire aura */}
                    <motion.path
                      d="M100,80 Q120,40 140,80 Q160,30 180,80 Q200,20 220,80 Q240,30 260,80 Q280,40 300,80"
                      fill="none"
                      stroke="#ff6600"
                      strokeWidth="2"
                      animate={{ opacity: [0.4, 1, 0.4], y: [0, -5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </svg>
                </div>

                {/* MARCEAU title - letter by letter */}
                <div className="flex justify-center mt-4">
                  {TITLE_LETTERS.map((letter, i) => (
                    <motion.span
                      key={i}
                      className="text-7xl font-black tracking-wider"
                      initial={{ opacity: 0, y: 30, scale: 0.5 }}
                      animate={
                        i < visibleLetters
                          ? { opacity: 1, y: 0, scale: 1 }
                          : {}
                      }
                      transition={{ duration: 0.4, type: 'spring' }}
                      style={{
                        color: '#DAA520',
                        textShadow:
                          '0 0 20px #ff6600, 0 0 40px #ff4500, 0 2px 0 #8B4513, 0 4px 0 #654321',
                        WebkitTextStroke: '1px #ff8c00',
                      }}
                    >
                      {letter}
                    </motion.span>
                  ))}
                </div>
              </motion.div>

              {/* 80s skull flash */}
              <AnimatePresence>
                {skullFlash && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-black/80 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="text-center"
                      initial={{ scale: 0.3, rotate: -10 }}
                      animate={{ scale: 1.2, rotate: 0 }}
                      exit={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div
                        className="text-9xl"
                        style={{
                          filter: 'drop-shadow(0 0 30px #ff0000)',
                        }}
                      >
                        💀
                      </div>
                      <div
                        className="text-2xl font-bold mt-2 tracking-[0.5em]"
                        style={{
                          color: '#ff0000',
                          textShadow: '0 0 15px #ff0000',
                          fontFamily: "'Press Start 2P', monospace",
                        }}
                      >
                        GAME OVER
                      </div>
                      {/* Scanlines overlay - 80s effect */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
                        }}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ PHASE 2: MATRIX RAIN + MENU ═══════════ */}
        <AnimatePresence>
          {phase === 2 && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Matrix rain background */}
              <div className="absolute inset-0 overflow-hidden">{matrixColumns}</div>

              {/* Menu */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <motion.h1
                  className="text-5xl font-black mb-12"
                  initial={{ opacity: 0, y: -40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  style={{
                    color: '#ff8c00',
                    textShadow: '0 0 30px #ff6600, 0 0 60px #ff4500',
                  }}
                >
                  MARCEAU
                </motion.h1>

                {['ENTRER', 'INSCRIPTION', 'CONNECTER'].map((item, i) => (
                  <motion.button
                    key={item}
                    className="block w-64 py-4 px-8 mb-4 text-xl font-bold border-2 rounded-lg transition-all"
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.3, duration: 0.5 }}
                    style={{
                      borderColor: '#ff6600',
                      color: '#ff8c00',
                      background: 'rgba(255, 100, 0, 0.1)',
                      textShadow: '0 0 10px #ff6600',
                    }}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: '0 0 30px rgba(255,100,0,0.5)',
                      background: 'rgba(255, 100, 0, 0.25)',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMenu(item.toLowerCase())}
                  >
                    {'> '}{item}
                  </motion.button>
                ))}
              </div>

              {/* Scanlines */}
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  background:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ PHASE 3: HACKER CODE ═══════════ */}
        <AnimatePresence>
          {phase === 3 && (
            <motion.div
              className="absolute inset-0 bg-black p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                ref={hackerRef}
                className="h-full overflow-y-auto font-mono text-sm"
                style={{ color: '#ff8c00' }}
              >
                {hackerLines.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                    style={{ textShadow: '0 0 5px #ff6600' }}
                  >
                    {line}
                  </motion.div>
                ))}
                {/* Blinking cursor */}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ color: '#ff8c00' }}
                >
                  _
                </motion.span>
              </div>

              {/* Scanlines */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ PHASE 4: WARNING + HAHA ═══════════ */}
        <AnimatePresence>
          {phase === 4 && (
            <motion.div
              className="absolute inset-0 bg-black flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Warning emoji */}
              <motion.div
                className="text-8xl mb-8"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.5 }}
              >
                ⚠️
              </motion.div>

              {/* HAHA 3D orange text */}
              <AnimatePresence>
                {showHaha && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
                  >
                    <h1
                      className="text-9xl font-black tracking-wider"
                      style={{
                        color: '#ff8c00',
                        textShadow: `
                          0 1px 0 #cc7000,
                          0 2px 0 #bb6000,
                          0 3px 0 #aa5000,
                          0 4px 0 #994000,
                          0 5px 0 #883000,
                          0 6px 0 #772000,
                          0 7px 0 #661000,
                          0 8px 0 #550000,
                          0 0 40px rgba(255,140,0,0.6),
                          0 0 80px rgba(255,100,0,0.4),
                          0 0 120px rgba(255,60,0,0.2)
                        `,
                        transform: 'perspective(500px) rotateX(10deg)',
                      }}
                    >
                      <motion.span
                        animate={{
                          textShadow: [
                            '0 0 40px rgba(255,140,0,0.6)',
                            '0 0 80px rgba(255,140,0,0.9)',
                            '0 0 40px rgba(255,140,0,0.6)',
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        HAHA
                      </motion.span>
                    </h1>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Glitch effect lines */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  background: [
                    'transparent',
                    'linear-gradient(0deg, transparent 95%, rgba(255,100,0,0.3) 95%)',
                    'transparent',
                  ],
                }}
                transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 2 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

WelcomePage.getLayout = (page) => page

export default WelcomePage
