import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type LangCode, LANGUAGES, t } from 'lib/i18n/translations'
import type { NextPageWithLayout } from 'types'

// --- GENERATE FAKE API KEY ---
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const prefix = 'mrcx_live_'
  let key = prefix
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

// --- COMPLIANCE STANDARDS ---
const COMPLIANCE_STANDARDS = [
  { name: 'PIPEDA', region: 'Canada', desc: 'Personal Information Protection and Electronic Documents Act', icon: '🇨🇦' },
  { name: 'RGPD / GDPR', region: 'Europe', desc: 'General Data Protection Regulation - Reglement general sur la protection des donnees', icon: '🇪🇺' },
  { name: 'CCPA', region: 'California, USA', desc: 'California Consumer Privacy Act', icon: '🇺🇸' },
  { name: 'PCI-DSS', region: 'Mondial', desc: 'Payment Card Industry Data Security Standard', icon: '💳' },
  { name: 'SOC 2 Type II', region: 'Mondial', desc: 'Service Organization Control - Security, Availability, Confidentiality', icon: '🔒' },
  { name: 'ISO 27001', region: 'Mondial', desc: 'Information Security Management System', icon: '🏛️' },
  { name: 'HIPAA', region: 'USA', desc: 'Health Insurance Portability and Accountability Act', icon: '🏥' },
  { name: 'Loi 25', region: 'Quebec, Canada', desc: 'Loi modernisant des dispositions legislatives en matiere de protection des renseignements personnels', icon: '⚜️' },
]

// --- BAN RULES ---
const BAN_RULES = [
  { offense: '1er abus / 1st offense', action: 'Avertissement / Warning', icon: '⚠️' },
  { offense: '2e abus / 2nd offense', action: 'Suspension 24h + Cle revoquee / Key revoked', icon: '🔴' },
  { offense: '3e abus / 3rd offense', action: 'BAN PERMANENT / PERMANENT BAN', icon: '⛔' },
  { offense: 'Tentative de vol de cle / Key theft attempt', action: 'BAN IMMEDIAT + Rapport police / INSTANT BAN + Police report', icon: '🚨' },
  { offense: 'Scraping / Bot abuse', action: 'IP BAN + Compte supprime / Account deleted', icon: '🤖' },
]

