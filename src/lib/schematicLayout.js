/**
 * Schematic Layout Engine
 */

// ─── Pin Offset Definitions ────────────────────────────────────────────────────
// Each type maps to an array of pin descriptors with default offsets (horizontal orientation).

const PIN_DEFINITIONS = {
  R: [
    { id: '1', offset: { x: -40, y: 0 } },
    { id: '2', offset: { x: 40, y: 0 } },
  ],
  L: [
    { id: '1', offset: { x: -40, y: 0 } },
    { id: '2', offset: { x: 40, y: 0 } },
  ],
  C: [
    { id: '1', offset: { x: -40, y: 0 } },
    { id: '2', offset: { x: 40, y: 0 } },
  ],
  V: [
    { id: '+', offset: { x: 0, y: -30 } },
    { id: '-', offset: { x: 0, y: 30 } },
  ],
  I: [
    { id: '+', offset: { x: 0, y: -30 } },
    { id: '-', offset: { x: 0, y: 30 } },
  ],
  D: [
    { id: 'A', offset: { x: -40, y: 0 } },
    { id: 'K', offset: { x: 40, y: 0 } },
  ],
  Q: [
    { id: 'C', offset: { x: 0, y: -30 } },
    { id: 'B', offset: { x: -40, y: 0 } },
    { id: 'E', offset: { x: 0, y: 30 } },
  ],
  J: [
    { id: 'D', offset: { x: 0, y: -30 } },
    { id: 'G', offset: { x: -40, y: 0 } },
    { id: 'S', offset: { x: 0, y: 30 } },
  ],
  M: [
    { id: 'D', offset: { x: 0, y: -30 } },
    { id: 'G', offset: { x: -40, y: 0 } },
    { id: 'S', offset: { x: 0, y: 30 } },
    { id: 'B', offset: { x: 40, y: 0 } },
  ],
  E: [
    { id: '1', offset: { x: -40, y: -15 } },
    { id: '2', offset: { x: -40, y: 15 } },
    { id: '3', offset: { x: 40, y: -15 } },
    { id: '4', offset: { x: 40, y: 15 } },
  ],
  F: [
    { id: '1', offset: { x: -40, y: -15 } },
    { id: '2', offset: { x: -40, y: 15 } },
    { id: '3', offset: { x: 40, y: -15 } },
    { id: '4', offset: { x: 40, y: 15 } },
  ],
  G: [
    { id: '1', offset: { x: -40, y: -15 } },
    { id: '2', offset: { x: -40, y: 15 } },
    { id: '3', offset: { x: 40, y: -15 } },
    { id: '4', offset: { x: 40, y: 15 } },
  ],
  H: [
    { id: '1', offset: { x: -40, y: -15 } },
    { id: '2', offset: { x: -40, y: 15 } },
    { id: '3', offset: { x: 40, y: -15 } },
    { id: '4', offset: { x: 40, y: 15 } },
  ],
}

// Bounding box sizes per component type (width, height)
const COMPONENT_SIZES = {
  R: { w: 80, h: 24 },
  L: { w: 80, h: 24 },
  C: { w: 80, h: 30 },
  V: { w: 60, h: 60 },
  I: { w: 60, h: 60 },
  D: { w: 80, h: 30 },
  Q: { w: 80, h: 60 },
  J: { w: 80, h: 60 },
  M: { w: 80, h: 60 },
  E: { w: 80, h: 40 },
  F: { w: 80, h: 40 },
  G: { w: 80, h: 40 },
  H: { w: 80, h: 40 },
}

const DEFAULT_SIZE = { w: 80, h: 40 }

// Nets to ignore during layout (they connect everything and collapse layers)
const COMMON_NETS = new Set([
  '0',
  'gnd',
  'GND',
  'vcc',
  'VCC',
  'vdd',
  'VDD',
  'vss',
  'VSS',
])

/**
 * Build the net map (hypergraph): maps each net name to the components/pins on it.
 * Also builds a signal-flow adjacency (excluding global nets like GND/VCC which
 * would collapse everything into the same layer).
 *
 * @param {Array} components - Parsed components with .id, .type, .nodes[]
 * @returns {{ nets: Object, adjacency: Object, signalAdjacency: Object }}
 */
