import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs'
import { useNetlistParser } from './hooks/useNetlistParser'
import { useNgspice } from './hooks/useNgspice'
import EditorPane from './components/EditorPane'
import WaveformPane from './components/WaveformPane'
import TerminalPane from './components/TerminalPane'
import {
  Play,
  Square,
  FileText,
  Activity,
  Terminal,
  ChevronDown,
} from 'lucide-react'

function App() {
  const [netlistText, setNetlistText] = useState(`* RC Low-Pass Filter
V1 in 0 DC 0 AC 1 SIN(0 1 1k)
R1 in out 1k
C1 out 0 1u
.tran 0.1m 5m
.ac dec 20 1 100k
.dc V1 0 5 0.1
.op
.end`)

  const [mode, setMode] = useState('text') // 'text' or 'schematic'
  const [logs, setLogs] = useState([])
  const [showAnalysisDropdown, setShowAnalysisDropdown] = useState(false)
  const [currentAnalysisType, setCurrentAnalysisType] = useState('transient')
  const [showVariablePanel, setShowVariablePanel] = useState(false)

  const { components, connections, directives, errors, parseNetlist } =
    useNetlistParser()
  const {
    isLoaded: ngspiceLoaded,
    isRunning: isSimulating,
    output: ngspiceOutput,
    simulationData,
    availableVariables,
    selectedVariables,
    loadNgspice,
    runSimulation,
    toggleVariable,
  } = useNgspice()

  // Analysis types mapping
  const getAnalysisInfo = useCallback((type) => {
    const analysisTypes = {
      transient: {
        name: 'Transient Analysis',
        command: '.tran',
        description: 'Time-domain analysis',
      },
      ac: {
        name: 'AC Analysis',
        command: '.ac',
        description: 'Frequency-domain analysis',
      },
      dc: {
        name: 'DC Analysis',
        command: '.dc',
        description: 'DC sweep analysis',
      },
      operating_point: {
        name: 'Operating Point',
        command: '.op',
        description: 'DC operating point',
      },
      noise: {
        name: 'Noise Analysis',
        command: '.noise',
        description: 'Noise analysis',
      },
      distortion: {
        name: 'Distortion Analysis',
        command: '.disto',
        description: 'Distortion analysis',
      },
      sensitivity: {
        name: 'Sensitivity Analysis',
        command: '.sens',
        description: 'Sensitivity analysis',
      },
      pole_zero: {
        name: 'Pole-Zero Analysis',
        command: '.pz',
        description: 'Pole-zero analysis',
      },
      sp: {
        name: 'S-Parameter Analysis',
        command: '.sp',
        description: 'S-parameter analysis',
      },
    }
    return (
      analysisTypes[type] || {
        name: 'Unknown Analysis',
        command: '',
        description: '',
      }
    )
  }, [])

  // Logging function
  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toISOString()
    setLogs((prev) => [...prev, { timestamp, message, type }])
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`)
  }, [])

  const handleNetlistChange = useCallback(
    (newText) => {
      setNetlistText(newText)
      const result = parseNetlist(newText)
      addLog(
        `Netlist parsed: ${result.components?.length || 0} components, ${result.errors?.length || 0} errors`
      )
    },
    [parseNetlist, addLog]
  )

  const handleModeChange = useCallback(
    (newMode) => {
      setMode(newMode)
      // Parse netlist when switching to schematic mode to ensure components are available
      if (newMode === 'schematic') {
        const result = parseNetlist(netlistText)
        addLog(
          `Schematic mode: ${result.components?.length || 0} components found`
        )
      }
    },
    [netlistText, parseNetlist, addLog]
  )

  const handleSimulate = useCallback(async () => {
    addLog('Simulation started', 'info')
    addLog(
      `Selected analysis type: ${getAnalysisInfo(currentAnalysisType).name}`,
      'info'
    )
    try {
      const parsed = parseNetlist(netlistText)
      if (parsed.errors.length > 0) {
        addLog(
          `Simulation aborted: ${parsed.errors.length} netlist errors`,
          'error'
        )
        return
      }
      await runSimulation(netlistText)
      addLog('Simulation completed', 'success')
    } catch (error) {
      addLog(`Simulation failed: ${error.message}`, 'error')
    }
  }, [
    netlistText,
    parseNetlist,
    runSimulation,
    addLog,
    currentAnalysisType,
    getAnalysisInfo,
  ])

  useEffect(() => {
    addLog('Loading ngspice...', 'info')
    loadNgspice()
      .then(() => addLog('ngspice loaded successfully', 'success'))
      .catch((err) => {
        addLog(`Failed to load ngspice: ${err.message}`, 'error')
      })
  }, [loadNgspice, addLog])

  // Parse the initial netlist on component mount
  useEffect(() => {
    const result = parseNetlist(netlistText)
    addLog(
      `Initial netlist parsed: ${result.components?.length || 0} components, ${result.errors?.length || 0} errors`
    )
  }, []) // Empty dependency array for one-time execution

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAnalysisDropdown && !event.target.closest('.analysis-dropdown')) {
        setShowAnalysisDropdown(false)
      }
      if (showVariablePanel && !event.target.closest('.variable-dropdown')) {
        setShowVariablePanel(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAnalysisDropdown, showVariablePanel])

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header - Seamlessly integrated with background */}
      <div className="flex-shrink-0">
        <div className="p-2">
          <div className="flex items-center justify-between py-2 lg:py-1 px-2">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">ngspiceX</h1>
              <p className="text-sm text-gray-500">
                Browser-Based SPICE Circuit Simulator
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                {ngspiceLoaded ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-normal">Ready</span>
                  </div>
                ) : logs.some(
                    (log) =>
                      log.type === 'error' &&
                      log.message.includes('Failed to load ngspice')
                  ) ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-md">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-700 font-normal">Failed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-orange-700 font-normal">
                      Loading...
                    </span>
                  </div>
                )}
              </div>
              <Button
                onClick={handleSimulate}
                disabled={
                  isSimulating ||
                  !ngspiceLoaded ||
                  errors.length > 0 ||
                  logs.some(
                    (log) =>
                      log.type === 'error' &&
                      log.message.includes('Failed to load ngspice')
                  )
                }
                size="sm"
                className="btn-sm"
              >
                {isSimulating ? (
                  <>
                    <Square className="w-3 h-3 mr-2" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-2" />
                    Simulate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Fixed heights for consistent sizing */}
      <div className="flex-1 max-w-full mx-auto w-full px-2 py-2">
        {/* Mobile Layout: Fixed height stacked cards */}
        <div className="block lg:hidden space-y-2">
          {/* Circuit Editor Card - Fixed square size */}
          <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl overflow-hidden">
            <CardHeader className="flex-shrink-0 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Circuit Editor
                </CardTitle>
                <Tabs value={mode} onValueChange={handleModeChange}>
                  <TabsList>
                    <TabsTrigger value="text">Text</TabsTrigger>
                    <TabsTrigger value="schematic">Schematic</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-80 w-full">
                <EditorPane
                  mode={mode}
                  netlistText={netlistText}
                  onNetlistChange={handleNetlistChange}
                  components={components}
                  connections={connections}
                  errors={errors}
                />
              </div>
            </CardContent>
          </Card>

          {/* Waveform Viewer Card - Fixed height */}
          <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl overflow-hidden">
            <CardHeader className="flex-shrink-0 border-b border-gray-100 bg-gray-50 rounded-t-xl overflow-visible">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Activity className="w-4 h-4 text-green-600" />
                  Waveform Viewer
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* Variables Button */}
                  {availableVariables.length > 1 && (
                    <div className="relative variable-dropdown">
                      <button
                        onClick={() => setShowVariablePanel(!showVariablePanel)}
                        className="px-3 py-0 lg:py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        Variables ({selectedVariables.size}/
                        {availableVariables.length})
                      </button>

                      {showVariablePanel && (
                        <div className="absolute top-10 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-1 w-48 max-h-48 overflow-y-auto z-[100]">
                          <div className="text-xs font-normal text-gray-700 mb-1 px-1">
                            Select Variables:
                          </div>
                          <div className="space-y-0.5">
                            {availableVariables.map((variable) => (
                              <label
                                key={variable}
                                className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-gray-50 p-2 rounded dropdown-item"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedVariables.has(variable)}
                                  onChange={() => toggleVariable?.(variable)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                                />
                                <span className="text-gray-700 font-mono text-xs truncate">
                                  {variable}
                                </span>
                              </label>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200 flex gap-2 px-1">
                            <button
                              onClick={() =>
                                availableVariables.forEach(
                                  (v) =>
                                    !selectedVariables.has(v) &&
                                    toggleVariable?.(v)
                                )
                              }
                              className="text-xs text-blue-600 hover:text-blue-800 font-normal dropdown-item"
                            >
                              All
                            </button>
                            <button
                              onClick={() =>
                                availableVariables.forEach(
                                  (v) =>
                                    selectedVariables.has(v) &&
                                    toggleVariable?.(v)
                                )
                              }
                              className="text-xs text-gray-600 hover:text-gray-800 font-normal dropdown-item"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Analysis Type Dropdown */}
                  <div className="relative analysis-dropdown">
                    <button
                      onClick={() =>
                        setShowAnalysisDropdown(!showAnalysisDropdown)
                      }
                      className="flex items-center gap-2 px-3 py-0 lg:py-1.5 text-sm font-medium bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <span className="text-gray-700">
                        {
                          getAnalysisInfo(
                            simulationData?.type || currentAnalysisType
                          ).name
                        }
                      </span>
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    </button>

                    {showAnalysisDropdown && (
                      <div className="absolute top-10 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-1 w-52 max-h-64 overflow-y-auto z-[100]">
                        <div className="space-y-0.5">
                          {Object.entries({
                            transient: 'Time-domain analysis',
                            ac: 'Frequency-domain analysis',
                            dc: 'DC sweep analysis',
                            operating_point: 'DC operating point',
                            noise: 'Noise analysis',
                            distortion: 'Distortion analysis',
                            sensitivity: 'Sensitivity analysis',
                            pole_zero: 'Pole-zero analysis',
                            sp: 'S-parameter analysis',
                          }).map(([type, description]) => (
                            <button
                              key={type}
                              onClick={() => {
                                setCurrentAnalysisType(type)
                                setShowAnalysisDropdown(false)
                              }}
                              className={`w-full text-left p-2 rounded transition-colors ${
                                (simulationData?.type ||
                                  currentAnalysisType) === type
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-mono text-xs text-gray-600">
                                  {getAnalysisInfo(type).command}
                                </span>
                                {(simulationData?.type ||
                                  currentAnalysisType) === type && (
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <div className="text-xs font-normal text-gray-800 leading-tight">
                                {getAnalysisInfo(type).name}
                              </div>
                              <div className="text-xs text-gray-500 leading-tight truncate">
                                {description}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className="h-72 w-full"
                style={{ minHeight: 0, maxHeight: '100%' }}
              >
                <WaveformPane
                  data={
                    simulationData
                      ? {
                          ...simulationData,
                          traces:
                            simulationData.traces?.map((trace) => ({
                              ...trace,
                              visible:
                                selectedVariables.size === 0 ||
                                selectedVariables.has(trace.name),
                            })) || [],
                        }
                      : null
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Console Card - Fixed height */}
          <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl overflow-hidden">
            <CardHeader className="flex-shrink-0 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Terminal className="w-4 h-4 text-purple-600" />
                  Console
                </CardTitle>
                <button
                  onClick={() => setLogs([])}
                  className="w-3 h-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors flex items-center justify-center group btn-sm !min-h-0 !min-w-0"
                  title="Clear Logs"
                >
                  <svg
                    className="w-1.5 h-1.5 text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-48 w-full">
                <TerminalPane
                  output={[
                    ...ngspiceOutput,
                    ...logs.map(
                      (log) =>
                        `[${log.timestamp.split('T')[1].split('.')[0]}] ${log.message}`
                    ),
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Layout: Fixed height grid */}
        <div
          className="hidden lg:grid lg:grid-cols-12 lg:gap-2 lg:h-[calc(100vh-5rem)]"
          style={{ minHeight: 0 }}
        >
          {/* Left Column: Circuit Editor (spans 5 columns) - Fixed height */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <Card className="h-full shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col rounded-xl overflow-hidden">
              <CardHeader className="flex-shrink-0 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Circuit Editor
                  </CardTitle>
                  <Tabs value={mode} onValueChange={handleModeChange}>
                    <TabsList>
                      <TabsTrigger value="text">Text</TabsTrigger>
                      <TabsTrigger value="schematic">Schematic</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <EditorPane
                  mode={mode}
                  netlistText={netlistText}
                  onNetlistChange={handleNetlistChange}
                  components={components}
                  connections={connections}
                  errors={errors}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Waveform and Console (spans 7 columns) */}
          <div
            className="lg:col-span-7 flex flex-col h-full gap-2"
            style={{ minHeight: 0 }}
          >
            {/* Waveform Viewer - Fixed height (65% of available space) */}
            <Card className="h-[65%] shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col rounded-xl overflow-hidden">
              <CardHeader className="flex-shrink-0 border-b border-gray-100 bg-gray-50 rounded-t-xl overflow-visible">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Activity className="w-4 h-4 text-green-600" />
                    Waveform Viewer
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Variables Button */}
                    {availableVariables.length > 1 && (
                      <div className="relative variable-dropdown">
                        <button
                          onClick={() =>
                            setShowVariablePanel(!showVariablePanel)
                          }
                          className="px-3 py-0 lg:py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                          Variables ({selectedVariables.size}/
                          {availableVariables.length})
                        </button>

                        {showVariablePanel && (
                          <div className="absolute top-10 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-1 w-48 max-h-48 overflow-y-auto z-[100]">
                            <div className="text-xs font-normal text-gray-700 mb-1 px-1">
                              Select Variables:
                            </div>
                            <div className="space-y-0.5">
                              {availableVariables.map((variable) => (
                                <label
                                  key={variable}
                                  className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-gray-50 p-2 rounded dropdown-item"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedVariables.has(variable)}
                                    onChange={() => toggleVariable?.(variable)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                                  />
                                  <span className="text-gray-700 font-mono text-xs truncate">
                                    {variable}
                                  </span>
                                </label>
                              ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200 flex gap-2 px-1">
                              <button
                                onClick={() =>
                                  availableVariables.forEach(
                                    (v) =>
                                      !selectedVariables.has(v) &&
                                      toggleVariable?.(v)
                                  )
                                }
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium dropdown-item"
                              >
                                All
                              </button>
                              <button
                                onClick={() =>
                                  availableVariables.forEach(
                                    (v) =>
                                      selectedVariables.has(v) &&
                                      toggleVariable?.(v)
                                  )
                                }
                                className="text-xs text-gray-600 hover:text-gray-800 font-medium dropdown-item"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Analysis Type Dropdown */}
                    <div className="relative analysis-dropdown">
                      <button
                        onClick={() =>
                          setShowAnalysisDropdown(!showAnalysisDropdown)
                        }
                        className="flex items-center gap-2 px-3 py-0 lg:py-1.5 text-sm font-medium bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <span className="text-gray-700">
                          {
                            getAnalysisInfo(
                              simulationData?.type || currentAnalysisType
                            ).name
                          }
                        </span>
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      </button>

                      {showAnalysisDropdown && (
                        <div className="absolute top-10 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-1 w-52 max-h-64 overflow-y-auto z-[100]">
                          <div className="space-y-0.5">
                            {Object.entries({
                              transient: 'Time-domain analysis',
                              ac: 'Frequency-domain analysis',
                              dc: 'DC sweep analysis',
                              operating_point: 'DC operating point',
                              noise: 'Noise analysis',
                              distortion: 'Distortion analysis',
                              sensitivity: 'Sensitivity analysis',
                              pole_zero: 'Pole-zero analysis',
                              sp: 'S-parameter analysis',
                            }).map(([type, description]) => (
                              <button
                                key={type}
                                onClick={() => {
                                  setCurrentAnalysisType(type)
                                  setShowAnalysisDropdown(false)
                                }}
                                className={`w-full text-left p-2 rounded transition-colors ${
                                  (simulationData?.type ||
                                    currentAnalysisType) === type
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="font-mono text-xs text-gray-600">
                                    {getAnalysisInfo(type).command}
                                  </span>
                                  {(simulationData?.type ||
                                    currentAnalysisType) === type && (
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  )}
                                </div>
                                <div className="text-xs font-medium text-gray-800 leading-tight">
                                  {getAnalysisInfo(type).name}
                                </div>
                                <div className="text-xs text-gray-500 leading-tight truncate">
                                  {description}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent
                className="p-0 flex-1 overflow-hidden"
                style={{ minHeight: 0 }}
              >
                <div
                  className="h-full w-full"
                  style={{ minHeight: 0, maxHeight: '100%' }}
                >
                  <WaveformPane
                    data={
                      simulationData
                        ? {
                            ...simulationData,
                            traces:
                              simulationData.traces?.map((trace) => ({
                                ...trace,
                                visible:
                                  selectedVariables.size === 0 ||
                                  selectedVariables.has(trace.name),
                              })) || [],
                          }
                        : null
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Console - Fixed height (35% of available space) */}
            <Card className="h-[35%] shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col rounded-xl overflow-hidden">
              <CardHeader className="flex-shrink-0 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Terminal className="w-4 h-4 text-purple-600" />
                    Console
                  </CardTitle>
                  <button
                    onClick={() => setLogs([])}
                    className="w-3 h-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors flex items-center justify-center group btn-sm !min-h-0 !min-w-0"
                    title="Clear Logs"
                  >
                    <svg
                      className="w-1.5 h-1.5 text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <TerminalPane
                  output={[
                    ...ngspiceOutput,
                    ...logs.map(
                      (log) =>
                        `[${log.timestamp.split('T')[1].split('.')[0]}] ${log.message}`
                    ),
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
