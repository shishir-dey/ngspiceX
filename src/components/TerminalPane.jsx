import React, { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '../lib/utils'

const TerminalPane = ({ output }) => {
  const terminalRef = useRef(null)

  useEffect(() => {
    // Auto-scroll to bottom when new output is added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  return (
    <div className="h-full w-full flex flex-col">
      {/* Terminal output area */}
      <div
        className="flex-1 bg-gray-900 text-gray-100 font-mono text-sm terminal relative overflow-hidden"
        style={{
          fontFamily:
            '"Inconsolata", "SF Mono", "Monaco", "Menlo", ui-monospace, monospace',
          background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
        }}
      >
        <div ref={terminalRef} className="h-full overflow-y-auto p-4">
          <div className="space-y-1 min-h-full pb-6">
            {output.length === 0 ? (
              <div className="text-gray-400 text-xs italic">
                Simulation logs will appear here.
              </div>
            ) : (
              output.map((line, index) => (
                <div
                  key={index}
                  className={cn(
                    'whitespace-pre-wrap break-words leading-tight text-xs',
                    // System messages
                    line.startsWith('>') &&
                      'text-blue-300 font-medium pl-2 border-l-2 border-blue-500 border-opacity-40 ml-1 bg-blue-900/10',
                    // User commands (ngspice prompt)
                    line.startsWith('ngspice>') &&
                      'text-green-300 font-medium bg-gray-800/50 px-3 py-1 rounded-md my-1 border-l-2 border-green-500',
                    // Error messages
                    line.toLowerCase().includes('error') &&
                      'text-red-300 font-medium bg-red-900/20 px-3 py-1 rounded-md border-l-2 border-red-500',
                    // Warning messages
                    line.toLowerCase().includes('warning') &&
                      'text-yellow-300 font-medium bg-yellow-900/20 px-3 py-1 rounded-md border-l-2 border-yellow-500',
                    // Success messages
                    line.toLowerCase().includes('success') &&
                      'text-green-300 font-medium bg-green-900/20 px-3 py-1 rounded-md border-l-2 border-green-500',
                    // Analysis commands and results
                    (line.includes('analysis') || line.includes('Analysis')) &&
                      'text-cyan-300',
                    // Variable listings
                    line.includes('=') &&
                      !line.startsWith('>') &&
                      !line.startsWith('ngspice>') &&
                      'text-gray-300 font-mono pl-6 text-xs',
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TerminalPane
