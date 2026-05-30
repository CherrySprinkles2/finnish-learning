import { useState, useRef } from 'react'

interface Props {
  chips: string[]
  onChange: (chips: string[]) => void
  placeholder?: string
}

export default function ChipEditor({ chips, onChange, placeholder = 'Add…' }: Props) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function commit() {
    const val = input.trim()
    if (val && !chips.map(c => c.toLowerCase()).includes(val.toLowerCase())) {
      onChange([...chips, val])
    }
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    if (e.key === 'Backspace' && input === '' && chips.length > 0) {
      onChange(chips.slice(0, -1))
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1 border border-focus rounded-xs px-2 py-1.5 min-h-[36px] cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {chips.map((chip, i) => (
        <span key={i} className="flex items-center gap-1 bg-accent-subtle text-accent-emphasis text-xs font-medium px-2 py-0.5 rounded-xs">
          {chip}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(chips.filter((_, j) => j !== i)) }}
            className="text-accent hover:text-danger leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={chips.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] focus:outline-none text-xs bg-transparent"
      />
    </div>
  )
}
