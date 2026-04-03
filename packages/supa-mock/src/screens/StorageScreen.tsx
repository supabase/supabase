import {
  ArrowDownNarrowWide,
  Book,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  File,
  FolderClosed,
  FolderOpen,
  Image,
  Link2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  cn,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

// ─── Storage Menu ───────────────────────────────────────────────────────

interface StorageMenuItem {
  name: string
  key: string
  label?: string
  disabled?: boolean
}

interface StorageMenuGroup {
  title: string
  items: StorageMenuItem[]
}

const STORAGE_MENU: StorageMenuGroup[] = [
  {
    title: 'Manage',
    items: [
      { name: 'Files', key: 'files' },
      { name: 'Analytics', key: 'analytics', label: 'New', disabled: true },
      { name: 'Vectors', key: 'vectors', label: 'New', disabled: true },
    ],
  },
  {
    title: 'Configuration',
    items: [{ name: 'S3', key: 's3' }],
  },
]

// ─── Mock Buckets ───────────────────────────────────────────────────────

interface MockBucket {
  id: string
  isPublic: boolean
  policies: number
  fileSizeLimit: string
  allowedMimeTypes: string
  folders: string[]
  files: MockFile[]
}

interface MockFile {
  name: string
  type: string
  size: string
  created: string
}

const FILE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif']

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function generateFiles(count: number): MockFile[] {
  return Array.from({ length: count }, (_, i) => {
    const ts = 1759544213500 + i * 3721847
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let hash = ''
    for (let j = 0; j < 10; j++) {
      hash += chars[Math.floor(seededRandom(i * 100 + j) * chars.length)]
    }
    const ext = FILE_EXTENSIONS[Math.floor(seededRandom(i * 7) * FILE_EXTENSIONS.length)]
    const sizeKb = (seededRandom(i * 13) * 200 + 20).toFixed(2)
    return {
      name: `${ts}-${hash}.${ext}`,
      type: ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      size: `${sizeKb} KB`,
      created: `10/${(i % 28) + 1}/2025, ${10 + (i % 12)}:${String(i % 60).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')} PM`,
    }
  })
}

const MOCK_BUCKETS: MockBucket[] = [
  {
    id: 'uploads',
    isPublic: true,
    policies: 0,
    fileSizeLimit: '100 MB',
    allowedMimeTypes: 'image/png, image/jpeg, image/webp, video/mp4',
    folders: ['thumbnails', 'originals'],
    files: generateFiles(15),
  },
  {
    id: 'assets',
    isPublic: true,
    policies: 4,
    fileSizeLimit: '100 MB',
    allowedMimeTypes: 'image/png, image/jpeg',
    folders: ['avatars'],
    files: generateFiles(28),
  },
  {
    id: 'media',
    isPublic: true,
    policies: 4,
    fileSizeLimit: '100 MB',
    allowedMimeTypes: 'Any',
    folders: ['videos', 'documents'],
    files: generateFiles(10),
  },
]

// ─── Bucket Detail View ─────────────────────────────────────────────────

function BucketDetailView({ bucket, onBack }: { bucket: MockBucket; onBack: () => void }) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(bucket.folders[0] ?? null)
  const [selectedFile, setSelectedFile] = useState<MockFile | null>(null)

  return (
    <div className="flex flex-col h-full w-full">
      {/* Breadcrumb bar */}
      <div className="flex min-h-[46px] items-center justify-between px-4 py-2 border-b border-default flex-shrink-0">
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={onBack}
            className="text-foreground-light hover:text-foreground transition-colors"
          >
            Files
          </button>
          <ChevronRight size={10} strokeWidth={1.5} className="text-foreground-muted" />
          <button
            onClick={onBack}
            className="text-foreground-light hover:text-foreground transition-colors"
          >
            Buckets
          </button>
          <ChevronRight size={10} strokeWidth={1.5} className="text-foreground-muted" />
          <span className="text-foreground">{bucket.id}</span>
          {bucket.isPublic && (
            <Badge variant="warning" className="ml-1">
              Public
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="default" size="tiny">
            Policies {bucket.policies}
          </Button>
          <Button
            type="default"
            size="tiny"
            iconRight={<ChevronRight size={12} strokeWidth={1.5} className="rotate-90" />}
          >
            Edit bucket
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex min-h-[46px] pl-2 items-center justify-between border-b border-overlay bg-surface-100 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (selectedFolder) setSelectedFolder(null)
              else onBack()
            }}
            className="p-1.5 text-foreground-light hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <span className="text-sm text-foreground">{selectedFolder ?? bucket.id}</span>
        </div>
        <div className="flex items-center">
          <div className="flex items-center border-l border-control px-2 gap-1">
            <Button type="text" size="tiny" icon={<RefreshCw size={14} strokeWidth={1.5} />}>
              Reload
            </Button>
            <Button type="text" size="tiny">
              View
            </Button>
          </div>
          <div className="flex items-center border-l border-control px-2 gap-1">
            <Button type="text" size="tiny" icon={<Upload size={14} strokeWidth={1.5} />}>
              Upload files
            </Button>
            <Button type="text" size="tiny" icon={<FolderOpen size={14} strokeWidth={1.5} />}>
              Create folder
            </Button>
          </div>
          <div className="flex items-center border-l border-control px-2">
            <button className="p-1.5 text-foreground-light hover:text-foreground">
              <Search size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel - Folders */}
        <div className="w-40 min-w-40 border-r border-overlay flex flex-col overflow-y-auto flex-shrink-0">
          {bucket.folders.map((folder) => {
            const isActive = selectedFolder === folder
            return (
              <button
                key={folder}
                onClick={() => {
                  setSelectedFolder(folder)
                  setSelectedFile(null)
                }}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 text-sm w-full text-left transition-colors',
                  isActive ? 'bg-selection' : 'hover:bg-surface-200'
                )}
              >
                <FolderClosed
                  size={14}
                  strokeWidth={1.5}
                  className="text-foreground-muted flex-shrink-0"
                />
                <span
                  className={cn('truncate', isActive ? 'text-foreground' : 'text-foreground-light')}
                >
                  {folder}
                </span>
              </button>
            )
          })}
        </div>

        {/* Middle panel - Files */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          {bucket.files.map((file, i) => {
            const isActive = selectedFile === file
            return (
              <button
                key={i}
                onClick={() => setSelectedFile(file)}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 text-sm w-full text-left border-b border-default transition-colors flex-shrink-0',
                  isActive ? 'bg-selection' : 'hover:bg-surface-200'
                )}
              >
                <Image
                  size={14}
                  strokeWidth={1.5}
                  className="text-foreground-muted flex-shrink-0"
                />
                <span
                  className={cn('truncate', isActive ? 'text-foreground' : 'text-foreground-light')}
                >
                  {file.name}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right panel - Preview */}
        {selectedFile && (
          <div className="w-64 min-w-64 border-l border-overlay bg-surface-100 p-4 overflow-y-auto flex-shrink-0">
            {/* Close button */}
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setSelectedFile(null)}
                className="text-foreground-light hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            {/* Preview placeholder */}
            <div className="h-36 rounded border border-overlay bg-surface-300 flex items-center justify-center mb-4">
              <File size={32} strokeWidth={1} className="text-foreground-muted" />
            </div>

            {/* File info */}
            <div className="space-y-1 mb-4">
              <p className="text-sm text-foreground font-medium break-words">{selectedFile.name}</p>
              <p className="text-xs text-foreground-light">
                {selectedFile.type} - {selectedFile.size}
              </p>
            </div>

            {/* Metadata */}
            <div className="space-y-3 mb-4 border-b border-overlay pb-4">
              <div>
                <p className="text-xs text-foreground-lighter">Added on</p>
                <p className="text-xs text-foreground">{selectedFile.created}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-lighter">Last modified</p>
                <p className="text-xs text-foreground">{selectedFile.created}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-3">
              <Button type="default" size="tiny" icon={<Download size={14} strokeWidth={1.5} />}>
                Download
              </Button>
              <Button type="default" size="tiny" icon={<Link2 size={14} strokeWidth={1.5} />}>
                Get URL
              </Button>
            </div>
            <Button type="default" size="tiny" icon={<Trash2 size={14} strokeWidth={1.5} />}>
              Delete file
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Buckets Content ────────────────────────────────────────────────────

function BucketsContent({ onOpenBucket }: { onOpenBucket: (bucket: MockBucket) => void }) {
  const [activeTab, setActiveTab] = useState('buckets')

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-10 py-8">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-2xl">Files</h2>
            <p className="text-sm text-foreground-light mt-1">
              General file storage for most types of digital content
            </p>
          </div>
          <Button type="default" size="tiny">
            Docs
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-default mt-6 mb-8">
          {[
            { label: 'Buckets', key: 'buckets' },
            { label: 'Settings', key: 'settings', disabled: true },
            { label: 'Policies', key: 'policies', disabled: true },
          ].map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => !tab.disabled && setActiveTab(tab.key)}
                className={cn(
                  'pb-2 text-sm transition-colors border-b-2 -mb-px',
                  tab.disabled
                    ? 'opacity-50 cursor-default pointer-events-none border-transparent text-foreground-light'
                    : isActive
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-foreground-light hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'buckets' && (
          <>
            {/* Search + Sort + New Bucket */}
            <div className="flex justify-between items-center mb-4 gap-x-2">
              <div className="flex items-center gap-x-2">
                <div className="relative">
                  <Search
                    size={14}
                    strokeWidth={1.5}
                    className="absolute left-2.5 top-0 bottom-0 my-auto text-foreground-muted"
                  />
                  <input
                    type="text"
                    placeholder="Search for a bucket"
                    className="h-[26px] text-xs pl-8 pr-3 w-52 rounded border border-default bg-control text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-foreground-muted"
                  />
                </div>
                <Button
                  type="default"
                  size="tiny"
                  icon={<ArrowDownNarrowWide size={14} strokeWidth={1.5} />}
                >
                  Sorted by created at
                </Button>
              </div>
              <Button type="primary" size="tiny" icon={<Plus size={14} strokeWidth={1.5} />}>
                New bucket
              </Button>
            </div>

            {/* Buckets Table */}
            <div className="rounded-md border border-default overflow-hidden">
              <table className="w-full mt-0">
                <thead>
                  <tr className="bg-surface-200">
                    <th className="text-left text-xs font-mono uppercase text-foreground-lighter px-4 py-2 w-8">
                      <span className="sr-only">Icon</span>
                    </th>
                    <th className="text-left text-xs font-mono uppercase text-foreground-lighter px-4 py-2">
                      Name
                    </th>
                    <th className="text-left text-xs font-mono uppercase text-foreground-lighter px-4 py-2">
                      Policies
                    </th>
                    <th className="text-left text-xs font-mono uppercase text-foreground-lighter px-4 py-2 w-40">
                      File size limit
                    </th>
                    <th className="text-left text-xs font-mono uppercase text-foreground-lighter px-4 py-2">
                      Allowed MIME types
                    </th>
                    <th className="w-10 px-4 py-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_BUCKETS.map((bucket) => (
                    <tr
                      key={bucket.id}
                      onClick={() => onOpenBucket(bucket)}
                      className="cursor-pointer h-16 group border-t border-default hover:bg-surface-100 transition-colors"
                    >
                      <td className="px-4">
                        <FolderOpen size={16} strokeWidth={1.5} className="text-foreground-muted" />
                      </td>
                      <td className="px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm text-foreground whitespace-nowrap">
                            {bucket.id}
                          </span>
                          {bucket.isPublic && <Badge variant="warning">Public</Badge>}
                        </div>
                      </td>
                      <td className="px-4">
                        <span className="text-sm text-foreground-light">{bucket.policies}</span>
                      </td>
                      <td className="px-4">
                        <span className="text-sm text-foreground-light whitespace-nowrap">
                          {bucket.fileSizeLimit}
                        </span>
                      </td>
                      <td className="px-4">
                        <span className="text-sm text-foreground-light">
                          {bucket.allowedMimeTypes}
                        </span>
                      </td>
                      <td className="px-4">
                        <div className="flex justify-end items-center h-full">
                          <ChevronRight
                            size={14}
                            strokeWidth={1.5}
                            className="text-foreground-muted/60"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab !== 'buckets' && (
          <div className="flex items-center justify-center py-20">
            <p className="text-foreground-lighter text-sm">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── S3 Configuration ───────────────────────────────────────────────────

function CopyInput({ value }: { value: string }) {
  return (
    <div className="flex items-center rounded-md border border-default bg-surface-300 h-8 overflow-hidden">
      <input
        name={value}
        readOnly
        value={value}
        className="flex-1 bg-transparent text-sm text-foreground-light pl-2 border-none !outline-none !shadow-none font-mono min-w-0"
      />
      <button className="flex items-center gap-1.5 px-3 h-full text-foreground-light hover:text-foreground border-l border-default transition-colors flex-shrink-0 bg-surface-200">
        <Copy size={12} strokeWidth={1.5} />
        <span className="text-sm">Copy</span>
      </button>
    </div>
  )
}

function S3Content() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1200px] w-full px-6 xl:px-10">
        {/* Page Title */}
        <div className="pt-12 pb-4">
          <h1 className="text-2xl">S3 Configuration</h1>
        </div>

        {/* Connection Section */}
        <div className="pt-12 last:pb-12 flex flex-col gap-6">
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg">Connection</h2>
              <p className="text-sm text-foreground-light">
                Connect to your bucket using any S3-compatible service via the S3 protocol
              </p>
            </div>
            <Button type="default" size="tiny" icon={<Book size={14} strokeWidth={1.5} />}>
              Docs
            </Button>
          </div>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-foreground">S3 protocol connection</span>
                  <span className="text-sm text-foreground-light">
                    Allow clients to connect to Supabase Storage via the S3 protocol
                  </span>
                </div>
                <Switch size="large" checked={true} />
              </div>
            </CardContent>

            <CardContent>
              <div className="flex items-center justify-between gap-8">
                <span className="text-sm text-foreground whitespace-nowrap">Endpoint</span>
                <div className="md:w-1/2 min-w-[400px]">
                  <CopyInput value="https://cjbjbsewfrtljaqgycbu.storage.supabase.co/storage/v1/s3" />
                </div>
              </div>
            </CardContent>

            <CardContent>
              <div className="flex items-center justify-between gap-8">
                <span className="text-sm text-foreground whitespace-nowrap">Region</span>
                <div className="md:w-1/2 min-w-[400px]">
                  <CopyInput value="us-east-1" />
                </div>
              </div>
            </CardContent>

            <CardFooter className="justify-end">
              <Button type="primary" size="small">
                Save
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Access Keys Section */}
        <div className="pt-12 last:pb-12 flex flex-col gap-6">
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg">Access keys</h2>
              <p className="text-sm text-foreground-light">
                Manage your access keys for this project
              </p>
            </div>
            <Button type="default" size="tiny" icon={<Plus size={14} strokeWidth={1.5} />}>
              New access key
            </Button>
          </div>

          <Card>
            <Table className="mt-0">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key ID</TableHead>
                  <TableHead>Created at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={3} className="!rounded-b-md overflow-hidden">
                    <p className="text-sm text-foreground">No access keys created</p>
                    <p className="text-sm text-foreground-light">
                      There are no access keys associated with your project yet
                    </p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Storage Screen ─────────────────────────────────────────────────────

export function StorageScreen() {
  const [activeKey, setActiveKey] = useState('files')
  const [openBucket, setOpenBucket] = useState<MockBucket | null>(null)

  return (
    <div className="flex h-full w-full">
      {/* Product Menu / Sub-navbar */}
      <div
        className={cn(
          'flex flex-col h-full',
          'hide-scrollbar bg-dash-sidebar border-default border-r',
          'w-64 min-w-64 max-w-64'
        )}
      >
        {/* Title */}
        <div className="border-default flex min-h-[46px] items-center border-b px-6">
          <h4 className="text-lg">Storage</h4>
        </div>

        {/* Menu */}
        <div className="flex flex-col space-y-8 overflow-y-auto">
          {STORAGE_MENU.map((group, groupIdx) => (
            <div key={group.title}>
              <div className="my-6 space-y-8">
                <div className="mx-3">
                  <div className="flex space-x-3 mb-2 font-normal px-3">
                    <span className="text-sm text-foreground-lighter w-full uppercase font-mono">
                      {group.title}
                    </span>
                  </div>
                  <div>
                    {group.items.map((item) => {
                      const isActive = activeKey === item.key
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            if (!item.disabled) {
                              setActiveKey(item.key)
                              setOpenBucket(null)
                            }
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 text-left px-3 py-1 text-sm transition group',
                            item.disabled
                              ? 'opacity-50 cursor-default pointer-events-none'
                              : 'cursor-pointer',
                            isActive
                              ? 'font-semibold bg-surface-200 text-foreground rounded-md'
                              : 'font-normal text-foreground-light hover:text-foreground'
                          )}
                        >
                          <div className="flex w-full items-center justify-between gap-1">
                            <span className="truncate flex-1 min-w-0">{item.name}</span>
                            {item.label && (
                              <Badge className="flex-shrink-0" variant="success">
                                {item.label}
                              </Badge>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              {groupIdx !== STORAGE_MENU.length - 1 && <div className="h-px w-full bg-border" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {activeKey === 'files' ? (
          openBucket ? (
            <BucketDetailView bucket={openBucket} onBack={() => setOpenBucket(null)} />
          ) : (
            <BucketsContent onOpenBucket={setOpenBucket} />
          )
        ) : activeKey === 's3' ? (
          <S3Content />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-foreground-lighter text-sm">
              {STORAGE_MENU.flatMap((g) => g.items).find((i) => i.key === activeKey)?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
