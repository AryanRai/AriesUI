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
import SpringDamper from './SpringDamper'
import FluidSimulation from './FluidSimulation'

// Mod definition exports
import { PhysicsValueMonitorMod } from './PhysicsValueMonitorMod'
import { PhysicsChartMod } from './PhysicsChartMod'
import { PhysicsVectorFieldMod } from './PhysicsVectorFieldMod'
import { PhysicsControlPanelMod } from './PhysicsControlPanelMod'
import { SpringDamperMod } from './SpringDamperMod'
import { FluidSimulationMod } from './FluidSimulationMod'

// Export components
export {
  PhysicsValueMonitor,
  PhysicsChart,
  PhysicsVectorField,
  PhysicsControlPanel,
  SpringDamper,
  FluidSimulation
}

// Export mod definitions
export {
  PhysicsValueMonitorMod,
  PhysicsChartMod,
  PhysicsVectorFieldMod,
  PhysicsControlPanelMod,
  SpringDamperMod,
  FluidSimulationMod
}

// Default export for dynamic loading
export default {
  // Components
  PhysicsValueMonitor,
  PhysicsChart,
  PhysicsVectorField,
  PhysicsControlPanel,
  SpringDamper,
  FluidSimulation,

  // Mod definitions
  PhysicsValueMonitorMod,
  PhysicsChartMod,
  PhysicsVectorFieldMod,
  PhysicsControlPanelMod,
  SpringDamperMod,
  FluidSimulationMod
}