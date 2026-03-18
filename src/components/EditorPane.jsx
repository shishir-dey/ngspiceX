import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { cn } from '../lib/utils'

// ─── Component Symbol Definitions ───────────────────────────────────────────────
// Each returns React SVG elements centered at (0,0)

const SYMBOL_COLORS = {
  body: 'var(--sym-body, #334155)',
  wire: 'var(--sym-wire, #475569)',
  accent: 'var(--sym-accent, #2563eb)',
  ground: 'var(--sym-gnd, #64748b)',
  highlight: 'var(--sym-hl, #3b82f6)',
  groupFill: 'var(--sym-group, rgba(59,130,246,0.06))',
  groupStroke: 'var(--sym-group-stroke, rgba(59,130,246,0.25))',
}

function ResistorSymbol() {
  return (
    <g>
      <line
        x1="-40"
        y1="0"
        x2="-20"
        y2="0"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
      <rect
        x="-20"
        y="-6"
        width="40"
        height="12"
        fill="none"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
        rx="1"
      />
      <line
        x1="20"
        y1="0"
        x2="40"
        y2="0"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
    </g>
  )
}

function InductorSymbol() {
  return (
    <g>
      <line
        x1="-40"
        y1="0"
        x2="-20"
        y2="0"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
      <path
        d="M-20,0 C-15,-12 -10,-12 -5,0 C0,-12 5,-12 10,0 C15,-12 20,-12 20,0"
        fill="none"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
      />
      <line
        x1="20"
        y1="0"
        x2="40"
        y2="0"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
    </g>
  )
}

function CapacitorSymbol() {
  return (
    <g>
      <line
        x1="-40"
        y1="0"
        x2="-6"
        y2="0"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
      <line
        x1="-6"
        y1="-12"
        x2="-6"
        y2="12"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2.5"
      />
      <line
        x1="6"
        y1="-12"
        x2="6"
        y2="12"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2.5"
      />
      <line
        x1="6"
        y1="0"
        x2="40"
        y2="0"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
    </g>
  )
}

function VoltageSourceSymbol() {
  return (
    <g>
      <line
        x1="0"
        y1="-30"
        x2="0"
        y2="-18"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
      <circle
        cx="0"
        cy="0"
        r="18"
        fill="none"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
      />
      <text
        x="0"
        y="-4"
        textAnchor="middle"
        fontSize="14"
        fontWeight="600"
        fill={SYMBOL_COLORS.body}
      >
        +
      </text>
      <text
        x="0"
        y="11"
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
        fill={SYMBOL_COLORS.body}
      >
        −
      </text>
      <line
        x1="0"
        y1="18"
        x2="0"
        y2="30"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
    </g>
  )
}

function CurrentSourceSymbol() {
  return (
    <g>
      <line
        x1="0"
        y1="-30"
        x2="0"
        y2="-18"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
      <circle
        cx="0"
        cy="0"
        r="18"
        fill="none"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
      />
      <line
        x1="0"
        y1="10"
        x2="0"
        y2="-10"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
      />
      <polygon points="0,-10 -4,-3 4,-3" fill={SYMBOL_COLORS.body} />
      <line
        x1="0"
        y1="18"
        x2="0"
        y2="30"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
    </g>
  )
}

function DiodeSymbol() {
  return (
    <g>
      <line
        x1="-40"
        y1="0"
        x2="-10"
        y2="0"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
      <polygon
        points="-10,-10 -10,10 10,0"
        fill="none"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
      />
      <line
        x1="10"
        y1="-10"
        x2="10"
        y2="10"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
      />
      <line
        x1="10"
        y1="0"
        x2="40"
        y2="0"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
    </g>
  )
}

function BJTSymbol() {
  return (
    <g>
      {/* Base */}
      <line
        x1="-40"
        y1="0"
        x2="-10"
        y2="0"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
      <line
        x1="-10"
        y1="-15"
        x2="-10"
        y2="15"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="3"
      />
      {/* Collector */}
      <line
        x1="-10"
        y1="-8"
        x2="10"
        y2="-22"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
      />
      <line
        x1="10"
        y1="-22"
        x2="10"
        y2="-30"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
      {/* Emitter with arrow */}
      <line
        x1="-10"
        y1="8"
        x2="10"
        y2="22"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
      />
      <line
        x1="10"
        y1="22"
        x2="10"
        y2="30"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
      <polygon points="6,18 10,22 4,22" fill={SYMBOL_COLORS.body} />
    </g>
  )
}

