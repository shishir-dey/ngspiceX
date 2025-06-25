import { useState, useCallback } from 'react'

export function useNetlistParser() {
  const [components, setComponents] = useState([])
  const [connections, setConnections] = useState([])
  const [directives, setDirectives] = useState([])
  const [models, setModels] = useState([])
  const [errors, setErrors] = useState([])

  const parseNetlist = useCallback((netlistText) => {
    const newComponents = []
    const newConnections = []
    const newDirectives = []
    const newModels = []
    const newErrors = []

    const lines = netlistText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('*'))

    let title = ''
    let lineNumber = 0

    for (const line of lines) {
      lineNumber++

      try {
        if (lineNumber === 1) {
          title = line
          continue
        }

        if (line.toLowerCase() === '.end') {
          continue
        }

        // Parse directives
        if (line.startsWith('.')) {
          const directive = parseDirective(line)
          if (directive) {
            newDirectives.push(directive)
          }
          continue
        }

        // Parse model definitions
        if (line.toLowerCase().startsWith('.model')) {
          const model = parseModel(line)
          if (model) {
            newModels.push(model)
          }
          continue
        }

        // Parse components
        const component = parseComponent(line)
        if (component) {
          newComponents.push(component)

          // Extract connections
          const componentConnections = component.nodes.map((node, index) => ({
            from: component.id,
            to: node,
            pin: index,
          }))
          newConnections.push(...componentConnections)
        }
      } catch (error) {
        newErrors.push({
          line: lineNumber,
          message: error.message,
          text: line,
        })
      }
    }

    setComponents(newComponents)
    setConnections(newConnections)
    setDirectives(newDirectives)
    setModels(newModels)
    setErrors(newErrors)

    return {
      title,
      components: newComponents,
      connections: newConnections,
      directives: newDirectives,
      models: newModels,
      errors: newErrors,
    }
  }, [])

  const parseComponent = (line) => {
    const parts = line.split(/\s+/)
    if (parts.length < 3) return null

    const id = parts[0]
    const type = id[0].toUpperCase()
    const nodes = []
    let value = ''
    let model = ''
    let parameters = {}

    switch (type) {
      case 'R': // Resistor
      case 'L': // Inductor
      case 'C': // Capacitor
        if (parts.length >= 4) {
          nodes.push(parts[1], parts[2])
          value = parts[3]
        }
        break

      case 'V': // Voltage source
      case 'I': // Current source
        if (parts.length >= 4) {
          nodes.push(parts[1], parts[2])
          const params = parts.slice(3).join(' ')
          if (params.toLowerCase().includes('dc')) {
            value = params.match(/dc\s+([^\s]+)/i)?.[1] || ''
          } else if (params.toLowerCase().includes('ac')) {
            value = params.match(/ac\s+([^\s]+)/i)?.[1] || ''
          } else if (params.toLowerCase().includes('sin')) {
            value = params
          } else {
            value = parts[3]
          }
        }
        break

      case 'D': // Diode
        if (parts.length >= 4) {
          nodes.push(parts[1], parts[2])
          model = parts[3]
        }
        break

      case 'Q': // BJT
      case 'J': // JFET
        if (parts.length >= 5) {
          nodes.push(parts[1], parts[2], parts[3])
          if (type === 'Q' && parts.length >= 6) {
            nodes.push(parts[4]) // Substrate for BJT
            model = parts[5]
          } else {
            model = parts[4]
          }
        }
        break

      case 'M': // MOSFET
        if (parts.length >= 7) {
          nodes.push(parts[1], parts[2], parts[3], parts[4]) // D, G, S, B
          model = parts[5]
          if (parts[6]) {
            const paramPairs = parts.slice(6).join(' ').split(/\s+/)
            for (let i = 0; i < paramPairs.length; i += 2) {
              if (paramPairs[i] && paramPairs[i + 1]) {
                parameters[paramPairs[i]] = paramPairs[i + 1]
              }
            }
          }
        }
        break

      case 'E': // VCVS
      case 'F': // CCCS
      case 'G': // VCCS
      case 'H': // CCVS
        if (parts.length >= 6) {
          nodes.push(parts[1], parts[2], parts[3], parts[4])
          value = parts[5]
        }
        break

      default:
        return null
    }

    return {
      id,
      type,
      nodes,
      value,
      model,
      parameters,
      x: 0,
      y: 0,
      level: 0,
    }
  }

  const parseDirective = (line) => {
    const parts = line.split(/\s+/)
    const directive = parts[0].toLowerCase()

    const commonDirectives = [
      '.dc',
      '.ac',
      '.tran',
      '.op',
      '.noise',
      '.tf',
      '.sens',
    ]

    if (commonDirectives.includes(directive)) {
      return {
        type: directive.substring(1),
        parameters: parts.slice(1).join(' '),
      }
    }

    return {
      type: 'unknown',
      parameters: line,
    }
  }

  const parseModel = (line) => {
    const parts = line.split(/\s+/)
    if (parts.length < 3) return null

    const name = parts[1]
    const type = parts[2]
    const parameters = parts.slice(3).join(' ')

    return {
      name,
      type,
      parameters,
    }
  }

  return {
    components,
    connections,
    directives,
    models,
    errors,
    parseNetlist,
  }
}
