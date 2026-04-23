import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchInputProps {
  value: string
  onSearch: (query: string) => void
  suggestions?: string[]
}

export function SearchInput({ value, onSearch, suggestions = [] }: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = inputValue.trim().length > 0
    ? suggestions
        .filter((s) => s.toLowerCase().includes(inputValue.toLowerCase().trim()))
        .slice(0, 6)
    : []

  const handleSubmit = (val = inputValue) => {
    onSearch(val.trim())
    setShowSuggestions(false)
    setActiveIndex(-1)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setShowSuggestions(true)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && filtered[activeIndex]) {
        setInputValue(filtered[activeIndex])
        handleSubmit(filtered[activeIndex])
      } else {
        handleSubmit()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveIndex(-1)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    handleSubmit(suggestion)
  }

  return (
    <div className="relative flex gap-2" ref={containerRef} data-testid="search-input">
      <div className="relative">
        <Input
          type="search"
          placeholder="Search tasks…"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.trim().length > 0 && setShowSuggestions(true)}
          className="w-72"
          autoComplete="off"
          data-testid="search-input-field"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && filtered.length > 0 && (
          <ul
            className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-white shadow-lg overflow-hidden"
            role="listbox"
            data-testid="search-suggestions"
          >
            {filtered.map((suggestion, i) => (
              <li
                key={suggestion}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={() => handleSuggestionClick(suggestion)}
                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                  i === activeIndex
                    ? 'bg-violet-50 text-violet-700'
                    : 'hover:bg-muted'
                }`}
              >
                <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                {/* Highlight matching part */}
                <span>
                  {highlightMatch(suggestion, inputValue.trim())}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleSubmit()}
        data-testid="search-input-button"
      >
        <Search className="h-4 w-4" />
        <span className="ml-1">Search</span>
      </Button>
    </div>
  )
}

function highlightMatch(text: string, query: string) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-violet-100 text-violet-800 rounded px-0.5 not-italic font-medium">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
