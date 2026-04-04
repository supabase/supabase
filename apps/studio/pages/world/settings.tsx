import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type LangCode, LANGUAGES, t } from 'lib/i18n/translations'
import type { NextPageWithLayout } from 'types'

const SettingsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const [currentLang, setCurrentLang] = useState<LangCode>(
    (router.query.lang as LangCode) || 'fr'
  )
  const [theme, setTheme] = useState<'dark' | 'orange'>('dark')
  const [notifications, setNotifications] = useState(true)
  const [sound, setSound] = useState(true)
  const [scanlines, setScanlines] = useState(true)

  useEffect(() => {
    if (router.query.lang) setCurrentLang(router.query.lang as LangCode)
  }, [router.query.lang])

  const toggleStyle = (enabled: boolean) => ({
    width: 44,
    height: 24,
    borderRadius: 12,
    background: enabled ? 'rgba(255,100,0,0.4)' : 'rgba(255,100,0,0.1)',
    border: `2px solid ${enabled ? '#ff8c00' : '#ff660044'}`,
    position: 'relative' as const,
    cursor: 'pointer',
  })

  const dotStyle = (enabled: boolean) => ({
    width: 16,
    height: 16,
    borderRadius: 8,
    background: enabled ? '#ff8c00' : '#ff660044',
    position: 'absolute' as const,
    top: 2,
    left: enabled ? 22 : 2,
    transition: 'left 0.2s, background 0.2s',
  })

  // Raccoon SVG mascot with deal-with-it sunglasses
  const RaccoonMascot = () => (
    <motion.div
      className="fixed top-20 right-4 z-40"
      initial={{ opacity: 0, x: 100, rotate: 10 }}
      animate={{ opacity: 1, x: 0, rotate: 0 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 120 }}
      style={{ width: 180, height: 220 }}
    >
      <svg viewBox="0 0 200 250" width="180" height="220">
        {/* Body */}
        <ellipse cx="100" cy="180" rx="55" ry="60" fill="#8B7355" />
        <ellipse cx="100" cy="185" rx="40" ry="45" fill="#C4B49A" />
        {/* Head */}
        <ellipse cx="100" cy="100" rx="50" ry="45" fill="#8B7355" />
        {/* Face mask */}
        <ellipse cx="100" cy="105" rx="35" ry="30" fill="#C4B49A" />
        {/* Dark eye patches */}
        <ellipse cx="78" cy="95" rx="18" ry="14" fill="#2C2C2C" />
        <ellipse cx="122" cy="95" rx="18" ry="14" fill="#2C2C2C" />
        {/* Eyes */}
        <circle cx="78" cy="95" r="6" fill="white" />
        <circle cx="122" cy="95" r="6" fill="white" />
        <circle cx="80" cy="94" r="3" fill="black" />
        <circle cx="124" cy="94" r="3" fill="black" />
        {/* Nose */}
        <ellipse cx="100" cy="110" rx="6" ry="4" fill="#2C2C2C" />
        {/* Mouth - grin */}
        <path d="M 88 118 Q 100 128 112 118" stroke="#2C2C2C" strokeWidth="2" fill="none" />
        {/* Ears */}
        <ellipse cx="65" cy="65" rx="15" ry="18" fill="#8B7355" />
        <ellipse cx="135" cy="65" rx="15" ry="18" fill="#8B7355" />
        <ellipse cx="65" cy="65" rx="10" ry="12" fill="#C4B49A" />
        <ellipse cx="135" cy="65" rx="10" ry="12" fill="#C4B49A" />
        {/* Arms raised up - rock on! */}
        <path d="M 50 160 Q 20 100 15 70" stroke="#8B7355" strokeWidth="16" fill="none" strokeLinecap="round" />
        <path d="M 150 160 Q 180 100 185 70" stroke="#8B7355" strokeWidth="16" fill="none" strokeLinecap="round" />
        {/* Hands */}
        <circle cx="15" cy="68" r="10" fill="#8B7355" />
        <circle cx="185" cy="68" r="10" fill="#8B7355" />
        {/* Rock fingers - left hand */}
        <line x1="8" y1="62" x2="3" y2="45" stroke="#8B7355" strokeWidth="4" strokeLinecap="round" />
        <line x1="20" y1="60" x2="22" y2="43" stroke="#8B7355" strokeWidth="4" strokeLinecap="round" />
        {/* Rock fingers - right hand */}
        <line x1="178" y1="60" x2="176" y2="43" stroke="#8B7355" strokeWidth="4" strokeLinecap="round" />
        <line x1="192" y1="62" x2="197" y2="45" stroke="#8B7355" strokeWidth="4" strokeLinecap="round" />
        {/* Deal-with-it sunglasses */}
        <rect x="60" y="86" width="80" height="16" rx="2" fill="black" />
        <rect x="62" y="88" width="25" height="12" rx="1" fill="#111" />
        <rect x="113" y="88" width="25" height="12" rx="1" fill="#111" />
        {/* Pixel shine on glasses */}
        <rect x="65" y="90" width="4" height="3" fill="rgba(255,255,255,0.3)" />
        <rect x="71" y="90" width="4" height="3" fill="rgba(255,255,255,0.3)" />
        <rect x="116" y="90" width="4" height="3" fill="rgba(255,255,255,0.3)" />
        <rect x="122" y="90" width="4" height="3" fill="rgba(255,255,255,0.3)" />
        {/* Tail */}
        <path d="M 145 200 Q 175 180 170 150 Q 165 130 175 120" stroke="#8B7355" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M 170 150 Q 165 130 175 120" stroke="#2C2C2C" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.5" />
      </svg>
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,100,0,0.15) 0%, transparent 70%)' }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Label */}
      <motion.p
        className="text-center text-xs font-bold mt-1"
        style={{ color: '#ff8c00', textShadow: '0 0 8px #ff6600' }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        DEAL WITH IT
      </motion.p>
    </motion.div>
  )

  return (
    <>
      <Head>
        <title>MARCEAU - {t(currentLang, 'settings')}</title>
      </Head>

      <div
        className="fixed inset-0 bg-black overflow-y-auto"
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        {/* Raccoon mascot - fixed top right */}
        <RaccoonMascot />

        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: '#ff660033', background: 'rgba(0,0,0,0.95)' }}
        >
          <div className="flex items-center gap-4">
            <Link href={`/world?lang=${currentLang}`} passHref legacyBehavior>
              <a style={{ color: '#ff8c00' }} className="text-sm">
                ← {t(currentLang, 'dashboard')}
              </a>
            </Link>
            <h1
              className="text-xl font-bold"
              style={{ color: '#ff8c00', textShadow: '0 0 10px #ff6600' }}
            >
              ⚙️ {t(currentLang, 'settings')}
            </h1>
          </div>
        </div>

        {/* Settings menu aligned to the left */}
        <div className="max-w-md p-6 space-y-6 ml-4">
          {/* Language */}
          <motion.div
            className="p-5 rounded-xl border"
            style={{ borderColor: '#ff660033', background: 'rgba(255,100,0,0.03)' }}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-sm font-bold mb-4" style={{ color: '#ff8c00' }}>
              🌐 {t(currentLang, 'language')}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(LANGUAGES) as [LangCode, string][]).map(([code, name]) => (
                <button
                  key={code}
                  className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background:
                      currentLang === code
                        ? 'rgba(255,100,0,0.25)'
                        : 'rgba(255,100,0,0.05)',
                    border: `1px solid ${currentLang === code ? '#ff8c00' : '#ff660033'}`,
                    color: currentLang === code ? '#ff8c00' : '#ff660066',
                  }}
                  onClick={() => setCurrentLang(code)}
                >
                  {name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Theme */}
          <motion.div
            className="p-5 rounded-xl border"
            style={{ borderColor: '#ff660033', background: 'rgba(255,100,0,0.03)' }}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm font-bold mb-4" style={{ color: '#ff8c00' }}>
              🎨 Theme
            </h3>
            <div className="flex gap-3">
              {(['dark', 'orange'] as const).map((t) => (
                <button
                  key={t}
                  className="flex-1 py-3 rounded-lg text-sm font-bold"
                  style={{
                    background:
                      theme === t
                        ? t === 'dark'
                          ? 'rgba(255,100,0,0.2)'
                          : 'rgba(255,140,0,0.3)'
                        : 'rgba(255,100,0,0.05)',
                    border: `2px solid ${theme === t ? '#ff8c00' : '#ff660033'}`,
                    color: theme === t ? '#ff8c00' : '#ff660066',
                  }}
                  onClick={() => setTheme(t)}
                >
                  {t === 'dark' ? '🌑 Dark' : '🔥 Orange'}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Toggles */}
          <motion.div
            className="p-5 rounded-xl border space-y-4"
            style={{ borderColor: '#ff660033', background: 'rgba(255,100,0,0.03)' }}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-bold mb-4" style={{ color: '#ff8c00' }}>
              🔧 Options
            </h3>

            {[
              { label: '🔔 Notifications', value: notifications, set: setNotifications },
              { label: '🔊 Sound', value: sound, set: setSound },
              { label: '📺 Scanlines Effect', value: scanlines, set: setScanlines },
            ].map((opt) => (
              <div key={opt.label} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#ff8c00' }}>
                  {opt.label}
                </span>
                <div style={toggleStyle(opt.value)} onClick={() => opt.set(!opt.value)}>
                  <div style={dotStyle(opt.value)} />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Info */}
          <motion.div
            className="p-5 rounded-xl border"
            style={{ borderColor: '#ff660033', background: 'rgba(255,100,0,0.03)' }}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-bold mb-3" style={{ color: '#ff8c00' }}>
              ℹ️ Info
            </h3>
            <div className="space-y-2 text-xs" style={{ color: '#ff660088' }}>
              <p>Le Monde d&apos;Alex - MARCEAU Platform</p>
              <p>Version: 3.0.0</p>
              <p>Cree par: Alex Marceau Prevost</p>
              <p>Agent Alex | Ti-Lex-Al | GPS Map IA</p>
            </div>
          </motion.div>
        </div>

        {/* Scanlines */}
        {scanlines && (
          <div
            className="fixed inset-0 pointer-events-none z-50"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 6px)',
            }}
          />
        )}
      </div>
    </>
  )
}

SettingsPage.getLayout = (page) => page

export default SettingsPage
