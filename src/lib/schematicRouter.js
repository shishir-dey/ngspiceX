/**
 * Schematic Router
 */

// ─── 5.1A: L-Shaped Routing ────────────────────────────────────────────────────

/**
 * Simple L-shaped route between two points.
 * Produces at most one bend, choosing the direction that avoids the most obstacles.
 */
function lRoute(from, to) {
  // Horizontal first, then vertical
  return [
    { x1: from.x, y1: from.y, x2: to.x, y2: from.y },
    { x1: to.x, y1: from.y, x2: to.x, y2: to.y },
  ].filter((seg) => seg.x1 !== seg.x2 || seg.y1 !== seg.y2)
}

// ─── 5.1B: Grid-based A* Routing ───────────────────────────────────────────────

const GRID_SIZE = 10 // Routing grid resolution in pixels

/**
 * Build an occupancy grid from placed components.
 * Cells occupied by components are marked as blocked.
 */
function buildOccupancyGrid(components, bounds, padding = 10) {
  const cols = Math.ceil(bounds.width / GRID_SIZE) + 2
  const rows = Math.ceil(bounds.height / GRID_SIZE) + 2
  // 0 = free, 1 = component body, 2 = near component
  const grid = Array.from({ length: rows }, () => new Uint8Array(cols))

  for (const comp of components) {
    const hw = (comp.size?.w || 80) / 2 + padding
    const hh = (comp.size?.h || 60) / 2 + padding
    const cx = comp.position.x
    const cy = comp.position.y

    const minCol = Math.max(0, Math.floor((cx - hw) / GRID_SIZE))
    const maxCol = Math.min(cols - 1, Math.ceil((cx + hw) / GRID_SIZE))
    const minRow = Math.max(0, Math.floor((cy - hh) / GRID_SIZE))
    const maxRow = Math.min(rows - 1, Math.ceil((cy + hh) / GRID_SIZE))

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        grid[r][c] = 1
      }
    }

    // Mark nearby cells for proximity penalty
    const nearPad = padding + 15
    const nearMinCol = Math.max(0, Math.floor((cx - hw - nearPad) / GRID_SIZE))
    const nearMaxCol = Math.min(
      cols - 1,
      Math.ceil((cx + hw + nearPad) / GRID_SIZE)
    )
    const nearMinRow = Math.max(0, Math.floor((cy - hh - nearPad) / GRID_SIZE))
    const nearMaxRow = Math.min(
      rows - 1,
      Math.ceil((cy + hh + nearPad) / GRID_SIZE)
    )

    for (let r = nearMinRow; r <= nearMaxRow; r++) {
      for (let c = nearMinCol; c <= nearMaxCol; c++) {
        if (grid[r][c] === 0) grid[r][c] = 2
      }
    }
  }

  return { grid, cols, rows }
}

/**
 * A* pathfinding on the occupancy grid.
 * Produces orthogonal paths with cost penalties for bends and proximity.
 */