export function buildGraphs(components) {
  // Net map: netName → [{ componentId, pinIndex }]
  const nets = {}
  // Full adjacency (for routing): componentId → Set<componentId>
  const adjacency = {}
  // Signal adjacency (for layout, excluding GND/VCC): componentId → Set<componentId>
  const signalAdjacency = {}

  for (const comp of components) {
    adjacency[comp.id] = adjacency[comp.id] || new Set()
    signalAdjacency[comp.id] = signalAdjacency[comp.id] || new Set()
    for (let pinIdx = 0; pinIdx < comp.nodes.length; pinIdx++) {
      const netName = comp.nodes[pinIdx]
      if (!nets[netName]) nets[netName] = []
      nets[netName].push({ componentId: comp.id, pinIndex: pinIdx })
    }
  }

  // Build adjacency from shared nets
  for (const netName of Object.keys(nets)) {
    const members = nets[netName]
    const isCommon =
      COMMON_NETS.has(netName) || COMMON_NETS.has(netName.toLowerCase())

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i].componentId
        const b = members[j].componentId
        if (a !== b) {
          adjacency[a] = adjacency[a] || new Set()
          adjacency[b] = adjacency[b] || new Set()
          adjacency[a].add(b)
          adjacency[b].add(a)

          // Only add to signal adjacency if not a Common/global net
          if (!isCommon) {
            signalAdjacency[a] = signalAdjacency[a] || new Set()
            signalAdjacency[b] = signalAdjacency[b] || new Set()
            signalAdjacency[a].add(b)
            signalAdjacency[b].add(a)
          }
        }
      }
    }
  }

  return { nets, adjacency, signalAdjacency }
}

/**
 * Enrich parsed components with pin metadata, orientation, constraints.
 * @param {Array} components - Raw parsed components
 * @param {Object} nets - Net map from buildGraphs
 * @returns {Array} Enriched components
 */
export function enrichComponents(components, nets) {
  return components.map((comp) => {
    const pinDefs = PIN_DEFINITIONS[comp.type] || []
    const size = COMPONENT_SIZES[comp.type] || DEFAULT_SIZE

    // Determine orientation: sources (V, I) are vertical (90°), passives horizontal (0°)
    const isVertical = comp.type === 'V' || comp.type === 'I'
    const orientation = isVertical ? 90 : 0

    const pins = comp.nodes.map((netName, idx) => {
      const def = pinDefs[idx] || {
        id: String(idx + 1),
        offset: { x: 0, y: 0 },
      }
      return {
        id: def.id,
        offset: { ...def.offset },
        net: netName,
      }
    })

    return {
      id: comp.id,
      type: comp.type,
      value: comp.value,
      model: comp.model,
      position: { x: 0, y: 0 },
      orientation,
      size,
      pins,
      constraints: {
        locked: false,
        alignment: null,
        symmetry_group: null,
      },
    }
  })
}

/**
 * Assign layers using BFS on the SIGNAL adjacency graph (excludes GND/VCC nets).
 * This prevents GND connections from collapsing the entire circuit into a few layers.
 * Falls back to component order if the graph is disconnected.
 */
function assignLayers(components, signalAdjacency) {
  const layers = {}
  const visited = new Set()

  // Find source nodes (V, I types)
  const sources = components
    .filter((c) => c.type === 'V' || c.type === 'I')
    .map((c) => c.id)

  // If no sources, start from first component
  const startNodes =
    sources.length > 0 ? sources : [components[0]?.id].filter(Boolean)

  // BFS layer assignment using signal adjacency (no GND/VCC shortcuts)
  const queue = []
  for (const id of startNodes) {
    if (!visited.has(id)) {
      queue.push({ id, layer: 0 })
      visited.add(id)
    }
  }

  while (queue.length > 0) {
    const { id, layer } = queue.shift()
    layers[id] = layer

    const neighbors = signalAdjacency[id] || new Set()
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId)
        queue.push({ id: neighborId, layer: layer + 1 })
      }
    }
  }

  // Handle disconnected components — assign them incrementally
  let maxLayer = Math.max(0, ...Object.values(layers))
  for (const comp of components) {
    if (!(comp.id in layers)) {
      layers[comp.id] = ++maxLayer
    }
  }

  return layers
}

/**
 * Barycenter crossing minimization.
 * Sort nodes within each layer by the average position of their neighbors
 * in the adjacent layer. Iterate until stable or max iterations reached.
 */
