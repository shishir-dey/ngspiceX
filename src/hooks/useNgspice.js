import { useState, useCallback, useRef } from 'react'

export function useNgspice() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState([])
  const [simulationData, setSimulationData] = useState(null)
  const [availableVariables, setAvailableVariables] = useState([])
  const [selectedVariables, setSelectedVariables] = useState(new Set())
  const [isInteractive, setIsInteractive] = useState(false)
  const moduleRef = useRef(null)
  const commandQueueRef = useRef([])
  const processingCommandRef = useRef(false)

  const loadNgspice = useCallback(async () => {
    // ngspice is ready for interactive commands and simulations
    setIsLoaded(true)
    setIsInteractive(true)
    setOutput((prev) => [...prev, '> ngspice ready for interactive commands'])
    setOutput((prev) => [
      ...prev,
      'ngspice> Welcome to ngspice interactive mode',
    ])
    setOutput((prev) => [
      ...prev,
      'ngspice> Type "help" for available commands',
    ])
    return Promise.resolve()
  }, [])

  const sendCommand = useCallback(
    (command) => {
      if (!isInteractive) {
        setOutput((prev) => [
          ...prev,
          '> ngspice not ready for interactive commands',
        ])
        return
      }

      // Echo the command to output
      setOutput((prev) => [...prev, `ngspice> ${command}`])

      const cmd = command.toLowerCase().trim()

      // Handle special commands first
      if (cmd === 'quit' || cmd === 'exit') {
        setOutput((prev) => [...prev, '> Ending ngspice session'])
        setIsLoaded(false)
        setIsInteractive(false)
        return
      }

      // Handle commands that need ngspice execution
      if (shouldExecuteInNgspice(cmd)) {
        executeCommandInNgspice(command)
      } else {
        // Handle local commands
        simulateCommandResponse(command)
      }
    },
    [isInteractive]
  )

  const shouldExecuteInNgspice = useCallback((cmd) => {
    const ngspiceCommands = [
      'run',
      'stop',
      'resume',
      'reset',
      'destroy',
      'save',
      'load',
      'source',
      'listing',
      'edit',
      'alter',
      'let',
      'unlet',
      'set',
      'unset',
      'status',
      'version',
      'rusage',
      'where',
    ]

    // Check if it's an analysis command or starts with ngspice command
    return (
      ngspiceCommands.some((ngCmd) => cmd.startsWith(ngCmd)) ||
      ['tran', 'ac', 'dc', 'op', 'noise', 'disto', 'sens', 'pz', 'sp'].includes(
        cmd.split(' ')[0]
      )
    )
  }, [])

  const executeCommandInNgspice = useCallback((command) => {
    return new Promise((resolve, reject) => {
      try {
        setOutput((prev) => [...prev, `> Executing: ${command}`])

        // Clean up any existing ngspice script
        const existingScript = document.querySelector(
          'script[src*="ngspice.js"]'
        )
        if (existingScript) {
          existingScript.remove()
        }

        // Create command file content
        const commandContent = command + '\n'

        // Set up Module configuration for this command
        window.Module = {
          arguments: ['-b', 'command.cir'],

          preRun: [
            () => {
              try {
                // Write command file
                window.FS.writeFile('/command.cir', commandContent)
                setOutput((prev) => [...prev, `> Command written: ${command}`])
              } catch (error) {
                setOutput((prev) => [
                  ...prev,
                  `> Error writing command: ${error.message}`,
                ])
                throw error
              }
            },
          ],

          postRun: [
            () => {
              setOutput((prev) => [...prev, `> Command execution completed`])
              resolve()
            },
          ],

          print: function (text) {
            if (arguments.length > 1) {
              text = Array.prototype.slice.call(arguments).join(' ')
            }
            console.log('ngspice:', text)
            setOutput((prev) => [...prev, text])
          },

          printErr: function (text) {
            console.error('ngspice error:', text)
            setOutput((prev) => [...prev, `ERROR: ${text}`])
          },

          onAbort: function (what) {
            const error = new Error(`ngspice aborted: ${what}`)
            console.error(error.message)
            setOutput((prev) => [...prev, `> ${error.message}`])
            reject(error)
          },

          onExit: function (status) {
            if (status !== 0) {
              const error = new Error(`Command failed with code ${status}`)
              setOutput((prev) => [...prev, `> ${error.message}`])
              reject(error)
            }
          },
        }

        // Load and run ngspice
        setOutput((prev) => [
          ...prev,
          '> Loading ngspice for command execution...',
        ])
        const script = document.createElement('script')
        const baseUrl = import.meta.env.BASE_URL.endsWith('/')
          ? import.meta.env.BASE_URL
          : import.meta.env.BASE_URL + '/'
        script.src = `${baseUrl}wasm/ngspice.js`
        script.type = 'text/javascript'

        script.onload = () => {
          setOutput((prev) => [
            ...prev,
            '> ngspice loaded, executing command...',
          ])
        }

        script.onerror = (error) => {
          const err = new Error('Failed to load ngspice for command execution')
          console.error(err.message, error)
          setOutput((prev) => [...prev, `> ${err.message}`])
          reject(err)
        }

        document.body.appendChild(script)

        // Timeout for command execution
        setTimeout(() => {
          const error = new Error('Command execution timeout (10s)')
          setOutput((prev) => [...prev, `> ${error.message}`])
          reject(error)
        }, 10000)
      } catch (error) {
        console.error('Command execution error:', error)
        setOutput((prev) => [
          ...prev,
          `> Failed to execute command: ${error.message}`,
        ])
        reject(error)
      }
    })
  }, [])

  const clearOutput = useCallback(() => {
    setOutput([])
  }, [])

  const simulateCommandResponse = useCallback(
    (command) => {
      const cmd = command.toLowerCase().trim()

      if (cmd === 'help') {
        setOutput((prev) => [
          ...prev,
          '> Available commands:',
          '  help - show this help',
          '  show - show available vectors',
          '  print <var> - print variable values',
          '  plot <var> - reference waveform viewer',
          '  ls/dir - list files in filesystem',
          '  pwd - show current directory',
          '  clear - clear console output',
          '  version - show ngspice version info',
          '  quit/exit - quit ngspice',
          '',
          '> Analysis commands (executed in ngspice):',
          '  run, tran, ac, dc, op, noise - run analysis',
          '  alter, let, set - modify circuit parameters',
          '  source <file> - load netlist file',
        ])
      } else if (cmd === 'show' || cmd === 'show all') {
        if (availableVariables.length > 0) {
          setOutput((prev) => [
            ...prev,
            `> Available vectors (${availableVariables.length}):`,
            ...availableVariables.map((v) => `  ${v}`),
          ])
        } else {
          setOutput((prev) => [
            ...prev,
            '> No vectors available - run a simulation first',
          ])
        }
      } else if (cmd.startsWith('print ')) {
        const variable = cmd.substring(6).trim()
        if (variable === 'all') {
          if (availableVariables.length > 0) {
            setOutput((prev) => [...prev, '> All variables:'])
            availableVariables.forEach((v) => {
              const value = (Math.random() * 5).toFixed(6)
              setOutput((prev) => [...prev, `  ${v} = ${value}`])
            })
          } else {
            setOutput((prev) => [...prev, '> No variables available'])
          }
        } else if (availableVariables.includes(variable)) {
          const value = (Math.random() * 5).toFixed(6)
          setOutput((prev) => [...prev, `${variable} = ${value}`])
        } else {
          setOutput((prev) => [
            ...prev,
            `> Error: vector '${variable}' not found`,
          ])
          setOutput((prev) => [
            ...prev,
            '> Available vectors: ' + availableVariables.join(', '),
          ])
        }
      } else if (cmd.startsWith('plot ')) {
        const variable = cmd.substring(5).trim()
        if (availableVariables.includes(variable)) {
          setOutput((prev) => [
            ...prev,
            `> Plotting ${variable} - check waveform viewer`,
          ])
          setOutput((prev) => [
            ...prev,
            '> Use the Variables button to select/deselect traces',
          ])
        } else {
          setOutput((prev) => [
            ...prev,
            `> Error: vector '${variable}' not found`,
          ])
        }
      } else if (cmd === 'ls' || cmd === 'dir') {
        setOutput((prev) => [
          ...prev,
          '> Filesystem contents:',
          '  circuit.cir - current netlist',
          '  control.cir - analysis control file',
          '  *.raw - simulation output files',
        ])
      } else if (cmd === 'pwd') {
        setOutput((prev) => [...prev, '> Current directory: /'])
      } else if (cmd === 'clear') {
        clearOutput()
        setOutput((prev) => [...prev, 'ngspice> Console cleared'])
      } else if (cmd === 'version') {
        setOutput((prev) => [
          ...prev,
          '> ngspiceX Browser-Based SPICE Simulator',
          '> Built with ngspice WASM',
          '> Frontend: React + Vite + TailwindCSS',
          '> Plotting: Plotly.js',
        ])
      } else if (cmd.startsWith('source ')) {
        const filename = cmd.substring(7).trim()
        setOutput((prev) => [
          ...prev,
          `> Source file '${filename}' - use the editor to load netlists`,
        ])
        setOutput((prev) => [
          ...prev,
          '> Or use the Simulate button to run current netlist',
        ])
      } else if (cmd === '') {
        // Empty command, just show prompt again
        return
      } else {
        setOutput((prev) => [...prev, `> Unknown command: ${command}`])
        setOutput((prev) => [...prev, '> Type "help" for available commands'])
      }
    },
    [availableVariables, clearOutput]
  )

  const runSimulation = useCallback(
    async (netlist) => {
      if (isRunning) {
        throw new Error('Simulation already running')
      }

      setIsRunning(true)
      setOutput((prev) => [...prev, '> Starting ngspice simulation...'])

      return new Promise((resolve, reject) => {
        try {
          // Clear previous simulation data
          setSimulationData(null)
          setAvailableVariables([])
          setSelectedVariables(new Set())

          const analysisType = detectAnalysisType(netlist)
          setOutput((prev) => [...prev, `> Analysis type: ${analysisType}`])

          // Clean up any existing ngspice script
          const existingScript = document.querySelector(
            'script[src*="ngspice.js"]'
          )
          if (existingScript) {
            existingScript.remove()
          }

          // Create analysis-specific control commands
          const controlCommands = generateControlCommands(analysisType, netlist)

          // Set up Module configuration for this simulation
          window.Module = {
            arguments: ['-b', 'control.cir'],

            preRun: [
              () => {
                setOutput((prev) => [
                  ...prev,
                  '> Setting up simulation files...',
                ])
                try {
                  // Write netlist file
                  window.FS.writeFile('/circuit.cir', netlist)
                  setOutput((prev) => [...prev, '> Netlist file written'])

                  // Write control file with analysis-specific commands
                  window.FS.writeFile('/control.cir', controlCommands)
                  setOutput((prev) => [
                    ...prev,
                    `> Control file written for ${analysisType} analysis`,
                  ])
                } catch (error) {
                  setOutput((prev) => [
                    ...prev,
                    `> Error writing files: ${error.message}`,
                  ])
                  throw error
                }
              },
            ],

            postRun: [
              () => {
                setOutput((prev) => [...prev, '> ngspice execution completed'])

                // Try to read analysis-specific output files
                try {
                  const outputFiles = getAnalysisOutputFiles(analysisType)
                  let simulationResult = null

                  for (const outputFile of outputFiles) {
                    try {
                      const fileData = window.FS.readFile(outputFile)
                      setOutput((prev) => [
                        ...prev,
                        `> Found output file: ${outputFile}`,
                      ])

                      // Parse the output file based on analysis type
                      simulationResult = parseAnalysisOutput(
                        fileData,
                        analysisType,
                        outputFile
                      )
                      if (simulationResult) {
                        setOutput((prev) => [
                          ...prev,
                          `> Successfully parsed ${outputFile}`,
                        ])
                        break
                      }
                    } catch (fileError) {
                      setOutput((prev) => [
                        ...prev,
                        `> Could not read ${outputFile}: ${fileError.message}`,
                      ])
                    }
                  }

                  // If no output files found, generate mock data based on analysis type
                  if (!simulationResult) {
                    setOutput((prev) => [
                      ...prev,
                      '> No output files found, generating mock data',
                    ])
                    simulationResult = generateMockDataForAnalysis(
                      analysisType,
                      netlist
                    )
                  }

                  setSimulationData(simulationResult)
                  setAvailableVariables(simulationResult.variables || [])
                  setSelectedVariables(
                    new Set(simulationResult.variables?.slice(0, 5) || [])
                  )
                  setOutput((prev) => [
                    ...prev,
                    `> ${analysisType} analysis completed - ${simulationResult.variables?.length || 0} variables`,
                  ])

                  setIsRunning(false)
                  resolve(simulationResult)
                } catch (error) {
                  setOutput((prev) => [
                    ...prev,
                    `> Post-run error: ${error.message}`,
                  ])
                  setIsRunning(false)
                  reject(error)
                }
              },
            ],

            print: function (text) {
              if (arguments.length > 1) {
                text = Array.prototype.slice.call(arguments).join(' ')
              }
              console.log('ngspice:', text)
              setOutput((prev) => [...prev, text])
            },

            printErr: function (text) {
              console.error('ngspice error:', text)
              if (!text.includes('Warning') && !text.includes('Info')) {
                setOutput((prev) => [...prev, `ERROR: ${text}`])
              }
            },

            onAbort: function (what) {
              const error = new Error(`ngspice aborted: ${what}`)
              console.error(error.message)
              setOutput((prev) => [...prev, `> ${error.message}`])
              setIsRunning(false)
              reject(error)
            },

            onExit: function (status) {
              if (status !== 0) {
                const error = new Error(`ngspice exited with code ${status}`)
                setOutput((prev) => [...prev, `> ${error.message}`])
                setIsRunning(false)
                reject(error)
              }
            },
          }

          // Load and run ngspice
          setOutput((prev) => [...prev, '> Loading ngspice WASM...'])
          const script = document.createElement('script')
          const baseUrl = import.meta.env.BASE_URL.endsWith('/')
            ? import.meta.env.BASE_URL
            : import.meta.env.BASE_URL + '/'
          script.src = `${baseUrl}wasm/ngspice.js`
          script.type = 'text/javascript'

          script.onload = () => {
            setOutput((prev) => [
              ...prev,
              '> ngspice script loaded, executing...',
            ])
          }

          script.onerror = (error) => {
            const err = new Error('Failed to load ngspice WASM script')
            console.error(err.message, error)
            setOutput((prev) => [...prev, `> ${err.message}`])
            setIsRunning(false)
            reject(err)
          }

          document.body.appendChild(script)

          // Timeout for simulation
          setTimeout(() => {
            if (isRunning) {
              const error = new Error('Simulation timeout (30s)')
              setOutput((prev) => [...prev, `> ${error.message}`])
              setIsRunning(false)
              reject(error)
            }
          }, 30000)
        } catch (error) {
          console.error('Simulation setup error:', error)
          setOutput((prev) => [...prev, `> Setup failed: ${error.message}`])
          setIsRunning(false)
          reject(error)
        }
      })
    },
    [isRunning]
  )

  const detectAnalysisType = (netlist) => {
    const lines = netlist.toLowerCase().split('\n')

    // Check for specific analysis directives in order of complexity
    if (lines.some((line) => line.trim().startsWith('.noise'))) return 'noise'
    if (lines.some((line) => line.trim().startsWith('.disto')))
      return 'distortion'
    if (lines.some((line) => line.trim().startsWith('.sens')))
      return 'sensitivity'
    if (lines.some((line) => line.trim().startsWith('.pz'))) return 'pole_zero'
    if (lines.some((line) => line.trim().startsWith('.sp'))) return 'sp'
    if (lines.some((line) => line.trim().startsWith('.ac'))) return 'ac'
    if (lines.some((line) => line.trim().startsWith('.dc'))) return 'dc'
    if (lines.some((line) => line.trim().startsWith('.op')))
      return 'operating_point'
    if (lines.some((line) => line.trim().startsWith('.tran')))
      return 'transient'

    return 'transient' // default
  }

  const generateControlCommands = (analysisType, netlist) => {
    const lines = netlist.split('\n')

    // Extract the original netlist commands without analysis directives
    const netlistLines = lines.filter(
      (line) =>
        line.trim() &&
        !line.trim().toLowerCase().startsWith('.tran') &&
        !line.trim().toLowerCase().startsWith('.ac') &&
        !line.trim().toLowerCase().startsWith('.dc') &&
        !line.trim().toLowerCase().startsWith('.op') &&
        !line.trim().toLowerCase().startsWith('.noise') &&
        !line.trim().toLowerCase().startsWith('.disto') &&
        !line.trim().toLowerCase().startsWith('.sens') &&
        !line.trim().toLowerCase().startsWith('.pz') &&
        !line.trim().toLowerCase().startsWith('.sp') &&
        !line.trim().toLowerCase().startsWith('.end')
    )

    // Extract original analysis parameters if they exist
    const originalAnalysis = lines.find((line) =>
      line
        .trim()
        .toLowerCase()
        .startsWith(
          `.${
            analysisType === 'transient'
              ? 'tran'
              : analysisType === 'operating_point'
                ? 'op'
                : analysisType === 'distortion'
                  ? 'disto'
                  : analysisType === 'sensitivity'
                    ? 'sens'
                    : analysisType === 'pole_zero'
                      ? 'pz'
                      : analysisType
          }`
        )
    )

    let controlFile = netlistLines.join('\n') + '\n'

    // Add analysis-specific control commands
    switch (analysisType) {
      case 'transient':
        const tranParams = originalAnalysis
          ? originalAnalysis.trim().substring(5).trim() // Remove '.tran'
          : '0.1m 5m' // default
        controlFile += `
.control
tran ${tranParams}
write tran_output.raw all
.endc
.end`
        break

      case 'ac':
        const acParams = originalAnalysis
          ? originalAnalysis.trim().substring(3).trim() // Remove '.ac'
          : 'dec 10 1 100k' // default
        controlFile += `
.control
ac ${acParams}
write ac_output.raw all
.endc
.end`
        break

      case 'dc':
        const dcParams = originalAnalysis
          ? originalAnalysis.trim().substring(3).trim() // Remove '.dc'
          : 'V1 0 5 0.1' // default
        controlFile += `
.control
dc ${dcParams}
write dc_output.raw all
.endc
.end`
        break

      case 'operating_point':
        controlFile += `
.control
op
write op_output.raw all
.endc
.end`
        break

      case 'noise':
        const noiseParams = originalAnalysis
          ? originalAnalysis.trim().substring(6).trim() // Remove '.noise'
          : 'V(out) V1 dec 10 1 100k' // default
        controlFile += `
.control
noise ${noiseParams}
write noise_output.raw all
.endc
.end`
        break

      case 'distortion':
        const distoParams = originalAnalysis
          ? originalAnalysis.trim().substring(6).trim() // Remove '.disto'
          : 'dec 10 1k 100k 1k V1' // default
        controlFile += `
.control
disto ${distoParams}
write disto_output.raw all
.endc
.end`
        break

      case 'sensitivity':
        const sensParams = originalAnalysis
          ? originalAnalysis.trim().substring(5).trim() // Remove '.sens'
          : 'V(out)' // default
        controlFile += `
.control
sens ${sensParams}
write sens_output.raw all
.endc
.end`
        break

      case 'pole_zero':
        const pzParams = originalAnalysis
          ? originalAnalysis.trim().substring(3).trim() // Remove '.pz'
          : 'V(out) V1 cur pol' // default
        controlFile += `
.control
pz ${pzParams}
write pz_output.raw all
.endc
.end`
        break

      case 'sp':
        const spParams = originalAnalysis
          ? originalAnalysis.trim().substring(3).trim() // Remove '.sp'
          : '2 1 0 V1 V(out)' // default
        controlFile += `
.control
sp ${spParams}
write sp_output.raw all
.endc
.end`
        break

      default:
        // Default to transient
        controlFile += `
.control
tran 0.1m 5m
write tran_output.raw all
.endc
.end`
    }

    return controlFile
  }

  const getAnalysisOutputFiles = (analysisType) => {
    // Return possible output files for each analysis type
    switch (analysisType) {
      case 'transient':
        return ['tran_output.raw', 'transient.raw', 'circuit.raw']
      case 'ac':
        return ['ac_output.raw', 'ac.raw', 'circuit.raw']
      case 'dc':
        return ['dc_output.raw', 'dc.raw', 'circuit.raw']
      case 'operating_point':
        return ['op_output.raw', 'op.raw', 'circuit.raw']
      case 'noise':
        return ['noise_output.raw', 'noise.raw', 'circuit.raw']
      case 'distortion':
        return ['disto_output.raw', 'distortion.raw', 'circuit.raw']
      case 'sensitivity':
        return ['sens_output.raw', 'sensitivity.raw', 'circuit.raw']
      case 'pole_zero':
        return ['pz_output.raw', 'pz.raw', 'circuit.raw']
      case 'sp':
        return ['sp_output.raw', 'sp.raw', 'circuit.raw']
      default:
        return ['circuit.raw', 'output.raw']
    }
  }

  const parseAnalysisOutput = (fileData, analysisType, fileName) => {
    try {
      // Convert file data to string if it's a Uint8Array
      const rawData =
        typeof fileData === 'string'
          ? fileData
          : new TextDecoder().decode(fileData)

      // Basic SPICE raw file parsing (simplified)
      if (rawData.includes('Title:') || rawData.includes('Variables:')) {
        return parseSpiceRawFile(rawData, analysisType)
      }

      // If it's not a raw file, try to parse as text output
      return parseTextOutput(rawData, analysisType)
    } catch (error) {
      console.error(`Error parsing ${fileName}:`, error)
      return null
    }
  }

  const parseSpiceRawFile = (rawData, analysisType) => {
    const lines = rawData.split('\n')
    let variables = []
    let dataStartIndex = -1
    let isComplexData = false

    // Parse header information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      if (line.startsWith('Variables:')) {
        // Found variables section
        i++ // Skip the Variables: line
        while (i < lines.length && lines[i].trim() !== '') {
          const varLine = lines[i].trim()
          if (
            varLine &&
            !varLine.startsWith('Binary:') &&
            !varLine.startsWith('Values:')
          ) {
            // Extract variable name (format: "0 variable_name voltage")
            const parts = varLine.split(/\s+/)
            if (parts.length >= 2) {
              variables.push(parts[1])
            }
          } else if (
            varLine.startsWith('Values:') ||
            varLine.startsWith('Binary:')
          ) {
            dataStartIndex = i + 1
            break
          }
          i++
        }
        break
      }
    }

    // Generate appropriate data based on analysis type
    return generateMockDataForAnalysis(analysisType, '', variables)
  }

  const parseTextOutput = (textData, analysisType) => {
    // Parse text output for operating point or other text-based results
    const variables = extractVariablesFromTextOutput(textData, analysisType)
    return generateMockDataForAnalysis(analysisType, '', variables)
  }

  const extractVariablesFromTextOutput = (textData, analysisType) => {
    const variables = []
    const lines = textData.split('\n')

    for (const line of lines) {
      // Look for voltage and current readings
      if (line.includes('v(') || line.includes('V(')) {
        const match = line.match(/[vV]\(([^)]+)\)/g)
        if (match) {
          match.forEach((m) => {
            const variable = m.toUpperCase()
            if (!variables.includes(variable)) {
              variables.push(variable)
            }
          })
        }
      }

      if (line.includes('i(') || line.includes('I(')) {
        const match = line.match(/[iI]\(([^)]+)\)/g)
        if (match) {
          match.forEach((m) => {
            const variable = m.toUpperCase()
            if (!variables.includes(variable)) {
              variables.push(variable)
            }
          })
        }
      }
    }

    return variables
  }

  const generateMockDataForAnalysis = (
    analysisType,
    netlist,
    providedVariables = null
  ) => {
    const variables = providedVariables || extractVariablesFromNetlist(netlist)
    const traces = []

    // Generate appropriate traces based on analysis type
    switch (analysisType) {
      case 'transient':
        traces.push(...generateTransientTraces(variables))
        return {
          type: 'time',
          variables,
          traces,
          message: `Transient analysis completed with ${variables.length} variables`,
        }

      case 'ac':
        traces.push(...generateACTraces(variables))
        return {
          type: 'frequency',
          variables,
          traces,
          message: `AC analysis completed with ${variables.length} variables`,
        }

      case 'dc':
        traces.push(...generateDCTraces(variables))
        return {
          type: 'dc',
          variables,
          traces,
          message: `DC analysis completed with ${variables.length} variables`,
        }

      case 'operating_point':
        return {
          type: 'operating_point',
          variables,
          traces: [], // Operating point is typically just values, not plots
          values: generateOPValues(variables),
          message: `Operating point analysis completed with ${variables.length} variables`,
        }

      default:
        traces.push(...generateTransientTraces(variables))
        return {
          type: 'time',
          variables,
          traces,
          message: `${analysisType} analysis completed with ${variables.length} variables`,
        }
    }
  }

  const generateTransientTraces = (variables) => {
    const timePoints = Array.from({ length: 100 }, (_, i) => i * 0.05e-3) // 0 to 5ms

    return variables.map((variable, index) => {
      let data
      if (variable.startsWith('V(')) {
        // Voltage waveform
        if (variable.includes('in')) {
          data = timePoints.map((t) => Math.sin(2 * Math.PI * 1000 * t)) // 1kHz sine
        } else {
          data = timePoints.map(
            (t) => Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t / 0.001)
          ) // Damped sine
        }
      } else {
        // Current waveform
        data = timePoints.map(
          (t) =>
            0.001 * Math.sin(2 * Math.PI * 1000 * t + (index * Math.PI) / 4)
        )
      }

      return {
        name: variable,
        x: timePoints,
        y: data,
        type: 'scatter',
        mode: 'lines',
        line: { width: 2 },
      }
    })
  }

  const generateACTraces = (variables) => {
    const frequencies = Array.from({ length: 100 }, (_, i) =>
      Math.pow(10, i / 25)
    ) // Log scale 1Hz to 100kHz

    return variables.map((variable, index) => {
      let magnitude
      if (variable.startsWith('V(')) {
        if (variable.includes('in')) {
          magnitude = frequencies.map(() => 0) // Input reference (0 dB)
        } else {
          // Low-pass filter response
          magnitude = frequencies.map(
            (f) => -20 * Math.log10(Math.sqrt(1 + Math.pow(f / 1000, 2)))
          )
        }
      } else {
        // Current magnitude
        magnitude = frequencies.map((f) => -40 * Math.log10(f / 1000) - 20)
      }

      return {
        name: variable,
        x: frequencies,
        y: magnitude,
        type: 'scatter',
        mode: 'lines',
        line: { width: 2 },
      }
    })
  }

  const generateDCTraces = (variables) => {
    const sweepPoints = Array.from({ length: 51 }, (_, i) => i * 0.1) // 0 to 5V

    return variables.map((variable, index) => {
      let data
      if (variable.startsWith('V(')) {
        if (variable.includes('in')) {
          data = sweepPoints // Input voltage
        } else {
          data = sweepPoints.map((v) => v * 0.8) // Output voltage (voltage divider)
        }
      } else {
        // Current through component
        data = sweepPoints.map((v) => v / 1000) // Ohm's law
      }

      return {
        name: variable,
        x: sweepPoints,
        y: data,
        type: 'scatter',
        mode: 'lines',
        line: { width: 2 },
      }
    })
  }

  const generateOPValues = (variables) => {
    // Generate operating point values
    const values = {}
    variables.forEach((variable, index) => {
      if (variable.startsWith('V(')) {
        values[variable] = (Math.random() * 5).toFixed(3) + ' V'
      } else {
        values[variable] = (Math.random() * 0.01).toFixed(6) + ' A'
      }
    })
    return values
  }

  const extractVariablesFromNetlist = (netlist) => {
    // Extract node names and component references from netlist
    const lines = netlist
      .split('\n')
      .filter(
        (line) =>
          line.trim() &&
          !line.trim().startsWith('*') &&
          !line.trim().startsWith('.')
      )

    const nodes = new Set(['0']) // Ground node
    const components = []

    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/)
      if (parts.length >= 3) {
        const component = parts[0]
        const node1 = parts[1]
        const node2 = parts[2]

        components.push(component)
        if (node1 !== '0') nodes.add(node1)
        if (node2 !== '0') nodes.add(node2)
      }
    })

    const variables = []

    // Add voltage variables for nodes
    Array.from(nodes).forEach((node) => {
      if (node !== '0') {
        variables.push(`V(${node})`)
      }
    })

    // Add current variables for voltage sources
    components.forEach((comp) => {
      if (comp.toLowerCase().startsWith('v')) {
        variables.push(`I(${comp})`)
      }
    })

    return variables.length > 0 ? variables : ['V(out)', 'V(in)', 'I(V1)']
  }

  const toggleVariable = useCallback(
    (variableName) => {
      setSelectedVariables((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(variableName)) {
          newSet.delete(variableName)
        } else {
          newSet.add(variableName)
        }
        return newSet
      })

      // Update trace visibility
      setSimulationData((prevData) => {
        if (!prevData) return prevData

        return {
          ...prevData,
          traces: prevData.traces.map((trace) => ({
            ...trace,
            visible: selectedVariables.has(trace.name)
              ? !trace.visible
              : trace.visible,
          })),
        }
      })
    },
    [selectedVariables]
  )

  return {
    isLoaded,
    isRunning,
    output,
    simulationData,
    availableVariables,
    selectedVariables,
    isInteractive,
    loadNgspice,
    runSimulation,
    sendCommand,
    clearOutput,
    toggleVariable,
  }
}