function aStarRoute(from, to, occupancy, existingWireSegments = []) {
  const { grid, cols, rows } = occupancy

  const startCol = Math.round(from.x / GRID_SIZE)
  const startRow = Math.round(from.y / GRID_SIZE)
  const endCol = Math.round(to.x / GRID_SIZE)
  const endRow = Math.round(to.y / GRID_SIZE)

  // Clamp to grid bounds
  const clamp = (v, max) => Math.max(0, Math.min(v, max - 1))
  const sc = clamp(startCol, cols)
  const sr = clamp(startRow, rows)
  const ec = clamp(endCol, cols)
  const er = clamp(endRow, rows)

  // Build wire occupancy for crossing detection
  const wireOccupancy = new Set()
  for (const seg of existingWireSegments) {
    const minC = Math.min(
      Math.round(seg.x1 / GRID_SIZE),
      Math.round(seg.x2 / GRID_SIZE)
    )
    const maxC = Math.max(
      Math.round(seg.x1 / GRID_SIZE),
      Math.round(seg.x2 / GRID_SIZE)
    )
    const minR = Math.min(
      Math.round(seg.y1 / GRID_SIZE),
      Math.round(seg.y2 / GRID_SIZE)
    )
    const maxR = Math.max(
      Math.round(seg.y1 / GRID_SIZE),
      Math.round(seg.y2 / GRID_SIZE)
    )
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        wireOccupancy.add(`${r},${c}`)
      }
    }
  }

  // Directions: up, down, left, right (orthogonal only)
  const dirs = [
    { dr: -1, dc: 0 }, // up
    { dr: 1, dc: 0 }, // down
    { dr: 0, dc: -1 }, // left
    { dr: 0, dc: 1 }, // right
  ]

  // Node key
  const key = (r, c) => r * cols + c

  // Priority queue (simple sorted array for moderate grid sizes)
  const openSet = []
  const gScore = new Map()
  const cameFrom = new Map()
  const dirFrom = new Map() // track direction for bend detection

  const heuristic = (r, c) => Math.abs(r - er) + Math.abs(c - ec)

  const startKey = key(sr, sc)
  gScore.set(startKey, 0)
  openSet.push({ r: sr, c: sc, f: heuristic(sr, sc), g: 0 })

  let iterations = 0
  const maxIterations = cols * rows * 2

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++

    // Find lowest f-score
    let bestIdx = 0
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[bestIdx].f) bestIdx = i
    }
    const current = openSet.splice(bestIdx, 1)[0]

    if (current.r === er && current.c === ec) {
      // Reconstruct path
      const path = [{ r: er, c: ec }]
      let k = key(er, ec)
      while (cameFrom.has(k)) {
        const prev = cameFrom.get(k)
        path.unshift(prev)
        k = key(prev.r, prev.c)
      }
      return gridPathToSegments(path)
    }

    const currentKey = key(current.r, current.c)

    for (const dir of dirs) {
      const nr = current.r + dir.dr
      const nc = current.c + dir.dc

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      if (grid[nr][nc] === 1) continue // blocked by component

      // Cost calculation
      let moveCost = 1

      // Proximity penalty
      if (grid[nr][nc] === 2) moveCost += 2

      // Bend penalty: check if direction changed
      const prevDir = dirFrom.get(currentKey)
      if (prevDir && (prevDir.dr !== dir.dr || prevDir.dc !== dir.dc)) {
        moveCost += 3 // bend penalty
      }

      // Crossing penalty
      if (wireOccupancy.has(`${nr},${nc}`)) {
        moveCost += 10
      }

      const tentG = (gScore.get(currentKey) || 0) + moveCost
      const neighborKey = key(nr, nc)

      if (!gScore.has(neighborKey) || tentG < gScore.get(neighborKey)) {
        gScore.set(neighborKey, tentG)
        cameFrom.set(neighborKey, { r: current.r, c: current.c })
        dirFrom.set(neighborKey, dir)
        openSet.push({
          r: nr,
          c: nc,
          f: tentG + heuristic(nr, nc),
          g: tentG,
        })
      }
    }
  }

  // Fallback to L-route if A* fails
  return lRoute(from, to)
}

/**
 * Convert a grid path to wire segments (merge collinear grid cells into segments).
 */
function gridPathToSegments(path) {
  if (path.length < 2) return []

  const segments = []
  let segStart = path[0]
  let prevDir = { dr: path[1].r - path[0].r, dc: path[1].c - path[0].c }

  for (let i = 2; i < path.length; i++) {
    const dir = { dr: path[i].r - path[i - 1].r, dc: path[i].c - path[i - 1].c }
    if (dir.dr !== prevDir.dr || dir.dc !== prevDir.dc) {
      // Direction changed — emit segment
      segments.push({
        x1: segStart.c * GRID_SIZE,
        y1: segStart.r * GRID_SIZE,
        x2: path[i - 1].c * GRID_SIZE,
        y2: path[i - 1].r * GRID_SIZE,
      })
      segStart = path[i - 1]
      prevDir = dir
    }
  }

  // Emit final segment
  const last = path[path.length - 1]
  segments.push({
    x1: segStart.c * GRID_SIZE,
    y1: segStart.r * GRID_SIZE,
    x2: last.c * GRID_SIZE,
    y2: last.r * GRID_SIZE,
  })

  return segments
}

// ─── 5.1C: Multi-Terminal Net Routing (Steiner Approximation) ───────────────────

/**
 * Route a net with multiple pins using iterative closest-pair merging.
 * Builds a Steiner-tree-like structure.
 */
function steinerRoute(pins, occupancy, existingSegments = []) {
  if (pins.length < 2) return []
  if (pins.length === 2) {
    return aStarRoute(pins[0], pins[1], occupancy, existingSegments)
  }

  // Start from first pin, iteratively connect the closest unconnected pin
  const connected = [pins[0]]
  const remaining = pins.slice(1)
  const allSegments = [...existingSegments]

  while (remaining.length > 0) {
    let bestDist = Infinity
    let bestConnIdx = 0
    let bestRemIdx = 0

    // Find closest pair between connected and remaining
    for (let ci = 0; ci < connected.length; ci++) {
      for (let ri = 0; ri < remaining.length; ri++) {
        const dx = connected[ci].x - remaining[ri].x
        const dy = connected[ci].y - remaining[ri].y
        const dist = Math.abs(dx) + Math.abs(dy) // Manhattan distance
        if (dist < bestDist) {
          bestDist = dist
          bestConnIdx = ci
          bestRemIdx = ri
        }
      }
    }

    const from = connected[bestConnIdx]
    const to = remaining[bestRemIdx]
    const segments = aStarRoute(from, to, occupancy, allSegments)
    allSegments.push(...segments)
    connected.push(remaining.splice(bestRemIdx, 1)[0])
  }

  return allSegments.slice(existingSegments.length)
}