function minimizeCrossings(
  layerAssignments,
  signalAdjacency,
  maxIterations = 15
) {
  // Group components by layer
  const layerGroups = {}
  for (const [compId, layer] of Object.entries(layerAssignments)) {
    if (!layerGroups[layer]) layerGroups[layer] = []
    layerGroups[layer].push(compId)
  }

  const sortedLayers = Object.keys(layerGroups)
    .map(Number)
    .sort((a, b) => a - b)

  // Initialize positions: index within layer
  const positions = {}
  for (const layer of sortedLayers) {
    layerGroups[layer].forEach((compId, idx) => {
      positions[compId] = idx
    })
  }

  // Iterate barycenter — sweep forward and backward
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false

    // Forward sweep
    for (let li = 1; li < sortedLayers.length; li++) {
      const layer = sortedLayers[li]
      const prevLayer = sortedLayers[li - 1]
      const prevLayerSet = new Set(layerGroups[prevLayer])

      const barycenters = layerGroups[layer].map((compId) => {
        const neighbors = signalAdjacency[compId] || new Set()
        const prevNeighbors = [...neighbors].filter((n) => prevLayerSet.has(n))
        if (prevNeighbors.length === 0) return { compId, bc: positions[compId] }
        const avgPos =
          prevNeighbors.reduce((sum, n) => sum + positions[n], 0) /
          prevNeighbors.length
        return { compId, bc: avgPos }
      })

      barycenters.sort((a, b) => a.bc - b.bc)
      const newOrder = barycenters.map((b) => b.compId)
      if (newOrder.some((id, idx) => layerGroups[layer][idx] !== id)) {
        changed = true
        layerGroups[layer] = newOrder
        newOrder.forEach((id, idx) => {
          positions[id] = idx
        })
      }
    }

    // Backward sweep
    for (let li = sortedLayers.length - 2; li >= 0; li--) {
      const layer = sortedLayers[li]
      const nextLayer = sortedLayers[li + 1]
      const nextLayerSet = new Set(layerGroups[nextLayer])

      const barycenters = layerGroups[layer].map((compId) => {
        const neighbors = signalAdjacency[compId] || new Set()
        const nextNeighbors = [...neighbors].filter((n) => nextLayerSet.has(n))
        if (nextNeighbors.length === 0) return { compId, bc: positions[compId] }
        const avgPos =
          nextNeighbors.reduce((sum, n) => sum + positions[n], 0) /
          nextNeighbors.length
        return { compId, bc: avgPos }
      })

      barycenters.sort((a, b) => a.bc - b.bc)
      const newOrder = barycenters.map((b) => b.compId)
      if (newOrder.some((id, idx) => layerGroups[layer][idx] !== id)) {
        changed = true
        layerGroups[layer] = newOrder
        newOrder.forEach((id, idx) => {
          positions[id] = idx
        })
      }
    }

    if (!changed) break
  }

  return { layerGroups, positions }
}

/**
 * Apply adaptive spacing: compute actual (x, y) positions from layer assignments.
 * The layout grows LEFT TO RIGHT (layers = x columns) with components stacked
 * vertically within each layer.
 *
 * For large circuits, layer spacing scales to prevent cramming.
 */
function applySpacing(components, layerGroups, positions, opts = {}) {
  const {
    layerSpacing = 200,
    nodeSpacing = 120,
    startX = 100,
    startY = 80,
    maxNodesPerColumn = 6,
  } = opts

  const positionMap = {}

  const sortedLayers = Object.keys(layerGroups)
    .map(Number)
    .sort((a, b) => a - b)

  // Find the tallest column to determine centering
  let maxInLayer = 0
  for (const layer of sortedLayers) {
    maxInLayer = Math.max(maxInLayer, layerGroups[layer].length)
  }

  // Center each column vertically relative to the tallest column
  const totalHeight = Math.max(maxInLayer, 1) * nodeSpacing

  for (const layer of sortedLayers) {
    const nodesInLayer = layerGroups[layer]
    const layerHeight = nodesInLayer.length * nodeSpacing
    // Center vertically
    const offsetY = startY + (totalHeight - layerHeight) / 2

    for (let i = 0; i < nodesInLayer.length; i++) {
      const compId = nodesInLayer[i]
      positionMap[compId] = {
        x: startX + layer * layerSpacing,
        y: offsetY + i * nodeSpacing,
      }
    }
  }

  // Apply to components
  for (const comp of components) {
    if (positionMap[comp.id]) {
      comp.position = positionMap[comp.id]
    }
  }

  return components
}

