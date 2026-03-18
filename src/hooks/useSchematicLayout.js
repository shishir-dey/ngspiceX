/**
 * useSchematicLayout
 *
 * React hook that orchestrates the full layout + routing pipeline:
 *   1. Receives parsed components from useNetlistParser
 *   2. Runs layout (graph → layering → force → constraints)
 *   3. Runs routing (A* for each net)
 *   4. Runs grouping detection
 *   5. Returns positioned components, routed wires, groups, bounds
 *   6. Supports incremental updates (drag-and-drop)
 */

import { useState, useCallback } from 'react'
import { computeLayout, incrementalLayout } from '../lib/schematicLayout'
import { routeNets } from '../lib/schematicRouter'
import { detectGroups } from '../lib/schematicGrouping'

export function useSchematicLayout() {
  const [layoutMode, setLayoutMode] = useState('balanced') // 'compact' | 'readable' | 'balanced'
  const [layoutResult, setLayoutResult] = useState(null)
  const [highlightedNet, setHighlightedNet] = useState(null)

  /**
   * Compute full layout from parsed components.
   */
  const computeFullLayout = useCallback(
    (parsedComponents) => {
      if (!parsedComponents || parsedComponents.length === 0) {
        const emptyResult = {
          components: [],
          wires: [],
          junctions: [],
          groups: [],
          buses: [],
          bounds: { width: 600, height: 400 },
          nets: {},
        }
        setLayoutResult(emptyResult)
        return emptyResult
      }

      const { components, nets, bounds } = computeLayout(parsedComponents, {
        mode: layoutMode,
      })

      const { wires, junctions } = routeNets(components, nets, bounds)

      const groups = detectGroups(components, nets)

      const result = {
        components,
        wires,
        junctions,
        groups,
        buses: [], // Phase 2
        bounds,
        nets,
      }

      setLayoutResult(result)
      return result
    },
    [layoutMode]
  )

  /**
   * Handle component drag — incremental re-layout + re-route.
   */
  const handleComponentDrag = useCallback(
    (componentId, newPosition) => {
      if (!layoutResult) return

      // Snap to grid
      const snapped = {
        x: Math.round(newPosition.x / 20) * 20,
        y: Math.round(newPosition.y / 20) * 20,
      }

      // Incremental layout
      const updatedComponents = incrementalLayout(
        layoutResult.components,
        layoutResult.nets,
        componentId,
        snapped
      )

      // Re-route
      const { wires, junctions } = routeNets(
        updatedComponents,
        layoutResult.nets,
        layoutResult.bounds
      )

      // Re-detect groups
      const groups = detectGroups(updatedComponents, layoutResult.nets)

      const newResult = {
        ...layoutResult,
        components: updatedComponents,
        wires,
        junctions,
        groups,
      }

      setLayoutResult(newResult)
      return newResult
    },
    [layoutResult]
  )

  /**
   * Change layout mode and re-compute.
   */
  const changeLayoutMode = useCallback((mode, parsedComponents) => {
    setLayoutMode(mode)
    if (parsedComponents && parsedComponents.length > 0) {
      // Need to rebuild with new mode
      const { components, nets, bounds } = computeLayout(parsedComponents, {
        mode,
      })
      const { wires, junctions } = routeNets(components, nets, bounds)
      const groups = detectGroups(components, nets)

      const result = {
        components,
        wires,
        junctions,
        groups,
        buses: [],
        bounds,
        nets,
      }

      setLayoutResult(result)
      return result
    }
  }, [])

  return {
    layoutResult,
    layoutMode,
    highlightedNet,
    computeFullLayout,
    handleComponentDrag,
    changeLayoutMode,
    setHighlightedNet,
  }
}