// ─── 5.3: Junction Optimization ─────────────────────────────────────────────────

/**
 * Find junction points (where 3+ wire segments meet).
 */
function findJunctions(allWires) {
  const pointCount = new Map() // "x,y" → count

  for (const wire of allWires) {
    for (const seg of wire.segments) {
      const endpoints = [`${seg.x1},${seg.y1}`, `${seg.x2},${seg.y2}`]
      for (const ep of endpoints) {
        pointCount.set(ep, (pointCount.get(ep) || 0) + 1)
      }
    }
  }

  // Also count intermediate collinear points
  const junctions = []
  for (const [point, count] of pointCount) {
    if (count >= 3) {
      const [x, y] = point.split(',').map(Number)
      junctions.push({ x, y })
    }
  }

  return junctions
}

/**
 * Merge collinear segments within a wire.
 */
function mergeCollinear(segments) {
  if (segments.length < 2) return segments

  const merged = [segments[0]]

  for (let i = 1; i < segments.length; i++) {
    const prev = merged[merged.length - 1]
    const curr = segments[i]

    // Check if collinear and connected
    const prevHoriz = prev.y1 === prev.y2
    const currHoriz = curr.y1 === curr.y2

    if (prevHoriz && currHoriz && prev.y1 === curr.y1 && prev.x2 === curr.x1) {
      // Merge horizontal
      prev.x2 = curr.x2
    } else if (
      !prevHoriz &&
      !currHoriz &&
      prev.x1 === curr.x1 &&
      prev.y2 === curr.y1
    ) {
      // Merge vertical
      prev.y2 = curr.y2
    } else {
      merged.push(curr)
    }
  }

  return merged
}

// ─── Main Routing Pipeline ──────────────────────────────────────────────────────

/**
 * Get the absolute position of a pin on a component.
 */
function getPinPosition(component, pinIndex) {
  const pin = component.pins[pinIndex]
  if (!pin) {
    return { x: component.position.x, y: component.position.y }
  }

  // Apply rotation
  const angle = ((component.orientation || 0) * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const rx = pin.offset.x * cos - pin.offset.y * sin
  const ry = pin.offset.x * sin + pin.offset.y * cos

  return {
    x: component.position.x + rx,
    y: component.position.y + ry,
  }
}

/**
 * Route all nets.
 *
 * @param {Array} components - Positioned components from layout engine
 * @param {Object} nets - Net map: { netId: [{ componentId, pinIndex }] }
 * @param {Object} bounds - Layout bounds { width, height }
 * @param {Object} opts - Routing options
 * @returns {{ wires: Array, junctions: Array }}
 */
export function routeNets(components, nets, bounds, opts = {}) {
  const { routingMode = 'auto' } = opts // 'fast', 'astar', 'auto'

  const compMap = new Map(components.map((c) => [c.id, c]))
  const wires = []
  const allExistingSegments = []

  // Build occupancy grid for A*
  const occupancy = buildOccupancyGrid(components, bounds, 5)

  // Sort nets by size (smaller nets first for better routing)
  const sortedNets = Object.entries(nets).sort(
    (a, b) => a[1].length - b[1].length
  )

  for (const [netId, members] of sortedNets) {
    // Skip the ground net from routing (it's implicit)
    if (netId === '0' || netId.toLowerCase() === 'gnd') continue

    // Get pin positions
    const pinPositions = members
      .map((m) => {
        const comp = compMap.get(m.componentId)
        if (!comp) return null
        return getPinPosition(comp, m.pinIndex)
      })
      .filter(Boolean)

    if (pinPositions.length < 2) continue

    let segments

    if (
      routingMode === 'fast' ||
      (routingMode === 'auto' && pinPositions.length === 2)
    ) {
      // Use A* for 2-pin nets, Steiner for multi-pin
      if (pinPositions.length === 2) {
        segments = aStarRoute(
          pinPositions[0],
          pinPositions[1],
          occupancy,
          allExistingSegments
        )
      } else {
        segments = steinerRoute(pinPositions, occupancy, allExistingSegments)
      }
    } else {
      segments = steinerRoute(pinPositions, occupancy, allExistingSegments)
    }

    // Merge collinear segments
    segments = mergeCollinear(segments)

    if (segments.length > 0) {
      wires.push({
        net_id: netId,
        segments,
      })
      allExistingSegments.push(...segments)
    }
  }

  // Find junctions
  const junctions = findJunctions(wires)

  return { wires, junctions }
}