function MOSFETSymbol() {
  return (
    <g>
      {/* Gate */}
      <line
        x1="-40"
        y1="0"
        x2="-15"
        y2="0"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
      <line
        x1="-15"
        y1="-15"
        x2="-15"
        y2="15"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
      />
      <line
        x1="-10"
        y1="-15"
        x2="-10"
        y2="15"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="3"
      />
      {/* Drain */}
      <line
        x1="-10"
        y1="-10"
        x2="10"
        y2="-10"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
      />
      <line
        x1="10"
        y1="-10"
        x2="10"
        y2="-30"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
      {/* Source */}
      <line
        x1="-10"
        y1="10"
        x2="10"
        y2="10"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
      />
      <line
        x1="10"
        y1="10"
        x2="10"
        y2="30"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
      {/* Body */}
      <line
        x1="-10"
        y1="0"
        x2="10"
        y2="0"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
      />
    </g>
  )
}

function GenericSymbol({ type }) {
  return (
    <g>
      <line
        x1="-40"
        y1="0"
        x2="-20"
        y2="0"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
      <rect
        x="-20"
        y="-12"
        width="40"
        height="24"
        fill="none"
        stroke={SYMBOL_COLORS.body}
        strokeWidth="2"
        rx="2"
      />
      <text
        x="0"
        y="5"
        textAnchor="middle"
        fontSize="11"
        fill={SYMBOL_COLORS.body}
        fontWeight="500"
      >
        {type}
      </text>
      <line
        x1="20"
        y1="0"
        x2="40"
        y2="0"
        stroke={SYMBOL_COLORS.wire}
        strokeWidth="2"
      />
    </g>
  )
}

function GroundSymbol({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line
        x1="0"
        y1="0"
        x2="0"
        y2="8"
        stroke={SYMBOL_COLORS.ground}
        strokeWidth="2"
      />
      <line
        x1="-10"
        y1="8"
        x2="10"
        y2="8"
        stroke={SYMBOL_COLORS.ground}
        strokeWidth="2"
      />
      <line
        x1="-6"
        y1="12"
        x2="6"
        y2="12"
        stroke={SYMBOL_COLORS.ground}
        strokeWidth="1.5"
      />
      <line
        x1="-3"
        y1="16"
        x2="3"
        y2="16"
        stroke={SYMBOL_COLORS.ground}
        strokeWidth="1"
      />
    </g>
  )
}

const SYMBOL_MAP = {
  R: ResistorSymbol,
  L: InductorSymbol,
  C: CapacitorSymbol,
  V: VoltageSourceSymbol,
  I: CurrentSourceSymbol,
  D: DiodeSymbol,
  Q: BJTSymbol,
  J: MOSFETSymbol,
  M: MOSFETSymbol,
}

// ─── Wire color palette (assign distinct colors per net) ────────────────────────

const NET_COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#be185d', // pink
  '#854d0e', // amber
  '#4f46e5', // indigo
  '#0d9488', // teal
]

function getNetColor(netId, netIndex) {
  return NET_COLORS[netIndex % NET_COLORS.length]
}

// ─── SchematicComponent ─────────────────────────────────────────────────────────

function SchematicComponent({
  comp,
  isHighlighted,
  onDragStart,
  onMouseEnterPin,
  onMouseLeavePin,
}) {
  const SymbolComp = SYMBOL_MAP[comp.type] || GenericSymbol
  const rotation = comp.orientation || 0

  return (
    <g
      transform={`translate(${comp.position.x}, ${comp.position.y})`}
      className="schematic-component"
      style={{ cursor: 'grab' }}
      onMouseDown={(e) => onDragStart(e, comp.id)}
    >
      {/* Invisible hit area */}
      <rect
        x={-(comp.size?.w || 80) / 2 - 5}
        y={-(comp.size?.h || 60) / 2 - 5}
        width={(comp.size?.w || 80) + 10}
        height={(comp.size?.h || 60) + 10}
        fill="transparent"
        stroke="none"
      />

      {/* Component symbol with rotation */}
      <g transform={`rotate(${rotation})`}>
        <SymbolComp type={comp.type} />
      </g>

      {/* Label: component ID */}
      <text
        x="0"
        y={-(comp.size?.h || 40) / 2 - 8}
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fontFamily="'Inter', 'SF Mono', sans-serif"
        fill={isHighlighted ? SYMBOL_COLORS.highlight : '#1e293b'}
      >
        {comp.id}
      </text>

      {/* Value label */}
      {(comp.value || comp.model) && (
        <text
          x="0"
          y={(comp.size?.h || 40) / 2 + 14}
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
          fontFamily="'Inter', sans-serif"
        >
          {comp.value || comp.model}
        </text>
      )}

      {/* Pin dots */}
      {comp.pins.map((pin, idx) => {
        const angle = (rotation * Math.PI) / 180
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const px = pin.offset.x * cos - pin.offset.y * sin
        const py = pin.offset.x * sin + pin.offset.y * cos
        return (
          <circle
            key={idx}
            cx={px}
            cy={py}
            r="3"
            fill={isHighlighted ? SYMBOL_COLORS.highlight : '#94a3b8'}
            stroke="white"
            strokeWidth="1"
            className="pin-dot"
            onMouseEnter={() => onMouseEnterPin(pin.net)}
            onMouseLeave={onMouseLeavePin}
          />
        )
      })}
    </g>
  )
}