/**
 * Refine positions using spring-electric forces.
 * - Spring forces pull connected nodes together (y-axis only)
 * - Repulsion pushes all nodes apart (y-axis only)
 * - X positions are preserved to maintain left-to-right layer ordering
 */
function forceDirectedRefinement(components, nets, opts = {}) {
  const {
    iterations = 60,
    springK = 0.05,
    repulsionK = 5000,
    dampingStart = 0.8,
    dampingEnd = 0.05,
    minSpacing = 70,
  } = opts

  if (components.length <= 1) return components

  const compById = new Map(components.map((c) => [c.id, c]))

  for (let iter = 0; iter < iterations; iter++) {
    const t = iter / iterations
    const damping = dampingStart + (dampingEnd - dampingStart) * t
    const forces = new Map()

    for (const comp of components) {
      forces.set(comp.id, { fy: 0 })
    }

    // Repulsion between components in the SAME LAYER only (prevents global y-axis blow-up)
    const layerMap = new Map()
    for (const comp of components) {
      const lx = Math.round(comp.position.x)
      if (!layerMap.has(lx)) layerMap.set(lx, [])
      layerMap.get(lx).push(comp)
    }

    for (const [, layerComps] of layerMap) {
      for (let i = 0; i < layerComps.length; i++) {
        for (let j = i + 1; j < layerComps.length; j++) {
          const a = layerComps[i]
          const b = layerComps[j]
          const dy = b.position.y - a.position.y
          const absDy = Math.abs(dy) || 1
          const force = repulsionK / (absDy * absDy)
          const direction = dy > 0 ? 1 : -1

          forces.get(a.id).fy -= direction * force
          forces.get(b.id).fy += direction * force
        }
      }
    }

    // Spring forces along net edges (y-axis only, skip global nets)
    for (const netName of Object.keys(nets)) {
      if (COMMON_NETS.has(netName) || COMMON_NETS.has(netName.toLowerCase()))
        continue
      const members = nets[netName]
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const compA = compById.get(members[i].componentId)
          const compB = compById.get(members[j].componentId)
          if (!compA || !compB) continue

          const dy = compB.position.y - compA.position.y
          const forceY = springK * dy

          forces.get(compA.id).fy += forceY
          forces.get(compB.id).fy -= forceY
        }
      }
    }

    // Apply forces (only y, preserving layer x positions)
    for (const comp of components) {
      if (comp.constraints.locked) continue
      const f = forces.get(comp.id)
      if (f) comp.position.y += f.fy * damping
    }

    // Enforce minimum spacing within same layer
    for (const [, layerComps] of layerMap) {
      layerComps.sort((a, b) => a.position.y - b.position.y)
      for (let i = 1; i < layerComps.length; i++) {
        const gap = layerComps[i].position.y - layerComps[i - 1].position.y
        if (gap < minSpacing) {
          layerComps[i].position.y = layerComps[i - 1].position.y + minSpacing
        }
      }
    }
  }

  return components
}

/**
 * Apply layout constraints (ground nudge, power nudge) — gentle version.
 * Instead of snapping ALL GND components to maxY (which stacks them),
 * we apply a mild downward bias.
 */
function applyConstraints(components, nets) {
  const groundNets = new Set(['0', 'gnd', 'GND'])

  // Compute center of mass for all y positions
  let sumY = 0
  for (const comp of components) sumY += comp.position.y
  const centerY = sumY / components.length

  // Gentle nudge: GND-connected non-source components get pushed below center
  for (const comp of components) {
    if (comp.constraints.locked) continue
    if (comp.type === 'V' || comp.type === 'I') continue

    const hasGround = comp.pins.some((p) => groundNets.has(p.net))
    if (hasGround) {
      // Nudge below center, but don't stack everything at the same Y
      if (comp.position.y < centerY + 40) {
        comp.position.y = centerY + 40
      }
    }

    const hasPower = comp.pins.some((p) => {
      const net = p.net.toLowerCase()
      return net === 'vcc' || net === 'vdd' || net === 'v+'
    })
    if (hasPower) {
      if (comp.position.y > centerY - 40) {
        comp.position.y = centerY - 40
      }
    }
  }

  return components
}

// ─── Main Layout Pipeline ───────────────────────────────────────────────────────

