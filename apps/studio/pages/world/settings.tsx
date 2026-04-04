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

  return (
    <>
      <Head>
        <title>MARCEAU - {t(currentLang, 'settings')}</title>
      </Head>

      <div
        className="fixed inset-0 bg-black overflow-y-auto"
        style={{ fontFamily: "'Courier New', monospace" }}
      >
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

        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Language */}
          <motion.div
            className="p-5 rounded-xl border"
            style={{ borderColor: '#ff660033', background: 'rgba(255,100,0,0.03)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
