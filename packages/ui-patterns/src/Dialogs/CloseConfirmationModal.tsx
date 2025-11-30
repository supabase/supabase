"use client"
import ConfirmationModal from "./ConfirmationModal"

export interface ConfirmOnCloseModalProps {
    visible: boolean;
    onClose: () => void;
    onCancel: () => void;
    description?: string;
}

export default function CloseConfirmationModal({
    visible,
    onClose,
    onCancel,
    description = "There are unsaved changes. Are you sure you want to close the panel? Your changes will be lost."
}: ConfirmOnCloseModalProps) {
    return (
        <ConfirmationModal
            visible={visible}
            title="Discard changes"
            confirmLabel="Discard"
            onCancel={onCancel}
            onConfirm={onClose}
        >
            <p className="text-sm text-foreground-light">
                {description}
            </p>
        </ConfirmationModal>
    )
}