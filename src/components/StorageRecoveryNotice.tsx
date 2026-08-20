type Props = {
  onDismiss: () => void
}

export function StorageRecoveryNotice({ onDismiss }: Props) {
  return (
    <p role="status" data-testid="storage-recovery-notice">
      Your saved data couldn't be read, so example data was loaded instead.
      <button type="button" onClick={onDismiss}>
        Dismiss
      </button>
    </p>
  )
}
