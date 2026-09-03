import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you absolutely sure?',
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isLoading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-5">
        <div className="flex gap-3 items-start">
          <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/10 rounded-lg shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
