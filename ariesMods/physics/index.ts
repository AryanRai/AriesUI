/**
 * Physics AriesMods for StarSim Integration
 * 
 * This module exports physics-specific widgets and their mod definitions
 * for use with StarSim simulations.
 */

// Component exports
import PhysicsValueMonitor from './PhysicsValueMonitor'
import PhysicsChart from './PhysicsChart'
import PhysicsVectorField from './PhysicsVectorField'
import PhysicsControlPanel from './PhysicsControlPanel'

// Mod definition exports
import { PhysicsValueMonitorMod } from './PhysicsValueMonitorMod'
import { PhysicsChartMod } from './PhysicsChartMod'
import { PhysicsVectorFieldMod } from './PhysicsVectorFieldMod'
import { PhysicsControlPanelMod } from './PhysicsControlPanelMod'

// Export components
export {
  PhysicsValueMonitor,
  PhysicsChart,
  PhysicsVectorField,
  PhysicsControlPanel
}

// Export mod definitions
export {
  PhysicsValueMonitorMod,
  PhysicsChartMod,
  PhysicsVectorFieldMod,
  PhysicsControlPanelMod
}

// Default export for dynamic loading
export default {
  // Components
  PhysicsValueMonitor,
  PhysicsChart,
  PhysicsVectorField,
  PhysicsControlPanel,
  
  // Mod definitions
  PhysicsValueMonitorMod,
  PhysicsChartMod,
  PhysicsVectorFieldMod,
  PhysicsControlPanelMod
}