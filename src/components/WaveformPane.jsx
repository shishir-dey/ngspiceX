import React, { useEffect, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist-min'

const WaveformPane = ({ data }) => {
  const plotRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (plotRef.current && data) {
      renderPlot()
    } else if (plotRef.current && !data) {
      clearPlot()
    }
  }, [data])

  // Add resize observer to handle container size changes
  useEffect(() => {
    if (!containerRef.current || !plotRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (plotRef.current && data) {
        setTimeout(() => {
          Plotly.Plots.resize(plotRef.current)
        }, 100)
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [data])

  const renderPlot = () => {
    if (!data || !plotRef.current) return

    // Use all traces from data (filtering is handled at a higher level)
    const filteredTraces = data.traces || []

    const layout = {
      title: {
        text: getPlotTitle(data.type),
        font: { size: 16, color: 'currentColor' },
        x: 0.05,
        xanchor: 'left',
        pad: { t: 15, b: 10 },
      },
      xaxis: {
        title: getXAxisTitle(data.type),
        gridcolor: 'rgba(128,128,128,0.2)',
        zerolinecolor: 'rgba(128,128,128,0.4)',
        color: 'currentColor',
        titlefont: { size: 12 },
        tickfont: { size: 10 },
        automargin: false,
        side: 'bottom',
        fixedrange: false,
      },
      yaxis: {
        title: getYAxisTitle(data.type),
        gridcolor: 'rgba(128,128,128,0.2)',
        zerolinecolor: 'rgba(128,128,128,0.4)',
        color: 'currentColor',
        titlefont: { size: 12 },
        tickfont: { size: 10 },
        automargin: false,
        side: 'left',
        fixedrange: false,
      },
      plot_bgcolor: 'transparent',
      paper_bgcolor: 'transparent',
      font: {
        family:
          '-apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, system-ui, sans-serif',
        color: 'currentColor',
        size: 11,
      },
      margin: {
        l: 80,
        r: 50,
        t: 80,
        b: 70,
      },
      showlegend: true,
      legend: {
        x: 0.02,
        y: 0.98,
        bgcolor: 'rgba(255,255,255,0.95)',
        bordercolor: 'rgba(128,128,128,0.3)',
        borderwidth: 1,
        font: { size: 10 },
        orientation: 'v',
      },
      hovermode: 'x unified',
      autosize: true,
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: [
        'select2d',
        'lasso2d',
        'toggleHover',
        'toggleSpikelines',
      ],
      modeBarButtonsToAdd: [],
      toImageButtonOptions: {
        format: 'png',
        filename: 'ngspiceX_plot',
        height: 600,
        width: 800,
        scale: 2,
      },
      editable: false,
      staticPlot: false,
      doubleClick: 'reset+autosize',
      modeBarStyle: {
        orientation: 'h',
      },
    }

    // Apply log scale for frequency plots
    if (data.type === 'frequency') {
      layout.xaxis.type = 'log'
    }

    Plotly.newPlot(plotRef.current, filteredTraces, layout, config).then(() => {
      // Ensure plot fills the container properly without expanding it
      Plotly.Plots.resize(plotRef.current)
    })
  }

  const clearPlot = () => {
    if (plotRef.current) {
      Plotly.purge(plotRef.current)
    }
  }

  const getPlotTitle = (type) => {
    switch (type) {
      case 'time':
        return 'Transient Analysis'
      case 'frequency':
        return 'AC Analysis'
      case 'dc':
        return 'DC Analysis'
      default:
        return 'Simulation Results'
    }
  }

  const getXAxisTitle = (type) => {
    switch (type) {
      case 'time':
        return 'Time (s)'
      case 'frequency':
        return 'Frequency (Hz)'
      case 'dc':
        return 'Sweep Variable'
      default:
        return 'X Axis'
    }
  }

  const getYAxisTitle = (type) => {
    switch (type) {
      case 'time':
        return 'Voltage (V) / Current (A)'
      case 'frequency':
        return 'Magnitude (dB)'
      case 'dc':
        return 'Voltage (V) / Current (A)'
      default:
        return 'Y Axis'
    }
  }

  if (!data) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className="text-lg font-medium mb-2 text-gray-700">
            No simulation data
          </div>
          <div className="text-sm text-gray-500">
            Run a simulation to see waveforms
          </div>
        </div>
      </div>
    )
  }

  // Handle operating point analysis (no plots, just values)
  if (data.type === 'operating_point' && data.values) {
    return (
      <div className="h-full w-full overflow-auto bg-gray-50">
        <div className="flex items-center justify-center min-h-full p-6">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Operating Point Analysis
                  </h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(data.values).map(([variable, value]) => (
                    <div
                      key={variable}
                      className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <span className="font-mono text-sm text-gray-700 font-medium">
                        {variable}
                      </span>
                      <span className="font-mono text-sm text-gray-900 font-semibold">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                {data.message && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-700">{data.message}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{ minHeight: 0 }}
      >
        <div
          ref={plotRef}
          className="w-full h-full"
          style={{
            minHeight: 0,
            maxHeight: '100%',
            maxWidth: '100%',
          }}
        />
      </div>
    </div>
  )
}

export default WaveformPane
