# ngspiceX

A modern browser-based SPICE circuit simulator built with React + Vite + Radix UI.

## Quick Start

```bash
# Clone and install
git clone https://github.com/shishir-dey/ngspiceX.git
cd ngspiceX
npm install

# Development
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run clean        # Clean build cache
```

## Features

- **Browser-based simulation**: Runs entirely in your web browser using ngspice WASM
- **Three-pane layout**: Circuit Editor, Waveform Viewer, Terminal
- **Dual editing modes**: Text editor and schematic visualization
- **Real-time analysis**: Transient, AC, and DC circuit analysis
- **Apple-inspired UI**: Modern design with Radix UI components
- **Interactive plotting**: Dynamic waveforms with Plotly.js

## Usage

1. Enter your SPICE netlist in the Circuit Editor
2. Click **Simulate** to run analysis
3. View results in the Waveform Viewer
4. Check console output in the Terminal

## Acknowledgments

Thanks to [@danchitnis/ngspice](https://github.com/danchitnis/ngspice) for providing the ngspice WASM build files that power the client-side simulation engine.

## License

MIT
