import React, { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '../lib/utils'

const TerminalPane = ({ output, onCommand, isNgspiceReady }) => {
  const terminalRef = useRef(null)
  const inputRef = useRef(null)
  const [currentInput, setCurrentInput] = useState('')
  const [commandHistory, setCommandHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  useEffect(() => {
    // Auto-scroll to bottom when new output is added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  // Focus input when terminal is clicked
  const handleTerminalClick = useCallback(() => {
    if (inputRef.current && isNgspiceReady) {
      inputRef.current.focus()
    }
  }, [isNgspiceReady])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (currentInput.trim()) {
          // Add to history
          setCommandHistory((prev) => [...prev, currentInput])
          setHistoryIndex(-1)

          // Send command to ngspice
          onCommand?.(currentInput)

          // Clear input
          setCurrentInput('')
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (commandHistory.length > 0) {
          const newIndex =
            historyIndex === -1
              ? commandHistory.length - 1
              : Math.max(0, historyIndex - 1)
          setHistoryIndex(newIndex)
          setCurrentInput(commandHistory[newIndex])
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (historyIndex >= 0) {
          const newIndex = historyIndex + 1
          if (newIndex >= commandHistory.length) {
            setHistoryIndex(-1)
            setCurrentInput('')
          } else {
            setHistoryIndex(newIndex)
            setCurrentInput(commandHistory[newIndex])
          }
        }
      } else if (e.key === 'Tab') {
        e.preventDefault()
        // Basic command completion for common ngspice commands
        const commonCommands = [
          'run',
          'plot',
          'print',
          'show',
          'quit',
          'exit',
          'help',
          'tran',
          'ac',
          'dc',
          'op',
          'noise',
          'alter',
          'let',
          'set',
        ]
        const matches = commonCommands.filter((cmd) =>
          cmd.startsWith(currentInput.toLowerCase())
        )
        if (matches.length === 1) {
          setCurrentInput(matches[0])
        }
      }
    },
    [currentInput, commandHistory, historyIndex, onCommand]
  )

  return (
    <div
      className="h-full w-full bg-gray-900 text-gray-100 font-mono text-sm overflow-hidden rounded-b-lg terminal cursor-text relative"
      style={{
        fontFamily: 'var(--font-apple-mono)',
        background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
      }}
      onClick={handleTerminalClick}
    >
      <div ref={terminalRef} className="h-full p-3 overflow-y-auto">
        {output.map((line, index) => (
          <div
            key={index}
            className={cn(
              'whitespace-pre-wrap break-words leading-tight text-xs',
              // System messages
              line.startsWith('>') &&
                'text-blue-300 font-medium pl-1 border-l-2 border-blue-500 border-opacity-30 ml-1',
              // User commands (ngspice prompt)
              line.startsWith('ngspice>') &&
                'text-green-300 font-medium bg-gray-800 bg-opacity-30 px-2 py-0.5 rounded-sm my-0.5',
              // Error messages
              line.toLowerCase().includes('error') &&
                'text-red-300 font-medium bg-red-900 bg-opacity-20 px-2 py-0.5 rounded-sm border-l-2 border-red-500',
              // Warning messages
              line.toLowerCase().includes('warning') &&
                'text-yellow-300 font-medium bg-yellow-900 bg-opacity-20 px-2 py-0.5 rounded-sm border-l-2 border-yellow-500',
              // Success messages
              line.toLowerCase().includes('success') &&
                'text-green-300 font-medium bg-green-900 bg-opacity-20 px-2 py-0.5 rounded-sm border-l-2 border-green-500',
              // Analysis commands and results
              (line.includes('analysis') || line.includes('Analysis')) &&
                'text-cyan-300',
              // Variable listings
              line.includes('=') &&
                !line.startsWith('>') &&
                !line.startsWith('ngspice>') &&
                'text-gray-300 font-mono pl-4',
              // Regular output
              !line.startsWith('>') &&
                !line.startsWith('ngspice>') &&
                !line.toLowerCase().includes('error') &&
                !line.toLowerCase().includes('warning') &&
                !line.toLowerCase().includes('success') &&
                !line.includes('=') &&
                line.trim() !== '' &&
                'text-gray-200'
            )}
          >
            {line || '\u00A0'} {/* Non-breaking space for empty lines */}
          </div>
        ))}

        {/* Interactive prompt */}
        {isNgspiceReady && (
          <div className="flex items-center mt-1 pt-1 border-t border-gray-700">
            <span className="text-green-300 font-medium mr-2">ngspice&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-gray-100 font-mono text-xs pl-1"
              style={{
                fontFamily: 'var(--font-apple-mono)',
              }}
              placeholder="Enter ngspice command..."
              disabled={!isNgspiceReady}
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default TerminalPane