/**
 * Run the full layout pipeline on parsed components.
 *
 * @param {Array} parsedComponents - Components from useNetlistParser
 * @param {Object} options - Layout options
 * @param {string} options.mode - 'compact' | 'readable' | 'balanced'
 * @returns {{ components: Array, nets: Object, bounds: Object }}
 */
export function computeLayout(parsedComponents, options = {}) {
  const { mode = 'balanced' } = options

  if (!parsedComponents || parsedComponents.length === 0) {
    return { components: [], nets: {}, bounds: { width: 400, height: 300 } }
  }

  const { nets, adjacency, signalAdjacency } = buildGraphs(parsedComponents)

  let components = enrichComponents(parsedComponents, nets)

  const layerAssignments = assignLayers(parsedComponents, signalAdjacency)
  const { layerGroups, positions } = minimizeCrossings(
    layerAssignments,
    signalAdjacency
  )

  // Adaptive spacing based on circuit size and mode
  const numLayers = Object.keys(layerGroups).length
  const isLarge = parsedComponents.length > 20 || numLayers > 8

  const spacingOpts =
    {
      compact: {
        layerSpacing: isLarge ? 140 : 150,
        nodeSpacing: isLarge ? 80 : 100,
      },
      readable: {
        layerSpacing: isLarge ? 220 : 280,
        nodeSpacing: isLarge ? 140 : 180,
      },
      balanced: {
        layerSpacing: isLarge ? 170 : 200,
        nodeSpacing: isLarge ? 100 : 140,
      },
    }[mode] || {}

  components = applySpacing(components, layerGroups, positions, spacingOpts)

  components = forceDirectedRefinement(components, nets, {
    iterations: mode === 'compact' ? 30 : 50,
    minSpacing: isLarge ? 60 : 70,
  })

  components = applyConstraints(components, nets)

  // Normalize positions to be positive with padding
  let minX = Infinity,
    minY = Infinity
  let maxX = -Infinity,
    maxY = -Infinity

  for (const comp of components) {
    const hw = (comp.size?.w || 80) / 2
    const hh = (comp.size?.h || 60) / 2
    minX = Math.min(minX, comp.position.x - hw)
    minY = Math.min(minY, comp.position.y - hh)
    maxX = Math.max(maxX, comp.position.x + hw)
    maxY = Math.max(maxY, comp.position.y + hh)
  }

  const padding = 80
  const offsetX = padding - minX
  const offsetY = padding - minY

  for (const comp of components) {
    comp.position.x += offsetX
    comp.position.y += offsetY
  }

  const bounds = {
    width: Math.max(600, maxX - minX + padding * 2),
    height: Math.max(400, maxY - minY + padding * 2),
  }

  // Snap to grid (20px)
  for (const comp of components) {
    comp.position.x = Math.round(comp.position.x / 20) * 20
    comp.position.y = Math.round(comp.position.y / 20) * 20
  }

  return { components, nets, bounds }
}

/**
 * Incremental layout: re-layout only a local subgraph around a moved component.
 * @param {Array} allComponents - All components (already laid out)
 * @param {Object} nets - Net map
 * @param {string} movedId - ID of the component that was moved
 * @param {{ x: number, y: number }} newPos - New position
 * @returns {Array} Updated components
 */
export function incrementalLayout(allComponents, nets, movedId, newPos) {
  const compMap = new Map(
    allComponents.map((c) => [c.id, { ...c, position: { ...c.position } }])
  )
  const moved = compMap.get(movedId)
  if (!moved) return allComponents

  moved.position = { ...newPos }
  moved.constraints.locked = true

  // Find 1-hop neighbors via nets
  const neighborIds = new Set()
  for (const pin of moved.pins) {
    const netMembers = nets[pin.net] || []
    for (const member of netMembers) {
      if (member.componentId !== movedId) {
        neighborIds.add(member.componentId)
      }
    }
  }

  // Re-run force directed on the subgraph (moved + neighbors)
  const subgraph = [
    moved,
    ...[...neighborIds].map((id) => compMap.get(id)).filter(Boolean),
  ]
  forceDirectedRefinement(subgraph, nets, { iterations: 20 })

  // Merge back
  const result = allComponents.map((c) => compMap.get(c.id) || c)

  // Unlock the moved component
  const movedResult = result.find((c) => c.id === movedId)
  if (movedResult) movedResult.constraints.locked = false

  return result
}
