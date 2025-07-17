import type { AriesMod, AriesModRegistry, AriesModData } from '@/types/ariesmods'

// Dynamic import cache for performance
const importCache = new Map<string, AriesMod>()

// Registry to store all available AriesMods
export class AriesModsRegistry {
  private static instance: AriesModsRegistry
  private registry: AriesModRegistry = {}
  private initialized = false

  private constructor() {}

  static getInstance(): AriesModsRegistry {
    if (!AriesModsRegistry.instance) {
      AriesModsRegistry.instance = new AriesModsRegistry()
    }
    return AriesModsRegistry.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Import all AriesMods from the ariesMods directory
      await this.loadBuiltInMods()
      await this.loadUserMods()
      
      this.initialized = true
      console.log(`AriesMods Registry initialized with ${Object.keys(this.registry).length} mods`)
    } catch (error) {
      console.error('Failed to initialize AriesMods Registry:', error)
    }
  }

  private async loadBuiltInMods(): Promise<void> {
    try {
      // Import built-in AriesMods
      const { TemperatureSensorMod } = await import('@/ariesMods/sensors/TemperatureSensor')
      const { GenericSensorMod } = await import('@/ariesMods/sensors/GenericSensor')
      const { ToggleControlMod } = await import('@/ariesMods/controls/ToggleControl')
      const { LineChartMod } = await import('@/ariesMods/visualization/LineChart')
      const { PlotlyChartMod } = await import('@/ariesMods/visualization/PlotlyChart')
      const { PointCloudVisMod } = await import('@/ariesMods/visualization/PointCloudVis')
      const { ClockMod } = await import('@/ariesMods/utility/Clock')
      
      // Import comprehensive AriesMods
      const { DataTableMod } = await import('@/ariesMods/utility/DataTable')
      const { DiagnosticsMod } = await import('@/ariesMods/utility/Diagnostics')
      const { RawMessagesMod } = await import('@/ariesMods/utility/RawMessages')
      const { Scene3DMod } = await import('@/ariesMods/visualization/Scene3D')
      const { FrequencySpectrumMod } = await import('@/ariesMods/visualization/FrequencySpectrum')
      const { StateMachineVisMod } = await import('@/ariesMods/visualization/StateMachineVis')
      const { MapsWidgetMod } = await import('@/ariesMods/visualization/MapsWidget')
      const { ImageCameraMod } = await import('@/ariesMods/visualization/ImageCamera')
      const { PlotChartMod } = await import('@/ariesMods/visualization/PlotChart')
      const { PublishControlMod } = await import('@/ariesMods/controls/PublishControl')
      const { RobotControlsMod } = await import('@/ariesMods/controls/RobotControls')
      const { SpringDamperMod } = await import('@/ariesMods/physics/SpringDamperMod')
      const { FluidSimulationMod } = await import('@/ariesMods/physics/FluidSimulationMod')
      const { LatexPhysicsMod } = await import('@/ariesMods/physics/LatexPhysics')
      
      // Import StarSim Physics AriesMods
      const { PhysicsValueMonitorMod } = await import('@/ariesMods/physics/PhysicsValueMonitorMod')
      const { PhysicsChartMod } = await import('@/ariesMods/physics/PhysicsChartMod')
      const { PhysicsVectorFieldMod } = await import('@/ariesMods/physics/PhysicsVectorFieldMod')
      const { PhysicsControlPanelMod } = await import('@/ariesMods/physics/PhysicsControlPanelMod')
      
      // Register existing mods
      this.registerMod(TemperatureSensorMod)
      this.registerMod(GenericSensorMod)
      this.registerMod(ToggleControlMod)
      this.registerMod(LineChartMod)
      this.registerMod(PlotlyChartMod)
      this.registerMod(PointCloudVisMod)
      this.registerMod(ClockMod)
      
      // Register comprehensive AriesMods
      this.registerMod(DataTableMod)
      this.registerMod(DiagnosticsMod)
      this.registerMod(RawMessagesMod)
      this.registerMod(Scene3DMod)
      this.registerMod(FrequencySpectrumMod)
      this.registerMod(StateMachineVisMod)
      this.registerMod(MapsWidgetMod)
      this.registerMod(ImageCameraMod)
      this.registerMod(PlotChartMod)
      this.registerMod(PublishControlMod)
      this.registerMod(RobotControlsMod)
      this.registerMod(SpringDamperMod)
      this.registerMod(FluidSimulationMod)
      this.registerMod(LatexPhysicsMod)
      
      // Register StarSim Physics AriesMods
      this.registerMod(PhysicsValueMonitorMod)
      this.registerMod(PhysicsChartMod)
      this.registerMod(PhysicsVectorFieldMod)
      this.registerMod(PhysicsControlPanelMod)
    } catch (error) {
      console.warn('Some built-in AriesMods failed to load:', error)
    }
  }

  private async loadUserMods(): Promise<void> {
    // For now, user mods need to be manually added to the registry
    // In the future, we could implement dynamic loading from a user directory
    console.log('User mods loading not yet implemented')
  }

  registerMod(mod: AriesMod): void {
    if (!mod.metadata?.id) {
      console.error('AriesMod registration failed: missing metadata.id')
      return
    }

    if (this.registry[mod.metadata.id]) {
      console.warn(`AriesMod ${mod.metadata.id} is already registered, overwriting...`)
    }

    this.registry[mod.metadata.id] = mod
    console.log(`Registered AriesMod: ${mod.metadata.displayName} (${mod.metadata.id})`)
  }

  getMod(id: string): AriesMod | undefined {
    return this.registry[id]
  }

  getAllMods(): AriesModRegistry {
    return { ...this.registry }
  }

  getModsByCategory(category: string): AriesMod[] {
    return Object.values(this.registry).filter(mod => mod.metadata.category === category)
  }

  getModMetadata(id: string) {
    return this.registry[id]?.metadata
  }

  generateDummyData(modId: string): AriesModData | null {
    const mod = this.registry[modId]
    if (mod?.generateDummyData) {
      return mod.generateDummyData()
    }
    
    // Default dummy data
    return {
      value: Math.random() * 100,
      timestamp: new Date().toISOString(),
      metadata: { generated: true }
    }
  }

  validateModConfig(modId: string, config: Record<string, any>): boolean {
    const mod = this.registry[modId]
    if (mod?.validateConfig) {
      return mod.validateConfig(config)
    }
    return true // Default to valid if no validation function
  }

  getAvailableModIds(): string[] {
    return Object.keys(this.registry)
  }

  searchMods(query: string): AriesMod[] {
    const lowercaseQuery = query.toLowerCase()
    return Object.values(this.registry).filter(mod => 
      mod.metadata.displayName.toLowerCase().includes(lowercaseQuery) ||
      mod.metadata.description.toLowerCase().includes(lowercaseQuery) ||
      mod.metadata.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }
}

// Export singleton instance
export const ariesModsRegistry = AriesModsRegistry.getInstance()

// Helper functions for common operations
export const getAriesMod = (id: string) => ariesModsRegistry.getMod(id)
export const getAllAriesMods = () => ariesModsRegistry.getAllMods()
export const getAriesModsByCategory = (category: string) => ariesModsRegistry.getModsByCategory(category)
export const generateDummyDataForMod = (modId: string) => ariesModsRegistry.generateDummyData(modId) 