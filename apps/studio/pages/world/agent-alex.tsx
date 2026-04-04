import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type LangCode, LANGUAGES, t } from 'lib/i18n/translations'
import type { NextPageWithLayout } from 'types'

// ─── AGENT COMMANDS & RESPONSES ───────────────────────────
interface MissionEntry {
  id: number
  title: string
  status: 'active' | 'completed' | 'failed'
  priority: 'high' | 'medium' | 'low'
  timestamp: Date
}

const INITIAL_MISSIONS: MissionEntry[] = [
  { id: 1, title: 'Surveillance reseau MARCEAU', status: 'active', priority: 'high', timestamp: new Date() },
  { id: 2, title: 'Analyse des donnees secteur 7', status: 'active', priority: 'medium', timestamp: new Date() },
  { id: 3, title: 'Infiltration systeme cible Alpha', status: 'completed', priority: 'high', timestamp: new Date(Date.now() - 86400000) },
  { id: 4, title: 'Extraction protocole Delta', status: 'completed', priority: 'low', timestamp: new Date(Date.now() - 172800000) },
  { id: 5, title: 'Decryptage message intercepte', status: 'active', priority: 'high', timestamp: new Date() },
]

const AGENT_RESPONSES: Record<string, string[]> = {
  fr: [
    'Agent Alex ici. Commande recue et executee. Le systeme MARCEAU est sous controle.',
    'Scan reseau termine. 47 noeuds detectes. 3 anomalies identifiees. Action recommandee: surveillance accrue.',
    'Rapport de mission: Infiltration reussie. Donnees extraites avec succes. Couverture intacte.',
    'Alerte securite! Tentative d\'intrusion detectee sur le perimetre nord. Contre-mesures activees.',
    'Analyse complete. Les patterns de trafic indiquent une activite suspecte dans le secteur 12.',
    'Code source dechiffre. Le protocole secret est: MARCEAU-OMEGA-7. Classifie niveau Alpha.',
    'Agent Alex confirme: la cible est en mouvement. Coordination avec l\'equipe terrain en cours.',
    'Mission accomplie. Toutes les donnees ont ete securisees dans le coffre-fort numerique MARCEAU.',
  ],
  en: [
    'Agent Alex here. Command received and executed. MARCEAU system is under control.',
    'Network scan complete. 47 nodes detected. 3 anomalies identified. Recommended action: increased surveillance.',
    'Mission report: Infiltration successful. Data extracted successfully. Cover intact.',
    'Security alert! Intrusion attempt detected on northern perimeter. Countermeasures activated.',
    'Analysis complete. Traffic patterns indicate suspicious activity in sector 12.',
    'Source code decrypted. Secret protocol is: MARCEAU-OMEGA-7. Classified Alpha level.',
    'Agent Alex confirms: target is moving. Coordination with field team in progress.',
    'Mission accomplished. All data secured in MARCEAU digital vault.',
  ],
}

// ─── BOOT SEQUENCE ────────────────────────────────────────
const BOOT_LINES = [
  '> MARCEAU AGENT SYSTEM v3.7.1',
  '> Initializing secure connection...',
  '> Loading agent profile: ALEX MARCEAU PREVOST',
  '> Clearance: OMEGA - TOP SECRET',
  '> Biometric scan... VERIFIED',
  '> Neural link established...',
  '> Encrypting channel... AES-512',
  '> Loading mission database...',
  '> Satellite uplink... CONNECTED',
  '> Agent tools: ONLINE',
  '> ████████████████████ 100%',
  '> SYSTEM READY',
  '> ',
  '> Welcome, Agent Alex.',
]

// ─── TOOL ANIMATIONS ─────────────────────────────────────
function ToolCard({
  icon,
  name,
  onClick,
  active,
}: {
  icon: string
  name: string
  onClick: () => void
  active: boolean
}) {
  return (
    <motion.button
      className="flex flex-col items-center gap-2 p-3 rounded-xl border"
      style={{
        borderColor: active ? '#ff8c00' : '#ff660033',
        background: active ? 'rgba(255,100,0,0.2)' : 'rgba(255,100,0,0.05)',
      }}
      whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,100,0,0.3)' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-bold" style={{ color: '#ff8c00' }}>{name}</span>
    </motion.button>
  )
}

