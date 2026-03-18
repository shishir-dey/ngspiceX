/**
 * Schematic Grouping
 */

/**
 * Detect functional groups from components and nets.
 *
 * @param {Array} components - Enriched components with pins
 * @param {Object} nets - Net map: { netId: [{ componentId, pinIndex }] }
 * @returns {Array} groups - Detected groups with bounding boxes
 */
export function detectGroups(components, nets) {
  const compMap = new Map(components.map((c) => [c.id, c]))
  const groups = []
  const usedComponents = new Set()
  let groupCounter = 0

  // --- RC Filter Detection ---
  // Pattern: R and C sharing a net, C's other pin goes to GND
  const groundNets = new Set(['0', 'gnd', 'GND'])

  for (const comp of components) {
    if (comp.type !== 'R' || usedComponents.has(comp.id)) continue

    for (const pin of comp.pins) {
      const netMembers = nets[pin.net] || []
      for (const member of netMembers) {
        if (member.componentId === comp.id) continue
        const other = compMap.get(member.componentId)
        if (!other || other.type !== 'C' || usedComponents.has(other.id))
          continue

        // Check if C's other pin goes to ground
        const cOtherPin = other.pins.find((p) => p.net !== pin.net)
        if (cOtherPin && groundNets.has(cOtherPin.net)) {
          const memberIds = [comp.id, other.id]
          groups.push(
            createGroup(`G${++groupCounter}`, 'rc_filter', memberIds, compMap)
          )
          usedComponents.add(comp.id)
          usedComponents.add(other.id)
        }
      }
    }
  }

  // --- Voltage Divider Detection ---
  // Pattern: 2 resistors in series (sharing a net), one end to power, other to ground
  const resistors = components.filter(
    (c) => c.type === 'R' && !usedComponents.has(c.id)
  )
  for (let i = 0; i < resistors.length; i++) {
    for (let j = i + 1; j < resistors.length; j++) {
      const r1 = resistors[i]
      const r2 = resistors[j]
      if (usedComponents.has(r1.id) || usedComponents.has(r2.id)) continue

      // Check if they share a net
      const r1Nets = new Set(r1.pins.map((p) => p.net))
      const sharedNet = r2.pins.find((p) => r1Nets.has(p.net))
      if (!sharedNet) continue

      // Check if one end goes to ground and the other to a non-ground net
      const r1OtherNet = r1.pins.find((p) => p.net !== sharedNet.net)?.net
      const r2OtherNet = r2.pins.find((p) => p.net !== sharedNet.net)?.net

      if (
        (groundNets.has(r1OtherNet) || groundNets.has(r2OtherNet)) &&
        !(groundNets.has(r1OtherNet) && groundNets.has(r2OtherNet))
      ) {
        const memberIds = [r1.id, r2.id]
        groups.push(
          createGroup(
            `G${++groupCounter}`,
            'voltage_divider',
            memberIds,
            compMap
          )
        )
        usedComponents.add(r1.id)
        usedComponents.add(r2.id)
      }
    }
  }

  // --- Decoupling Capacitor Detection ---
  // Pattern: C with one pin to a power net and other to ground
  for (const comp of components) {
    if (comp.type !== 'C' || usedComponents.has(comp.id)) continue
    const pin0Net = comp.pins[0]?.net?.toLowerCase() || ''
    const pin1Net = comp.pins[1]?.net?.toLowerCase() || ''

    const powerNets = ['vcc', 'vdd', 'v+', 'vss']
    const isPower0 = powerNets.some((p) => pin0Net === p)
    const isPower1 = powerNets.some((p) => pin1Net === p)
    const isGnd0 = groundNets.has(comp.pins[0]?.net)
    const isGnd1 = groundNets.has(comp.pins[1]?.net)

    if ((isPower0 && isGnd1) || (isPower1 && isGnd0)) {
      groups.push(
        createGroup(`G${++groupCounter}`, 'decoupling_cap', [comp.id], compMap)
      )
      usedComponents.add(comp.id)
    }
  }

  // --- Amplifier Stage Detection ---
  // Pattern: Q/J/M transistor + at least one bias resistor connected
  for (const comp of components) {
    if (!['Q', 'J', 'M'].includes(comp.type) || usedComponents.has(comp.id))
      continue

    const memberIds = [comp.id]
    // Find resistors connected to any pin of the transistor
    for (const pin of comp.pins) {
      const netMembers = nets[pin.net] || []
      for (const member of netMembers) {
        if (member.componentId === comp.id) continue
        const other = compMap.get(member.componentId)
        if (other && other.type === 'R' && !usedComponents.has(other.id)) {
          memberIds.push(other.id)
        }
      }
    }

    if (memberIds.length >= 2) {
      for (const id of memberIds) usedComponents.add(id)
      groups.push(
        createGroup(`G${++groupCounter}`, 'amplifier_stage', memberIds, compMap)
      )
    }
  }

  return groups
}

/**
 * Create a group object with a bounding box.
 */
function createGroup(groupId, type, memberIds, compMap) {
  let minX = Infinity,
    minY = Infinity
  let maxX = -Infinity,
    maxY = -Infinity

  for (const id of memberIds) {
    const comp = compMap.get(id)
    if (!comp) continue
    const hw = (comp.size?.w || 80) / 2
    const hh = (comp.size?.h || 60) / 2
    minX = Math.min(minX, comp.position.x - hw)
    minY = Math.min(minY, comp.position.y - hh)
    maxX = Math.max(maxX, comp.position.x + hw)
    maxY = Math.max(maxY, comp.position.y + hh)
  }

  const pad = 20

  return {
    group_id: groupId,
    type,
    members: memberIds,
    bounding_box: {
      x: minX - pad,
      y: minY - pad,
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2,
    },
  }
}
