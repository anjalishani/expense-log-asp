type Props = {
  onClear: () => void
}

export function ClearDataButton({ onClear }: Props) {
  function handleClick() {
    if (window.confirm('Clear all expenses and limits? This cannot be undone.')) {
      onClear()
    }
  }

  return (
    <button type="button" onClick={handleClick}>
      Clear all data
    </button>
  )
}