// ─── MAIN AGENT ALEX PAGE ─────────────────────────────────
const AgentAlexPage: NextPageWithLayout = () => {
  const router = useRouter()
  const lang = (router.query.lang as LangCode) || 'fr'
  const [currentLang, setCurrentLang] = useState<LangCode>(lang)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [booting, setBooting] = useState(true)
  const [bootLines, setBootLines] = useState<string[]>([])
  const [missions, setMissions] = useState<MissionEntry[]>(INITIAL_MISSIONS)
  const [commandInput, setCommandInput] = useState('')
  const [commandLog, setCommandLog] = useState<{ cmd: string; response: string }[]>([])
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [toolOutput, setToolOutput] = useState('')
  const [toolRunning, setToolRunning] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const bootRef = useRef<HTMLDivElement>(null)
  const toolIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Boot sequence
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setBootLines((prev) => [...prev, BOOT_LINES[i]])
        i++
        if (bootRef.current) bootRef.current.scrollTop = bootRef.current.scrollHeight
      } else {
        clearInterval(interval)
        setTimeout(() => setBooting(false), 1000)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [])

  // Auto scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [commandLog])

  // Execute command
  const executeCommand = useCallback(() => {
    if (!commandInput.trim()) return
    const cmd = commandInput.trim()
    setCommandInput('')

    const responses = AGENT_RESPONSES[currentLang] || AGENT_RESPONSES.en
    const response = responses[Math.floor(Math.random() * responses.length)]

    setCommandLog((prev) => [...prev, { cmd, response }])

    // Special commands
    if (cmd.toLowerCase().includes('mission')) {
      setMissions((prev) => [
        {
          id: Date.now(),
          title: cmd,
          status: 'active',
          priority: 'high',
          timestamp: new Date(),
        },
        ...prev,
      ])
    }
  }, [commandInput, currentLang])

  // Cleanup tool interval on unmount
  useEffect(() => {
    return () => {
      if (toolIntervalRef.current) clearInterval(toolIntervalRef.current)
    }
  }, [])

  // Run tool
  const runTool = useCallback(
    (tool: string) => {
      // Cancel any previous tool animation
      if (toolIntervalRef.current) {
        clearInterval(toolIntervalRef.current)
        toolIntervalRef.current = null
      }

      setActiveTool(tool)
      setToolRunning(true)
      setToolOutput('')

      const outputs: Record<string, string[]> = {
        codeBreaker: [
          'Decrypting...',
          'Key found: 0xMARCEAU_ALEX_2024',
          'Cipher: AES-512-OMEGA',
          'Decrypted payload: [CLASSIFIED]',
          'Status: SUCCESS',
        ],
        networkScan: [
          'Scanning ports 1-65535...',
          'Host 192.168.1.1: OPEN [22,80,443]',
          'Host 10.0.0.1: OPEN [8080,3306]',
          'Host 172.16.0.1: FILTERED',
          'Vulnerabilities found: 0',
          'Network: SECURE',
        ],
        dataExtract: [
          'Connecting to target database...',
          'Authentication: BYPASSED',
          'Tables found: 147',
          'Extracting records...',
          '████████████████ 100%',
          'Data saved to /vault/extract_001.enc',
        ],
        encryptMsg: [
          'Encryption mode: MARCEAU-OMEGA',
          'Generating key pair...',
          'RSA-4096 + AES-512',
          'Message encrypted successfully',
          'Signature: AGENT_ALEX_VERIFIED',
          'Expiry: 24h auto-destruct',
        ],
      }

      const lines = outputs[tool] || ['Running...', 'Complete.']
      let i = 0
      toolIntervalRef.current = setInterval(() => {
        if (i < lines.length) {
          setToolOutput((prev) => (prev ? prev + '\n' : '') + '> ' + lines[i])
          i++
        } else {
          if (toolIntervalRef.current) {
            clearInterval(toolIntervalRef.current)
            toolIntervalRef.current = null
          }
          setToolRunning(false)
        }
      }, 400)
    },
    []
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      executeCommand()
    }
  }

  return (
    <>
      <Head>
        <title>MARCEAU - {t(currentLang, 'agentAlex')}</title>
      </Head>

      {/* ═══════════ BOOT SEQUENCE ═══════════ */}
      <AnimatePresence>
        {booting && (
          <motion.div
            className="fixed inset-0 bg-black z-50 p-8"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div ref={bootRef} className="h-full overflow-y-auto font-mono text-sm" style={{ color: '#ff8c00' }}>
              {bootLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ textShadow: '0 0 5px #ff6600' }}
                >
                  {line}
                </motion.div>
              ))}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              >
                _
              </motion.span>
            </div>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ MAIN INTERFACE ═══════════ */}
      <AnimatePresence>
        {!booting && (
          <motion.div
            className="fixed inset-0 bg-black flex"
            style={{ fontFamily: "'Courier New', monospace" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* ─── LEFT: AGENT PROFILE + MISSIONS ──── */}
            <div
              className="w-80 h-full flex flex-col border-r overflow-hidden"
              style={{ borderColor: '#ff660033', background: 'rgba(0,0,0,0.95)' }}
            >
              {/* Header */}
              <div className="p-4 border-b" style={{ borderColor: '#ff660033' }}>
                <div className="flex items-center justify-between mb-3">
                  <Link href={`/world?lang=${currentLang}`} passHref legacyBehavior>
                    <a style={{ color: '#ff8c00' }} className="text-sm">← {t(currentLang, 'dashboard')}</a>
                  </Link>
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

                {/* Agent avatar + name */}
                <div
                  className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer"
                  style={{ borderColor: '#ff660044', background: 'rgba(255,100,0,0.05)' }}
                  onClick={() => setShowProfile(!showProfile)}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black"
                    style={{
                      background: 'linear-gradient(135deg, #ff8c00, #ff4500, #cc0000)',
                      boxShadow: '0 0 20px rgba(255,100,0,0.5)',
                      color: '#000',
                    }}
                  >
                    A
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: '#ff8c00', textShadow: '0 0 10px #ff6600' }}>
                      {t(currentLang, 'agentAlex')}
                    </h2>
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-2 h-2 rounded-full"
                        style={{ background: '#00ff00' }}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="text-xs" style={{ color: '#00ff0088' }}>
                        {t(currentLang, 'agentAlexStatus')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile expanded */}
                <AnimatePresence>
                  {showProfile && (
                    <motion.div
                      className="mt-3 p-3 rounded-lg text-xs space-y-2"
                      style={{ background: 'rgba(255,100,0,0.08)', border: '1px solid #ff660033' }}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="flex justify-between">
                        <span style={{ color: '#ff660088' }}>{t(currentLang, 'agentRank')}:</span>
                        <span style={{ color: '#ff8c00' }}>OMEGA Commander</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#ff660088' }}>{t(currentLang, 'agentClearance')}:</span>
                        <span style={{ color: '#ff0000' }}>TOP SECRET</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#ff660088' }}>{t(currentLang, 'agentSpecialty')}:</span>
                        <span style={{ color: '#ff8c00' }}>Cyber Operations</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#ff660088' }}>ID:</span>
                        <span style={{ color: '#ff8c00' }}>MARCEAU-001</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#ff660088' }}>Code:</span>
                        <span style={{ color: '#ff4500' }}>ALEX-PREVOST-OMEGA</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Missions */}
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-bold mb-3" style={{ color: '#ff8c00' }}>
                  📋 {t(currentLang, 'missionLog')}
                </h3>

                {missions.map((mission) => (
                  <motion.div
                    key={mission.id}
                    className="mb-2 p-2 rounded-lg border text-xs"
                    style={{
                      borderColor:
                        mission.status === 'active'
                          ? mission.priority === 'high'
                            ? '#ff000044'
                            : '#ff660033'
                          : '#33333344',
                      background:
                        mission.status === 'active'
                          ? 'rgba(255,100,0,0.05)'
                          : 'rgba(50,50,50,0.1)',
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="font-bold"
                        style={{
                          color: mission.status === 'active' ? '#ff8c00' : '#666',
                        }}
                      >
                        {mission.title}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          background:
                            mission.status === 'active'
                              ? 'rgba(255,100,0,0.2)'
                              : 'rgba(0,255,0,0.1)',
                          color: mission.status === 'active' ? '#ff8c00' : '#00ff00',
                        }}
                      >
                        {mission.status === 'active'
                          ? t(currentLang, 'activeMissions')
                          : t(currentLang, 'completedMissions')}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{
                          color:
                            mission.priority === 'high'
                              ? '#ff0000'
                              : mission.priority === 'medium'
                              ? '#ffaa00'
                              : '#888',
                        }}
                      >
                        [{mission.priority.toUpperCase()}]
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ─── CENTER: TERMINAL + TOOLS ──────── */}
            <div className="flex-1 flex flex-col">
              {/* Status bar */}
              <div
                className="flex items-center justify-between px-6 py-2 border-b"
                style={{ borderColor: '#ff660022', background: 'rgba(255,100,0,0.03)' }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold" style={{ color: '#00ff00' }}>
                    ● {t(currentLang, 'systemOnline')}
                  </span>
                  <span className="text-xs" style={{ color: '#ff660066' }}>
                    MARCEAU-NET | Encrypted | Ping: 12ms
                  </span>
                </div>
                <span className="text-xs" style={{ color: '#ff660044' }}>
                  {new Date().toLocaleString()}
                </span>
              </div>

              {/* Tools row */}
              <div className="px-6 py-3 border-b flex gap-3" style={{ borderColor: '#ff660022' }}>
                <span className="text-xs font-bold self-center mr-2" style={{ color: '#ff8c00' }}>
                  {t(currentLang, 'agentTools')}:
                </span>
                <ToolCard
                  icon="🔓"
                  name={t(currentLang, 'codeBreaker')}
                  onClick={() => runTool('codeBreaker')}
                  active={activeTool === 'codeBreaker'}
                />
                <ToolCard
                  icon="📡"
                  name={t(currentLang, 'networkScan')}
                  onClick={() => runTool('networkScan')}
                  active={activeTool === 'networkScan'}
                />
                <ToolCard
                  icon="💾"
                  name={t(currentLang, 'dataExtract')}
                  onClick={() => runTool('dataExtract')}
                  active={activeTool === 'dataExtract'}
                />
                <ToolCard
                  icon="🔐"
                  name={t(currentLang, 'encryptMsg')}
                  onClick={() => runTool('encryptMsg')}
                  active={activeTool === 'encryptMsg'}
                />
              </div>

              {/* Tool output */}
              <AnimatePresence>
                {toolOutput && (
                  <motion.div
                    className="mx-6 mt-3 p-3 rounded-lg font-mono text-xs"
                    style={{
                      background: 'rgba(255,100,0,0.05)',
                      border: '1px solid #ff660033',
                      color: '#ff8c00',
                    }}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">[{activeTool}]</span>
                      {toolRunning && (
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          style={{ color: '#ffaa00' }}
                        >
                          RUNNING...
                        </motion.span>
                      )}
                      {!toolRunning && <span style={{ color: '#00ff00' }}>COMPLETE</span>}
                    </div>
                    <pre className="whitespace-pre-wrap" style={{ textShadow: '0 0 3px #ff6600' }}>
                      {toolOutput}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terminal / Command log */}
              <div
                ref={terminalRef}
                className="flex-1 overflow-y-auto px-6 py-4 font-mono text-sm"
              >
                {/* Welcome message */}
                <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(255,100,0,0.05)', border: '1px solid #ff660022' }}>
                  <p style={{ color: '#ff8c00', textShadow: '0 0 5px #ff6600' }}>
                    🕶️ {t(currentLang, 'agentAlexGreeting')}
                  </p>
                </div>

                {/* Command history */}
                {commandLog.map((entry, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex items-center gap-2">
                      <span style={{ color: '#ff4500' }}>AGENT_ALEX $</span>
                      <span style={{ color: '#ff8c00' }}>{entry.cmd}</span>
                    </div>
                    <motion.div
                      className="mt-1 pl-4 text-xs"
                      style={{ color: '#ff660099', textShadow: '0 0 3px #ff660033' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {entry.response}
                    </motion.div>
                  </div>
                ))}
              </div>

              {/* Command input */}
              <div className="px-6 py-4 border-t" style={{ borderColor: '#ff660033' }}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold" style={{ color: '#ff4500', textShadow: '0 0 8px #ff4500' }}>
                    AGENT_ALEX $
                  </span>
                  <input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t(currentLang, 'commandPrompt')}
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: '#ff8c00', caretColor: '#ff8c00' }}
                  />
                  <motion.button
                    className="px-4 py-2 rounded-lg text-xs font-bold"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,100,0,0.3), rgba(255,60,0,0.15))',
                      border: '1px solid #ff6600',
                      color: '#ff8c00',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={executeCommand}
                  >
                    {t(currentLang, 'executeCommand')}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Scanlines overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 6px)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

AgentAlexPage.getLayout = (page) => page

export default AgentAlexPage
