import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { useGetSuggestionsQuery } from '@/store/api/tasksApi'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onSearch: (query: string) => void
}

const DEBOUNCE_MS = 300

export function SearchInput({ value, onSearch }: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value)
  const [debouncedQuery, setDebouncedQuery] = useState(value)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync external value (e.g. cleared from filter chips)
  useEffect(() => {
    setInputValue(value)
    setDebouncedQuery(value)
  }, [value])

  // Debounce: update debouncedQuery after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(inputValue)
      // Trigger live search as user types
      onSearch(inputValue.trim())
    }, DEBOUNCE_MS)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue])

  // Fetch suggestions from backend (skip if query too short)
  const { data: suggestions = [], isFetching } = useGetSuggestionsQuery(debouncedQuery, {
    skip: debouncedQuery.trim().length < 2,
  })

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setShowSuggestions(true)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        selectSuggestion(suggestions[activeIndex])
      } else {
        setShowSuggestions(false)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveIndex(-1)
    }
  }

  const selectSuggestion = (s: string) => {
    setInputValue(s)
    setDebouncedQuery(s)
    setShowSuggestions(false)
    setActiveIndex(-1)
    onSearch(s)
  }

  const handleClear = () => {
    setInputValue('')
    setDebouncedQuery('')
    setShowSuggestions(false)
    onSearch('')
  }

  const showDropdown = showSuggestions && debouncedQuery.trim().length >= 2 && suggestions.length > 0

  return (
    <div className="relative w-full max-w-md" ref={containerRef} data-testid="search-input">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search tasks…"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.trim().length >= 2 && setShowSuggestions(true)}
          className="pl-9 pr-9"
          autoComplete="off"
          data-testid="search-input-field"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {isFetching
            ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            : inputValue && (
              <button onClick={handleClear} aria-label="Clear search" className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )
          }
        </div>
      </div>

      {showDropdown && (
        <ul
          className="absolute top-full left-0 z-50 mt-1 w-full rounded-xl border bg-white shadow-lg shadow-violet-100/50 overflow-hidden"
          role="listbox"
          data-testid="search-suggestions"
        >
          {suggestions.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => selectSuggestion(s)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer transition-colors',
                i === activeIndex ? 'bg-violet-50 text-violet-700' : 'hover:bg-muted/60',
              )}
            >
              <Search className="h-3 w-3 text-muted-foreground shrink-0" />
              <span>{highlightMatch(s, debouncedQuery.trim())}</span>
            </li>
          ))}
        </ul>
      )}
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
