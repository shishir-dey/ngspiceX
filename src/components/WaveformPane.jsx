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
        x: 0.02,
        xanchor: 'left',
        pad: { t: 5, b: 5 },
      },
      xaxis: {
        title: getXAxisTitle(data.type),
        gridcolor: 'rgba(128,128,128,0.2)',
        zerolinecolor: 'rgba(128,128,128,0.4)',
        color: 'currentColor',
        titlefont: { size: 12 },
        tickfont: { size: 10 },
      },
      yaxis: {
        title: getYAxisTitle(data.type),
        gridcolor: 'rgba(128,128,128,0.2)',
        zerolinecolor: 'rgba(128,128,128,0.4)',
        color: 'currentColor',
        titlefont: { size: 12 },
        tickfont: { size: 10 },
      },
      plot_bgcolor: 'transparent',
      paper_bgcolor: 'transparent',
      font: {
        family:
          '-apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, system-ui, sans-serif',
        color: 'currentColor',
        size: 11,
      },
      margin: { l: 60, r: 30, t: 55, b: 50 },
      showlegend: true,
      legend: {
        x: 0.02,
        y: 0.98,
        bgcolor: 'rgba(255,255,255,0.95)',
        bordercolor: 'rgba(128,128,128,0.3)',
        borderwidth: 1,
        font: { size: 10 },
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
      // Ensure plot fills the container properly
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
      <div className="h-full w-full flex items-center justify-center text-gray-500 bg-gray-50 rounded-b-lg">
        <div className="text-center">
          <div className="text-base font-medium mb-2 text-gray-700">
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
      <div className="h-full w-full p-4 bg-gray-50 rounded-b-lg overflow-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Operating Point Analysis
          </h3>
          <div className="space-y-2">
            {Object.entries(data.values).map(([variable, value]) => (
              <div
                key={variable}
                className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0"
              >
                <span className="font-mono text-sm text-gray-700 font-medium">
                  {variable}:
                </span>
                <span className="font-mono text-sm text-gray-900">{value}</span>
              </div>
            ))}
          </div>
          {data.message && (
            <div className="mt-4 text-sm text-gray-600 italic">
              {data.message}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-b-lg overflow-hidden flex flex-col p-2 relative"
    >
      <div ref={plotRef} className="flex-1 w-full min-h-0" />
    </div>
  )
}

export default WaveformPane