// --- MAIN PAGE ---
const SecurityPage: NextPageWithLayout = () => {
  const router = useRouter()
  const lang = (router.query.lang as LangCode) || 'fr'
  const [currentLang, setCurrentLang] = useState<LangCode>(lang)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [activeTab, setActiveTab] = useState<'keys' | 'plans' | 'legal' | 'security'>('keys')

  const handleGenerateKey = useCallback(() => {
    setApiKey(generateApiKey())
    setShowKey(true)
  }, [])

  const handleCopyKey = useCallback(() => {
    if (apiKey) {
      navigator.clipboard?.writeText(apiKey)
      setKeyCopied(true)
      setTimeout(() => setKeyCopied(false), 2000)
    }
  }, [apiKey])

  const handleRevokeKey = useCallback(() => {
    setApiKey(null)
    setShowKey(false)
  }, [])

  return (
    <>
      <Head>
        <title>MARCEAU - {t(currentLang, 'security')}</title>
      </Head>

      <div className="fixed inset-0 bg-black overflow-auto" style={{ fontFamily: "'Courier New', monospace" }}>
        {/* Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#ff660033', background: 'rgba(0,0,0,0.98)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center gap-4">
            <Link href={'/world?lang=' + currentLang} passHref legacyBehavior>
              <a style={{ color: '#ff8c00' }} className="text-sm">← {t(currentLang, 'dashboard')}</a>
            </Link>
            <h1 className="text-2xl font-bold" style={{ color: '#ff8c00', textShadow: '0 0 15px #ff6600' }}>
              🔐 {t(currentLang, 'security')} & {t(currentLang, 'subscription')}
            </h1>
          </div>
          <div className="relative">
            <button onClick={() => setShowLangMenu(!showLangMenu)} className="text-xs px-2 py-1 border rounded" style={{ borderColor: '#ff6600', color: '#ff8c00' }}>
              🌐 {LANGUAGES[currentLang]}
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-1 w-40 rounded border z-50 max-h-60 overflow-y-auto" style={{ borderColor: '#ff6600', background: '#111' }}>
                {(Object.entries(LANGUAGES) as [LangCode, string][]).map(([code, name]) => (
                  <button key={code} className="block w-full text-left px-3 py-1 text-xs" style={{ color: currentLang === code ? '#ff8c00' : '#666' }} onClick={() => { setCurrentLang(code); setShowLangMenu(false) }}>
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6" style={{ borderColor: '#ff660022' }}>
          {(['keys', 'plans', 'legal', 'security'] as const).map((tab) => (
            <button
              key={tab}
              className="px-6 py-3 text-sm font-bold border-b-2 transition-colors"
              style={{
                borderColor: activeTab === tab ? '#ff8c00' : 'transparent',
                color: activeTab === tab ? '#ff8c00' : '#ff660055',
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'keys' && '🔑 ' + t(currentLang, 'apiKeys')}
              {tab === 'plans' && '💰 ' + t(currentLang, 'pricing')}
              {tab === 'legal' && '⚖️ ' + t(currentLang, 'legalProtection')}
              {tab === 'security' && '🛡️ ' + t(currentLang, 'securityStandards')}
            </button>
          ))}
        </div>

        <div className="max-w-5xl mx-auto p-6">
          {/* ═══════ TAB: API KEYS ═══════ */}
          {activeTab === 'keys' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-xl border p-6 mb-6" style={{ borderColor: '#ff660033', background: 'rgba(255,100,0,0.03)' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: '#ff8c00' }}>🔑 {t(currentLang, 'yourApiKey')}</h2>

                {!apiKey ? (
                  <div className="text-center py-8">
                    <p className="mb-4 text-sm" style={{ color: '#ff660088' }}>
                      {currentLang === 'fr' ? 'Genere ta cle API personnelle pour acceder aux services IA du monde d\'Alex.' : 'Generate your personal API key to access Alex\'s world AI services.'}
                    </p>
                    <motion.button
                      className="px-8 py-3 rounded-lg font-bold"
                      style={{ background: 'linear-gradient(135deg, rgba(255,100,0,0.3), rgba(255,60,0,0.15))', border: '1px solid #ff6600', color: '#ff8c00', textShadow: '0 0 10px #ff6600' }}
                      whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255,100,0,0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGenerateKey}
                    >
                      🔑 {t(currentLang, 'generateKey')}
                    </motion.button>
                  </div>
                ) : (
                  <div>
                    {/* Key display */}
                    <div className="flex items-center gap-3 p-3 rounded-lg mb-4" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #ff660044' }}>
                      <code className="flex-1 text-xs break-all" style={{ color: '#ff8c00' }}>
                        {showKey ? apiKey : apiKey.slice(0, 10) + '•'.repeat(40)}
                      </code>
                      <button onClick={() => setShowKey(!showKey)} className="text-xs px-2 py-1 rounded" style={{ color: '#ff660088', border: '1px solid #ff660033' }}>
                        {showKey ? '🙈' : '👁️'}
                      </button>
                      <button onClick={handleCopyKey} className="text-xs px-2 py-1 rounded" style={{ color: keyCopied ? '#00ff00' : '#ff660088', border: '1px solid #ff660033' }}>
                        {keyCopied ? '✅ ' + t(currentLang, 'keyCopied') : '📋 ' + t(currentLang, 'copyKey')}
                      </button>
                    </div>

                    {/* Warning */}
                    <div className="p-3 rounded-lg mb-4" style={{ background: 'rgba(255,0,0,0.08)', border: '1px solid #ff000033' }}>
                      <p className="text-xs font-bold" style={{ color: '#ff4444' }}>
                        ⚠️ {t(currentLang, 'neverShareKey')}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#ff444488' }}>
                        {currentLang === 'fr'
                          ? 'Ta cle est unique et personnelle. Le partage ou le vol de cle entraine un BAN immediat. Chaque requete est tracee et liee a ton compte.'
                          : 'Your key is unique and personal. Sharing or stealing keys results in immediate BAN. Every request is tracked and linked to your account.'}
                      </p>
                    </div>

                    {/* Revoke */}
                    <button onClick={handleRevokeKey} className="text-xs px-4 py-2 rounded" style={{ color: '#ff4444', border: '1px solid #ff444444' }}>
                      🗑️ {t(currentLang, 'revokeKey')}
                    </button>
                  </div>
                )}
              </div>

              {/* Rate limits */}
              <div className="rounded-xl border p-6" style={{ borderColor: '#ff660033', background: 'rgba(255,100,0,0.03)' }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: '#ff8c00' }}>⏱️ {t(currentLang, 'rateLimiting')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(255,100,0,0.05)', border: '1px solid #ff660022' }}>
                    <p className="text-xs font-bold" style={{ color: '#ff8c00' }}>FREE</p>
                    <p className="text-lg font-bold mt-1" style={{ color: '#ff660088' }}>100 req/jour</p>
                    <p className="text-xs mt-1" style={{ color: '#ff660044' }}>10 req/minute max</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(255,100,0,0.1)', border: '1px solid #ff660044' }}>
                    <p className="text-xs font-bold" style={{ color: '#ff8c00' }}>PRO - 5$/mois</p>
                    <p className="text-lg font-bold mt-1" style={{ color: '#ff8c00' }}>10,000 req/jour</p>
                    <p className="text-xs mt-1" style={{ color: '#ff660066' }}>100 req/minute max</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(255,100,0,0.15)', border: '1px solid #ff660066' }}>
                    <p className="text-xs font-bold" style={{ color: '#ff8c00' }}>OMEGA</p>
                    <p className="text-lg font-bold mt-1" style={{ color: '#ff8c00' }}>Illimite / Unlimited</p>
                    <p className="text-xs mt-1" style={{ color: '#ff660088' }}>Contact Agent Alex</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════ TAB: PLANS ═══════ */}
          {activeTab === 'plans' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* FREE */}
                <div className="rounded-xl border p-6" style={{ borderColor: '#ff660033', background: 'rgba(255,100,0,0.03)' }}>
                  <h3 className="text-2xl font-bold" style={{ color: '#ff660088' }}>{t(currentLang, 'freeplan')}</h3>
                  <p className="text-4xl font-black my-4" style={{ color: '#ff8c00' }}>0$<span className="text-sm" style={{ color: '#ff660066' }}>{t(currentLang, 'perMonth')}</span></p>
                  <ul className="space-y-2 text-xs" style={{ color: '#ff660088' }}>
                    <li>✅ Agent Alex - Acces de base</li>
                    <li>✅ Ti-Lex-Al - 20 messages/jour</li>
                    <li>✅ GPS Map - Canada & USA</li>
                    <li>✅ 100 requetes API/jour</li>
                    <li>❌ Outils avances</li>
                    <li>❌ Support prioritaire</li>
                  </ul>
                  <button className="w-full mt-6 py-2 rounded-lg text-sm font-bold" style={{ border: '1px solid #ff660044', color: '#ff660088' }}>
                    {t(currentLang, 'currentPlan')}
                  </button>
                </div>

                {/* PRO */}
                <div className="rounded-xl border-2 p-6 relative" style={{ borderColor: '#ff8c00', background: 'rgba(255,100,0,0.08)', boxShadow: '0 0 30px rgba(255,100,0,0.15)' }}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold" style={{ background: '#ff8c00', color: '#000' }}>POPULAIRE</div>
                  <h3 className="text-2xl font-bold" style={{ color: '#ff8c00' }}>{t(currentLang, 'proplan')}</h3>
                  <p className="text-4xl font-black my-4" style={{ color: '#ff8c00' }}>5$<span className="text-sm" style={{ color: '#ff660088' }}>{t(currentLang, 'perMonth')}</span></p>
                  <ul className="space-y-2 text-xs" style={{ color: '#ff8c00' }}>
                    <li>✅ Tout du plan Gratuit</li>
                    <li>✅ Agent Alex - Acces complet</li>
                    <li>✅ Ti-Lex-Al - Illimite</li>
                    <li>✅ GPS Map - Monde entier</li>
                    <li>✅ 10,000 requetes API/jour</li>
                    <li>✅ Outils avances (Code Breaker, etc.)</li>
                    <li>✅ Cle API personnelle</li>
                    <li>✅ Support prioritaire</li>
                  </ul>
                  <motion.button
                    className="w-full mt-6 py-3 rounded-lg text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg, #ff8c00, #ff4500)', color: '#000', boxShadow: '0 0 20px rgba(255,100,0,0.3)' }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {t(currentLang, 'subscribe')} 🔥
                  </motion.button>
                </div>

                {/* OMEGA */}
                <div className="rounded-xl border p-6" style={{ borderColor: '#ff000044', background: 'rgba(255,0,0,0.03)' }}>
                  <h3 className="text-2xl font-bold" style={{ color: '#ff4444' }}>OMEGA</h3>
                  <p className="text-4xl font-black my-4" style={{ color: '#ff4444' }}>25$<span className="text-sm" style={{ color: '#ff444488' }}>{t(currentLang, 'perMonth')}</span></p>
                  <ul className="space-y-2 text-xs" style={{ color: '#ff444488' }}>
                    <li>✅ Tout du plan Pro</li>
                    <li>✅ API Illimite</li>
                    <li>✅ Acces Alpha aux nouvelles fonctions</li>
                    <li>✅ Agent Alex - Mode Commandeur</li>
                    <li>✅ Maps haute resolution monde entier</li>
                    <li>✅ Support direct avec Alex</li>
                    <li>✅ Badge OMEGA exclusif</li>
                    <li>✅ Stockage chiffre illimite</li>
                  </ul>
                  <motion.button
                    className="w-full mt-6 py-3 rounded-lg text-sm font-bold"
                    style={{ border: '1px solid #ff4444', color: '#ff4444' }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Contact Agent Alex
                  </motion.button>
                </div>
              </div>

              {/* Payment security note */}
              <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(0,255,0,0.03)', border: '1px solid #00ff0022' }}>
                <p className="text-xs" style={{ color: '#00ff0088' }}>
                  🔒 {currentLang === 'fr'
                    ? 'Paiements securises par chiffrement AES-256. Aucune information de carte de credit n\'est stockee sur nos serveurs. Conforme PCI-DSS. Annulation possible en tout temps.'
                    : 'Payments secured by AES-256 encryption. No credit card information is stored on our servers. PCI-DSS compliant. Cancel anytime.'}
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══════ TAB: LEGAL ═══════ */}
          {activeTab === 'legal' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Terms of Service */}
              <div className="rounded-xl border p-6" style={{ borderColor: '#ff660033', background: 'rgba(255,100,0,0.03)' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: '#ff8c00' }}>⚖️ {t(currentLang, 'termsOfService')}</h2>
                <div className="space-y-3 text-xs" style={{ color: '#ff660088' }}>
                  <p><strong style={{ color: '#ff8c00' }}>1. Utilisation acceptable / Acceptable Use</strong><br />
                  Les services du Monde d'Alex sont fournis pour usage personnel et professionnel legitime uniquement. Toute utilisation abusive, frauduleuse ou illegale est strictement interdite. / Alex's World services are provided for legitimate personal and professional use only. Any abusive, fraudulent, or illegal use is strictly prohibited.</p>

                  <p><strong style={{ color: '#ff8c00' }}>2. Cles API / API Keys</strong><br />
                  Chaque utilisateur recoit une cle API unique et personnelle. Cette cle est non-transferable. Le partage, la revente ou le vol de cles API constitue une violation grave entrainant la suspension immediate du compte et un signalement aux autorites. / Each user receives a unique, personal API key. This key is non-transferable. Sharing, reselling, or stealing API keys constitutes a serious violation resulting in immediate account suspension and reporting to authorities.</p>

                  <p><strong style={{ color: '#ff8c00' }}>3. Protection financiere / Financial Protection</strong><br />
                  Le Monde d'Alex ne stocke AUCUNE information de carte de credit ou bancaire directement. Tous les paiements sont traites par des processeurs certifies PCI-DSS (Stripe/PayPal). Alex Marceau Prevost n'a aucun acces aux informations financieres des utilisateurs. / Alex's World does NOT store ANY credit card or banking information directly. All payments are processed by PCI-DSS certified processors (Stripe/PayPal). Alex Marceau Prevost has no access to users' financial information.</p>

                  <p><strong style={{ color: '#ff8c00' }}>4. Propriete intellectuelle / Intellectual Property</strong><br />
                  Tout le contenu, code, design et marque MARCEAU sont la propriete d'Alex Marceau Prevost. Toute reproduction non autorisee est interdite. / All content, code, design and MARCEAU brand are the property of Alex Marceau Prevost. Any unauthorized reproduction is prohibited.</p>

                  <p><strong style={{ color: '#ff8c00' }}>5. Limitation de responsabilite / Liability Limitation</strong><br />
                  Les services sont fournis "tels quels". Le Monde d'Alex n'est pas responsable des pertes de donnees, interruptions de service ou dommages indirects. / Services are provided "as is". Alex's World is not responsible for data loss, service interruptions, or indirect damages.</p>

                  <p><strong style={{ color: '#ff8c00' }}>6. Loi applicable / Governing Law</strong><br />
                  Ces conditions sont regies par les lois du Quebec, Canada, et les lois federales du Canada applicables. / These terms are governed by the laws of Quebec, Canada, and applicable federal laws of Canada.</p>
                </div>
              </div>

              {/* Privacy Policy */}
              <div className="rounded-xl border p-6" style={{ borderColor: '#ff660033', background: 'rgba(255,100,0,0.03)' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: '#ff8c00' }}>🔏 {t(currentLang, 'privacyPolicy')}</h2>
                <div className="space-y-3 text-xs" style={{ color: '#ff660088' }}>
                  <p><strong style={{ color: '#ff8c00' }}>Donnees collectees / Data Collected:</strong><br />
                  - Email (pour le compte) / Email (for account)<br />
                  - Cle API hashee / Hashed API key<br />
                  - Logs de requetes anonymises / Anonymized request logs<br />
                  - AUCUNE donnee financiere stockee / NO financial data stored</p>

                  <p><strong style={{ color: '#ff8c00' }}>Donnees NON collectees / Data NOT Collected:</strong><br />
                  - Numeros de carte de credit / Credit card numbers<br />
                  - Mots de passe en clair / Plain text passwords<br />
                  - Donnees de localisation precises / Precise location data<br />
                  - Informations personnelles sensibles / Sensitive personal information</p>

                  <p><strong style={{ color: '#ff8c00' }}>Droits de l'utilisateur / User Rights:</strong><br />
                  - Droit d'acces a vos donnees / Right to access your data<br />
                  - Droit de rectification / Right to correction<br />
                  - Droit a l'effacement (droit a l'oubli) / Right to erasure<br />
                  - Droit a la portabilite / Right to data portability<br />
                  - Droit d'opposition / Right to object</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════ TAB: SECURITY STANDARDS ═══════ */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Compliance standards grid */}
              <div className="rounded-xl border p-6" style={{ borderColor: '#ff660033', background: 'rgba(255,100,0,0.03)' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: '#ff8c00' }}>🏛️ {t(currentLang, 'compliance')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {COMPLIANCE_STANDARDS.map((std) => (
                    <div key={std.name} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,100,0,0.05)', border: '1px solid #ff660022' }}>
                      <span className="text-2xl">{std.icon}</span>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#ff8c00' }}>{std.name}</p>
                        <p className="text-xs" style={{ color: '#ff660066' }}>{std.region}</p>
                        <p className="text-xs mt-1" style={{ color: '#ff660088' }}>{std.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security measures */}
              <div className="rounded-xl border p-6" style={{ borderColor: '#ff660033', background: 'rgba(255,100,0,0.03)' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: '#ff8c00' }}>🛡️ {t(currentLang, 'dataProtection')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs" style={{ color: '#ff660088' }}>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(0,255,0,0.03)', border: '1px solid #00ff0022' }}>
                    <p className="font-bold" style={{ color: '#00ff00' }}>🔐 Chiffrement / Encryption</p>
                    <p className="mt-1">AES-256 au repos / at rest</p>
                    <p>TLS 1.3 en transit / in transit</p>
                    <p>Cles API hashees avec bcrypt / API keys hashed with bcrypt</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(0,255,0,0.03)', border: '1px solid #00ff0022' }}>
                    <p className="font-bold" style={{ color: '#00ff00' }}>🔥 Pare-feu / Firewall</p>
                    <p className="mt-1">WAF (Web Application Firewall)</p>
                    <p>DDoS Protection</p>
                    <p>IP Rate Limiting automatique</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(0,255,0,0.03)', border: '1px solid #00ff0022' }}>
                    <p className="font-bold" style={{ color: '#00ff00' }}>📋 Audit / Logging</p>
                    <p className="mt-1">Logs immutables / Immutable logs</p>
                    <p>Alertes en temps reel / Real-time alerts</p>
                    <p>Retention 90 jours / 90-day retention</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(0,255,0,0.03)', border: '1px solid #00ff0022' }}>
                    <p className="font-bold" style={{ color: '#00ff00' }}>🔄 Backup</p>
                    <p className="mt-1">Sauvegardes chiffrees quotidiennes / Daily encrypted backups</p>
                    <p>3 zones geographiques / 3 geographic zones</p>
                    <p>Restauration en moins de 1h / Recovery under 1h</p>
                  </div>
                </div>
              </div>

              {/* Ban policy */}
              <div className="rounded-xl border p-6" style={{ borderColor: '#ff000033', background: 'rgba(255,0,0,0.03)' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: '#ff4444' }}>⛔ {t(currentLang, 'banPolicy')}</h2>
                <p className="text-xs mb-4" style={{ color: '#ff660088' }}>
                  {currentLang === 'fr'
                    ? '2 telecharge sur support = BAN. Le systeme detecte automatiquement les abus. Zero tolerance pour le vol de cles ou la fraude.'
                    : '2 downloads on support = BAN. The system automatically detects abuse. Zero tolerance for key theft or fraud.'}
                </p>
                <div className="space-y-2">
                  {BAN_RULES.map((rule, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid #ff000022' }}>
                      <span className="text-xl">{rule.icon}</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold" style={{ color: '#ff660088' }}>{rule.offense}</p>
                      </div>
                      <p className="text-xs font-bold" style={{ color: '#ff4444' }}>{rule.action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report abuse */}
              <div className="rounded-xl border p-4 text-center" style={{ borderColor: '#ff660033' }}>
                <p className="text-sm" style={{ color: '#ff8c00' }}>
                  🚨 {t(currentLang, 'reportAbuse')}: <span style={{ color: '#ff4444' }}>security@marceau-world.io</span>
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Scanlines */}
        <div className="fixed inset-0 pointer-events-none z-50" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 6px)' }} />
      </div>
    </>
  )
}

SecurityPage.getLayout = (page: any) => page

export default SecurityPage
