import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { DeleteSnippetsModal } from './DeleteSnippetsModal'
import { ShareSnippetModal } from './ShareSnippetModal'
import { UnshareSnippetModal } from './UnshareSnippetModal'
import { DownloadSnippetModal } from '@/components/interfaces/SQLEditor/DownloadSnippetModal'
import { MoveQueryModal } from '@/components/interfaces/SQLEditor/MoveQueryModal'
import { RenameQueryModal } from '@/components/interfaces/SQLEditor/RenameQueryModal'
import { Snippet, SnippetFolder } from '@/data/content/sql-folders-query'

interface SnippetActionModalsProps {
  selectedSnippets: Snippet[]
  selectedSnippetToRename?: Snippet
  selectedSnippetToDownload?: Snippet
  selectedSnippetToShare?: Snippet
  selectedSnippetToUnshare?: Snippet
  selectedFolderToDelete?: SnippetFolder
  showRenameModal: boolean
  showMoveModal: boolean
  showDeleteModal: boolean
  isDeletingFolder: boolean
  onRenameClose: () => void
  onMoveClose: () => void
  onDownloadClose: () => void
  onShareClose: () => void
  onShareSuccess: () => void
  onUnshareClose: () => void
  onUnshareSuccess: () => void
  onDeleteClose: () => void
  onFolderDeleteCancel: () => void
  onFolderDeleteConfirm: () => void
}

export const SnippetActionModals = ({
  selectedSnippets,
  selectedSnippetToRename,
  selectedSnippetToDownload,
  selectedSnippetToShare,
  selectedSnippetToUnshare,
  selectedFolderToDelete,
  showRenameModal,
  showMoveModal,
  showDeleteModal,
  isDeletingFolder,
  onRenameClose,
  onMoveClose,
  onDownloadClose,
  onShareClose,
  onShareSuccess,
  onUnshareClose,
  onUnshareSuccess,
  onDeleteClose,
  onFolderDeleteCancel,
  onFolderDeleteConfirm,
}: SnippetActionModalsProps) => (
  <>
    <RenameQueryModal
      snippet={selectedSnippetToRename}
      visible={showRenameModal}
      onCancel={onRenameClose}
      onComplete={onRenameClose}
    />

    <MoveQueryModal snippets={selectedSnippets} visible={showMoveModal} onClose={onMoveClose} />

    <DownloadSnippetModal
      id={selectedSnippetToDownload?.id ?? ''}
      open={selectedSnippetToDownload !== undefined}
      onOpenChange={onDownloadClose}
    />

    <ShareSnippetModal
      snippet={selectedSnippetToShare}
      onClose={onShareClose}
      onSuccess={onShareSuccess}
    />

    <UnshareSnippetModal
      snippet={selectedSnippetToUnshare}
      onClose={onUnshareClose}
      onSuccess={onUnshareSuccess}
    />

    <DeleteSnippetsModal
      visible={showDeleteModal}
      snippets={selectedSnippets}
      onClose={onDeleteClose}
    />

    <ConfirmationModal
      size="small"
      title="Confirm to delete folder"
      confirmLabel="Delete folder"
      confirmLabelLoading="Deleting folder"
      loading={isDeletingFolder}
      visible={selectedFolderToDelete !== undefined}
      variant="destructive"
      onCancel={onFolderDeleteCancel}
      onConfirm={onFolderDeleteConfirm}
      alert={{
        title: 'This action cannot be undone',
        description:
          'All SQL snippets within the folder will be permanently removed, and cannot be recovered.',
      }}
    >
      <p className="text-sm">
        Are you sure you want to delete the folder '{selectedFolderToDelete?.name}'?
      </p>
    </ConfirmationModal>
  </>
)
