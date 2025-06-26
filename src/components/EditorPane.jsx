import React, { useRef, useEffect } from 'react'
import { cn } from '../lib/utils'

const EditorPane = ({
  mode,
  netlistText,
  onNetlistChange,
  components,
  connections,
  errors,
}) => {
  const textareaRef = useRef(null)
  const svgRef = useRef(null)

  useEffect(() => {
    if (mode === 'schematic' && svgRef.current) {
      renderSchematic()
    }
  }, [mode, components, connections])

  const renderSchematic = () => {
    if (!svgRef.current) return

    const svg = svgRef.current
    svg.innerHTML = ''

    // If no components, just show the grid
    if (components.length === 0) {
      return
    }

    // Layout components in a grid with better horizontal distribution
    const maxCols = Math.max(
      3,
      Math.min(6, Math.ceil(Math.sqrt(components.length * 1.5)))
    )
    const gridCols = Math.min(maxCols, components.length)
    const gridRows = Math.ceil(components.length / gridCols)
    const cellWidth = 180 // Increased cell width for better spacing
    const cellHeight = 140 // Increased cell height for better spacing
    const startX = 60 // Starting X position
    const startY = 60 // Starting Y position

    // Calculate required SVG dimensions based on component layout
    const requiredWidth = Math.max(400, gridCols * cellWidth + startX * 2)
    const requiredHeight = Math.max(300, gridRows * cellHeight + startY * 2)

    // Update SVG dimensions
    svg.setAttribute('width', requiredWidth)
    svg.setAttribute('height', requiredHeight)
    svg.setAttribute('viewBox', `0 0 ${requiredWidth} ${requiredHeight}`)

    components.forEach((component, index) => {
      const col = index % gridCols
      const row = Math.floor(index / gridCols)
      const x = startX + col * cellWidth
      const y = startY + row * cellHeight

      // Create component group
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      group.setAttribute('transform', `translate(${x}, ${y})`)

      // Component symbol
      const symbol = createComponentSymbol(component.type)
      group.appendChild(symbol)

      // Component label
      const text = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text'
      )
      text.setAttribute('x', '0')
      text.setAttribute('y', '-20')
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('font-size', '12')
      text.setAttribute('fill', 'currentColor')
      text.textContent = `${component.id} (${component.value || component.model})`
      group.appendChild(text)

      svg.appendChild(group)
    })
  }

  const createComponentSymbol = (type) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')

    switch (type) {
      case 'R': // Resistor
        const rect = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        )
        rect.setAttribute('x', '-20')
        rect.setAttribute('y', '-5')
        rect.setAttribute('width', '40')
        rect.setAttribute('height', '10')
        rect.setAttribute('fill', 'none')
        rect.setAttribute('stroke', 'currentColor')
        rect.setAttribute('stroke-width', '2')
        g.appendChild(rect)

        // Connection lines
        const line1 = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        )
        line1.setAttribute('x1', '-30')
        line1.setAttribute('y1', '0')
        line1.setAttribute('x2', '-20')
        line1.setAttribute('y2', '0')
        line1.setAttribute('stroke', 'currentColor')
        line1.setAttribute('stroke-width', '2')
        g.appendChild(line1)

        const line2 = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        )
        line2.setAttribute('x1', '20')
        line2.setAttribute('y1', '0')
        line2.setAttribute('x2', '30')
        line2.setAttribute('y2', '0')
        line2.setAttribute('stroke', 'currentColor')
        line2.setAttribute('stroke-width', '2')
        g.appendChild(line2)
        break

      case 'C': // Capacitor
        const line3 = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        )
        line3.setAttribute('x1', '-5')
        line3.setAttribute('y1', '-15')
        line3.setAttribute('x2', '-5')
        line3.setAttribute('y2', '15')
        line3.setAttribute('stroke', 'currentColor')
        line3.setAttribute('stroke-width', '2')
        g.appendChild(line3)

        const line4 = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        )
        line4.setAttribute('x1', '5')
        line4.setAttribute('y1', '-15')
        line4.setAttribute('x2', '5')
        line4.setAttribute('y2', '15')
        line4.setAttribute('stroke', 'currentColor')
        line4.setAttribute('stroke-width', '2')
        g.appendChild(line4)

        // Connection lines
        const line5 = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        )
        line5.setAttribute('x1', '-30')
        line5.setAttribute('y1', '0')
        line5.setAttribute('x2', '-5')
        line5.setAttribute('y2', '0')
        line5.setAttribute('stroke', 'currentColor')
        line5.setAttribute('stroke-width', '2')
        g.appendChild(line5)

        const line6 = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        )
        line6.setAttribute('x1', '5')
        line6.setAttribute('y1', '0')
        line6.setAttribute('x2', '30')
        line6.setAttribute('y2', '0')
        line6.setAttribute('stroke', 'currentColor')
        line6.setAttribute('stroke-width', '2')
        g.appendChild(line6)
        break

      case 'V': // Voltage source
      case 'I': // Current source
        const circle = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle'
        )
        circle.setAttribute('cx', '0')
        circle.setAttribute('cy', '0')
        circle.setAttribute('r', '15')
        circle.setAttribute('fill', 'none')
        circle.setAttribute('stroke', 'currentColor')
        circle.setAttribute('stroke-width', '2')
        g.appendChild(circle)

        // Source symbol
        if (type === 'V') {
          const plus = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'text'
          )
          plus.setAttribute('x', '0')
          plus.setAttribute('y', '5')
          plus.setAttribute('text-anchor', 'middle')
          plus.setAttribute('font-size', '12')
          plus.setAttribute('fill', 'currentColor')
          plus.textContent = '+'
          g.appendChild(plus)
        } else {
          const arrow = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'text'
          )
          arrow.setAttribute('x', '0')
          arrow.setAttribute('y', '5')
          arrow.setAttribute('text-anchor', 'middle')
          arrow.setAttribute('font-size', '12')
          arrow.setAttribute('fill', 'currentColor')
          arrow.textContent = 'I'
          g.appendChild(arrow)
        }

        // Connection lines
        const line7 = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        )
        line7.setAttribute('x1', '-30')
        line7.setAttribute('y1', '0')
        line7.setAttribute('x2', '-15')
        line7.setAttribute('y2', '0')
        line7.setAttribute('stroke', 'currentColor')
        line7.setAttribute('stroke-width', '2')
        g.appendChild(line7)

        const line8 = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        )
        line8.setAttribute('x1', '15')
        line8.setAttribute('y1', '0')
        line8.setAttribute('x2', '30')
        line8.setAttribute('y2', '0')
        line8.setAttribute('stroke', 'currentColor')
        line8.setAttribute('stroke-width', '2')
        g.appendChild(line8)
        break

      default:
        // Generic component
        const genericRect = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        )
        genericRect.setAttribute('x', '-15')
        genericRect.setAttribute('y', '-10')
        genericRect.setAttribute('width', '30')
        genericRect.setAttribute('height', '20')
        genericRect.setAttribute('fill', 'none')
        genericRect.setAttribute('stroke', 'currentColor')
        genericRect.setAttribute('stroke-width', '2')
        g.appendChild(genericRect)

        const typeText = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text'
        )
        typeText.setAttribute('x', '0')
        typeText.setAttribute('y', '5')
        typeText.setAttribute('text-anchor', 'middle')
        typeText.setAttribute('font-size', '10')
        typeText.setAttribute('fill', 'currentColor')
        typeText.textContent = type
        g.appendChild(typeText)
    }

    return g
  }

  if (mode === 'text') {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={netlistText}
            onChange={(e) => onNetlistChange(e.target.value)}
            className={cn(
              'absolute inset-0 w-full h-full p-4 text-sm resize-none border-0 outline-none bg-white text-gray-800 editor',
              'focus:ring-0 focus:ring-offset-0 placeholder:text-gray-400 overflow-auto'
            )}
            style={{
              fontFamily:
                '"Inconsolata", "SF Mono", "Monaco", "Menlo", ui-monospace, monospace',
              whiteSpace: 'pre',
              wordBreak: 'normal',
              overflowWrap: 'normal',
              lineHeight: '1.5',
            }}
            placeholder="Enter your SPICE netlist here..."
            spellCheck="false"
          />

          {/* Error overlay */}
          {errors.length > 0 && (
            <div className="absolute top-3 right-3 bg-red-50 border border-red-200 rounded-md p-3 max-w-xs shadow-lg z-10">
              <div className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Netlist Errors
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className="text-sm text-red-700 flex items-start gap-2"
                  >
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>
                      <span className="font-medium">Line {error.line}:</span>{' '}
                      {error.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 relative bg-amber-50">
        {/* Schematic viewport with proper centering and scrolling */}
        <div className="absolute inset-0 overflow-auto">
          <div
            className="flex items-center justify-center p-4"
            style={{ minWidth: 'max-content', minHeight: 'max-content' }}
          >
            <svg
              ref={svgRef}
              width="1000"
              height="800"
              viewBox="0 0 1000 800"
              className="bg-amber-50 border border-amber-200/30 rounded-lg"
              style={{
                display: 'block',
              }}
            >
              {/* Grid pattern */}
              <defs>
                <pattern
                  id="schematic-grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="rgb(180, 140, 80)"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#schematic-grid)" />
            </svg>
          </div>
        </div>

        {/* Empty state for schematic mode - Always visible when no components */}
        {components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
              <div className="text-lg font-medium mb-2 text-gray-700">
                No components to display
              </div>
              <div className="text-sm text-gray-500">
                Switch to Text mode to enter your netlist
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditorPane
