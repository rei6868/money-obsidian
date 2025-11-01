import { FiTrash2, FiX } from 'react-icons/fi';
import styles from '../../styles/TransactionsHistory.module.css';

export function SelectionActionBar({
  selectedCount = 0,
  onDelete,
  onCancel,
}) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className={styles.selectionToolbar} data-testid="transactions-selection-toolbar">
      <span className={styles.selectionCount} data-testid="transactions-selection-count">
        {selectedCount} selected
      </span>
      <div className={styles.selectionActions}>
        {onDelete && (
          <button
            type="button"
            className={styles.selectionActionButton}
            data-action="delete"
            onClick={onDelete}
            aria-label={`Delete ${selectedCount} selected transaction${selectedCount !== 1 ? 's' : ''}`}
          >
            <FiTrash2 aria-hidden />
            <span>Delete</span>
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            className={styles.selectionActionButton}
            data-action="cancel"
            onClick={onCancel}
            aria-label="Clear selection"
          >
            <FiX aria-hidden />
            <span>Cancel</span>
          </button>
        )}
      </div>
    </div>
  );
}