// ─── Wires ──────────────────────────────────────────────────────────────────────

function WireSegments({
  wire,
  netIndex,
  isHighlighted,
  onMouseEnter,
  onMouseLeave,
}) {
  const color = isHighlighted
    ? SYMBOL_COLORS.highlight
    : getNetColor(wire.net_id, netIndex)
  const width = isHighlighted ? 3 : 2
  const opacity = isHighlighted ? 1 : 0.75

  return (
    <g
      className="wire-net"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {wire.segments.map((seg, idx) => (
        <line
          key={idx}
          x1={seg.x1}
          y1={seg.y1}
          x2={seg.x2}
          y2={seg.y2}
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          opacity={opacity}
        />
      ))}
      {/* Invisible wider hit area for easier hovering */}
      {wire.segments.map((seg, idx) => (
        <line
          key={`hit-${idx}`}
          x1={seg.x1}
          y1={seg.y1}
          x2={seg.x2}
          y2={seg.y2}
          stroke="transparent"
          strokeWidth="10"
        />
      ))}
      {/* Net label at midpoint of first segment */}
      {isHighlighted && wire.segments.length > 0 && (
        <text
          x={(wire.segments[0].x1 + wire.segments[0].x2) / 2}
          y={(wire.segments[0].y1 + wire.segments[0].y2) / 2 - 8}
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          fill={SYMBOL_COLORS.highlight}
          fontFamily="'SF Mono', 'Monaco', monospace"
        >
          {wire.net_id}
        </text>
      )}
    </g>
  )
}

// ─── Junction Dots ──────────────────────────────────────────────────────────────

function JunctionDots({ junctions }) {
  return (
    <g>
      {junctions.map((j, idx) => (
        <circle key={idx} cx={j.x} cy={j.y} r="4" fill="#334155" />
      ))}
    </g>
  )
}

// ─── Group Overlays ─────────────────────────────────────────────────────────────

const GROUP_LABELS = {
  rc_filter: 'RC Filter',
  voltage_divider: 'Voltage Divider',
  amplifier_stage: 'Amplifier',
  decoupling_cap: 'Decoupling',
}

function GroupOverlay({ group }) {
  const bb = group.bounding_box
  return (
    <g className="group-overlay">
      <rect
        x={bb.x}
        y={bb.y}
        width={bb.width}
        height={bb.height}
        fill={SYMBOL_COLORS.groupFill}
        stroke={SYMBOL_COLORS.groupStroke}
        strokeWidth="1"
        strokeDasharray="4 3"
        rx="6"
      />
      <text
        x={bb.x + 6}
        y={bb.y + 12}
        fontSize="9"
        fill="rgba(59,130,246,0.6)"
        fontFamily="'Inter', sans-serif"
        fontWeight="500"
      >
        {GROUP_LABELS[group.type] || group.type}
      </text>
    </g>
  )
}

// ─── Ground Symbols on GND-connected pins ───────────────────────────────────────

function GroundSymbols({ components }) {
  const grounds = []
  const groundNets = new Set(['0', 'gnd', 'GND'])

  for (const comp of components) {
    for (const pin of comp.pins) {
      if (groundNets.has(pin.net)) {
        const angle = ((comp.orientation || 0) * Math.PI) / 180
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const px = comp.position.x + pin.offset.x * cos - pin.offset.y * sin
        const py = comp.position.y + pin.offset.x * sin + pin.offset.y * cos
        grounds.push({ x: px, y: py, key: `${comp.id}-${pin.id}` })
      }
    }
  }

  return (
    <g>
      {grounds.map((g) => (
        <GroundSymbol key={g.key} x={g.x} y={g.y} />
      ))}
    </g>
  )
}

// ─── Layout Mode Toolbar ────────────────────────────────────────────────────────

function LayoutToolbar({ layoutMode, onChangeMode }) {
  const modes = [
    { id: 'compact', label: 'Compact', icon: '⊞' },
    { id: 'balanced', label: 'Balanced', icon: '⊡' },
    { id: 'readable', label: 'Readable', icon: '⊟' },
  ]

  return (
    <div className="absolute top-3 left-3 flex gap-1 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-1 shadow-sm z-10">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onChangeMode(m.id)}
          className={cn(
            'px-2 py-1 text-xs font-medium rounded transition-all',
            layoutMode === m.id
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          )}
          title={m.label}
        >
          <span className="mr-1">{m.icon}</span>
          {m.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main EditorPane Component ──────────────────────────────────────────────────

const EditorPane = ({
  mode,
  netlistText,
  onNetlistChange,
  components,
  connections,
  errors,
  layoutResult,
  layoutMode,
  highlightedNet,
  onHighlightNet,
  onComponentDrag,
  onChangeLayoutMode,
}) => {
  const textareaRef = useRef(null)
  const svgContainerRef = useRef(null)

  // Pan & zoom state
  const [viewBox, setViewBox] = useState(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState(null)
  const [zoom, setZoom] = useState(1)

  // Drag state
  const [dragState, setDragState] = useState(null) // { componentId, startX, startY, offsetX, offsetY }

  // Compute viewBox from layout bounds
  const effectiveViewBox = useMemo(() => {
    if (viewBox) return viewBox
    const bounds = layoutResult?.bounds || { width: 600, height: 400 }
    return { x: 0, y: 0, w: bounds.width, h: bounds.height }
  }, [viewBox, layoutResult?.bounds])

  // Reset viewBox when layout changes
  useEffect(() => {
    setViewBox(null)
    setZoom(1)
  }, [layoutResult?.bounds?.width, layoutResult?.bounds?.height])

  // ─── Pan handlers ───
  const handlePanStart = useCallback(
    (e) => {
      if (dragState) return // Don't pan while dragging component
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault()
        setIsPanning(true)
        setPanStart({ x: e.clientX, y: e.clientY, vb: { ...effectiveViewBox } })
      }
    },
    [effectiveViewBox, dragState]
  )

  const handlePanMove = useCallback(
    (e) => {
      if (isPanning && panStart) {
        const dx = (e.clientX - panStart.x) / zoom
        const dy = (e.clientY - panStart.y) / zoom
        setViewBox({
          x: panStart.vb.x - dx,
          y: panStart.vb.y - dy,
          w: panStart.vb.w,
          h: panStart.vb.h,
        })
      }
    },
    [isPanning, panStart, zoom]
  )

  const handlePanEnd = useCallback(() => {
    setIsPanning(false)
    setPanStart(null)
  }, [])

  // ─── Zoom handler ───
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault()
      const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9
      const newZoom = Math.max(0.2, Math.min(5, zoom * (1 / scaleFactor)))

      const vb = effectiveViewBox
      const rect = svgContainerRef.current?.getBoundingClientRect()
      if (!rect) return

      // Zoom toward cursor position
      const mx = ((e.clientX - rect.left) / rect.width) * vb.w + vb.x
      const my = ((e.clientY - rect.top) / rect.height) * vb.h + vb.y

      const newW = vb.w * scaleFactor
      const newH = vb.h * scaleFactor
      const newX = mx - (mx - vb.x) * scaleFactor
      const newY = my - (my - vb.y) * scaleFactor

      setViewBox({ x: newX, y: newY, w: newW, h: newH })
      setZoom(newZoom)
    },
    [zoom, effectiveViewBox]
  )

  // ─── Component drag handlers ───
  const handleDragStart = useCallback(
    (e, componentId) => {
      if (e.button !== 0 || e.altKey) return
      e.stopPropagation()

      const rect = svgContainerRef.current?.getBoundingClientRect()
      if (!rect) return

      const vb = effectiveViewBox
      const svgX = ((e.clientX - rect.left) / rect.width) * vb.w + vb.x
      const svgY = ((e.clientY - rect.top) / rect.height) * vb.h + vb.y

      const comp = layoutResult?.components?.find((c) => c.id === componentId)
      if (!comp) return

      setDragState({
        componentId,
        offsetX: svgX - comp.position.x,
        offsetY: svgY - comp.position.y,
      })
    },
    [effectiveViewBox, layoutResult?.components]
  )

  const handleDragMove = useCallback(
    (e) => {
      if (!dragState) return

      const rect = svgContainerRef.current?.getBoundingClientRect()
      if (!rect) return

      const vb = effectiveViewBox
      const svgX = ((e.clientX - rect.left) / rect.width) * vb.w + vb.x
      const svgY = ((e.clientY - rect.top) / rect.height) * vb.h + vb.y

      const newPos = {
        x: svgX - dragState.offsetX,
        y: svgY - dragState.offsetY,
      }

      if (onComponentDrag) {
        onComponentDrag(dragState.componentId, newPos)
      }
    },
    [dragState, effectiveViewBox, onComponentDrag]
  )

  const handleDragEnd = useCallback(() => {
    setDragState(null)
  }, [])

  // ─── Global mouse handlers (for pan + drag) ───
  const handleMouseMove = useCallback(
    (e) => {
      if (dragState) {
        handleDragMove(e)
      } else if (isPanning) {
        handlePanMove(e)
      }
    },
    [dragState, isPanning, handleDragMove, handlePanMove]
  )

  const handleMouseUp = useCallback(
    (e) => {
      if (dragState) {
        handleDragEnd()
      }
      if (isPanning) {
        handlePanEnd()
      }
    },
    [dragState, isPanning, handleDragEnd, handlePanEnd]
  )

  // Net highlighting
  const handleNetHighlight = useCallback(
    (netId) => onHighlightNet?.(netId),
    [onHighlightNet]
  )

  const handleNetUnhighlight = useCallback(
    () => onHighlightNet?.(null),
    [onHighlightNet]
  )

  // ─── Text mode ───
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

  // ─── Schematic mode ───
  const hasLayout = layoutResult && layoutResult.components.length > 0
  const vb = effectiveViewBox

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 relative bg-slate-50">
        {/* Layout mode toolbar */}
        {hasLayout && (
          <LayoutToolbar
            layoutMode={layoutMode}
            onChangeMode={onChangeLayoutMode}
          />
        )}

        {/* SVG schematic viewport */}
        <div
          ref={svgContainerRef}
          className="absolute inset-0 overflow-hidden"
          onMouseDown={handlePanStart}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            cursor: isPanning ? 'grabbing' : dragState ? 'grabbing' : 'default',
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            className="bg-slate-50"
            style={{ display: 'block' }}
          >
            {/* Grid pattern */}
            <defs>
              <pattern
                id="schematic-grid-sm"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="10" cy="10" r="0.5" fill="rgba(148,163,184,0.3)" />
              </pattern>
              <pattern
                id="schematic-grid-lg"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <rect width="100" height="100" fill="url(#schematic-grid-sm)" />
                <path
                  d="M 100 0 L 0 0 0 100"
                  fill="none"
                  stroke="rgba(148,163,184,0.15)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect
              x={vb.x - 1000}
              y={vb.y - 1000}
              width={vb.w + 2000}
              height={vb.h + 2000}
              fill="url(#schematic-grid-lg)"
            />

            {hasLayout && (
              <g>
                {/* Group overlays (behind everything) */}
                {layoutResult.groups.map((group) => (
                  <GroupOverlay key={group.group_id} group={group} />
                ))}

                {/* Wires */}
                {layoutResult.wires.map((wire, idx) => (
                  <WireSegments
                    key={wire.net_id}
                    wire={wire}
                    netIndex={idx}
                    isHighlighted={highlightedNet === wire.net_id}
                    onMouseEnter={() => handleNetHighlight(wire.net_id)}
                    onMouseLeave={handleNetUnhighlight}
                  />
                ))}

                {/* Junction dots */}
                <JunctionDots junctions={layoutResult.junctions} />

                {/* Ground symbols */}
                <GroundSymbols components={layoutResult.components} />

                {/* Components */}
                {layoutResult.components.map((comp) => {
                  const compNets = comp.pins.map((p) => p.net)
                  const isHighlighted =
                    highlightedNet && compNets.includes(highlightedNet)
                  return (
                    <SchematicComponent
                      key={comp.id}
                      comp={comp}
                      isHighlighted={isHighlighted}
                      onDragStart={handleDragStart}
                      onMouseEnterPin={handleNetHighlight}
                      onMouseLeavePin={handleNetUnhighlight}
                    />
                  )
                })}
              </g>
            )}
          </svg>
        </div>

        {/* Empty state */}
        {!hasLayout && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-500"
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

        {/* Zoom indicator */}
        {hasLayout && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded text-xs text-gray-500 font-mono z-10">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </div>
    </div>
  )
}

export default EditorPane
