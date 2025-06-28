/**
 * AriesMods Dependency Manager
 * 
 * Handles external dependencies for custom AriesMods in a secure and controlled manner.
 * Supports both pre-approved dependencies and dynamic loading with validation.
 */

export interface DependencyManifest {
  name: string
  version: string
  source: 'npm' | 'cdn' | 'local'
  integrity?: string // For CDN sources
  required: boolean
  scope?: 'global' | 'isolated'
}

export interface AriesModManifest {
  id: string
  name: string
  version: string
  author: string
  description: string
  dependencies: DependencyManifest[]
  permissions: string[]
  category: 'sensors' | 'controls' | 'visualization' | 'utility' | 'custom'
}

class AriesModsDependencyManager {
  private loadedDependencies = new Map<string, any>()
  private permittedDependencies = new Map<string, DependencyManifest>()
  private pendingDependencies = new Map<string, Promise<any>>()

  constructor() {
    this.initializePreApprovedDependencies()
  }

  /**
   * Pre-approved dependencies that are always available
   * These are bundled with AriesUI and don't require external loading
   */
  private initializePreApprovedDependencies() {
    const preApproved: DependencyManifest[] = [
      // UI & Styling
      { name: 'react', version: '19.x', source: 'npm', required: true, scope: 'global' },
      { name: 'lucide-react', version: '0.x', source: 'npm', required: false, scope: 'global' },
      { name: 'tailwindcss', version: '3.x', source: 'npm', required: false, scope: 'global' },
      { name: 'clsx', version: '2.x', source: 'npm', required: false, scope: 'global' },
      
      // Data Visualization (Already installed)
      { name: 'recharts', version: '2.x', source: 'npm', required: false, scope: 'global' },
      { name: 'plotly.js', version: '2.x', source: 'npm', required: false, scope: 'global' },
      { name: 'react-plotly.js', version: '0.x', source: 'npm', required: false, scope: 'global' },
      
      // Math & Utilities
      { name: 'date-fns', version: '4.x', source: 'npm', required: false, scope: 'global' },
      { name: 'lodash-es', version: '4.x', source: 'npm', required: false, scope: 'isolated' },
      
      // Commonly requested
      { name: 'd3', version: '7.x', source: 'cdn', required: false, scope: 'isolated' },
      { name: 'chart.js', version: '4.x', source: 'cdn', required: false, scope: 'isolated' },
      { name: 'three', version: '0.x', source: 'cdn', required: false, scope: 'isolated' },
    ]

    preApproved.forEach(dep => {
      this.permittedDependencies.set(dep.name, dep)
    })
  }

  /**
   * Load a dependency for an AriesMod
   */
  async loadDependency(dependency: DependencyManifest): Promise<any> {
    const key = `${dependency.name}@${dependency.version}`
    
    // Return if already loaded
    if (this.loadedDependencies.has(key)) {
      return this.loadedDependencies.get(key)
    }

    // Return pending promise if already loading
    if (this.pendingDependencies.has(key)) {
      return this.pendingDependencies.get(key)
    }

    // Check if dependency is permitted
    if (!this.isDependencyPermitted(dependency)) {
      throw new Error(`Dependency ${dependency.name} is not permitted. Please contact administrator to add it to the approved list.`)
    }

    // Start loading
    const loadPromise = this.doLoadDependency(dependency)
    this.pendingDependencies.set(key, loadPromise)

    try {
      const result = await loadPromise
      this.loadedDependencies.set(key, result)
      this.pendingDependencies.delete(key)
      return result
    } catch (error) {
      this.pendingDependencies.delete(key)
      throw error
    }
  }

  /**
   * Check if a dependency is in the permitted list
   */
  private isDependencyPermitted(dependency: DependencyManifest): boolean {
    const permitted = this.permittedDependencies.get(dependency.name)
    if (!permitted) return false

    // Check version compatibility (simplified)
    if (permitted.version.includes('x')) {
      const [major] = permitted.version.split('.')
      const [depMajor] = dependency.version.split('.')
      return major === depMajor
    }

    return permitted.version === dependency.version
  }

  /**
   * Actually load the dependency based on source
   */
  private async doLoadDependency(dependency: DependencyManifest): Promise<any> {
    switch (dependency.source) {
      case 'npm':
        return this.loadNpmDependency(dependency)
      case 'cdn':
        return this.loadCdnDependency(dependency)
      case 'local':
        return this.loadLocalDependency(dependency)
      default:
        throw new Error(`Unsupported dependency source: ${dependency.source}`)
    }
  }

  /**
   * Load NPM dependency (for pre-bundled dependencies)
   */
  private async loadNpmDependency(dependency: DependencyManifest): Promise<any> {
    try {
      switch (dependency.name) {
        case 'react':
          return (await import('react'))
        case 'lucide-react':
          return (await import('lucide-react'))
        case 'recharts':
          return (await import('recharts'))
        case 'plotly.js':
          return (await import('plotly.js'))
        case 'react-plotly.js':
          return (await import('react-plotly.js'))
        case 'date-fns':
          return (await import('date-fns'))
        case 'clsx':
          return (await import('clsx'))
        default:
          throw new Error(`NPM dependency ${dependency.name} not pre-bundled`)
      }
    } catch (error) {
      throw new Error(`Failed to load NPM dependency ${dependency.name}: ${error}`)
    }
  }

  /**
   * Load CDN dependency using dynamic script loading
   */
  private async loadCdnDependency(dependency: DependencyManifest): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check if already loaded globally
      const globalName = this.getGlobalName(dependency.name)
      if (globalName && (window as any)[globalName]) {
        resolve((window as any)[globalName])
        return
      }

      const script = document.createElement('script')
      const cdnUrl = this.getCdnUrl(dependency)
      
      script.src = cdnUrl
      script.onload = () => {
        const lib = (window as any)[globalName]
        if (lib) {
          resolve(lib)
        } else {
          reject(new Error(`Global ${globalName} not found after loading ${dependency.name}`))
        }
      }
      script.onerror = () => {
        reject(new Error(`Failed to load ${dependency.name} from CDN`))
      }

      // Add integrity check if provided
      if (dependency.integrity) {
        script.integrity = dependency.integrity
        script.crossOrigin = 'anonymous'
      }

      document.head.appendChild(script)
    })
  }

  /**
   * Load local dependency (for user-uploaded modules)
   */
  private async loadLocalDependency(dependency: DependencyManifest): Promise<any> {
    try {
      const modulePath = `/ariesmods/dependencies/${dependency.name}/${dependency.version}/index.js`
      return (await import(modulePath))
    } catch (error) {
      throw new Error(`Failed to load local dependency ${dependency.name}: ${error}`)
    }
  }

  /**
   * Get CDN URL for a dependency
   */
  private getCdnUrl(dependency: DependencyManifest): string {
    const baseUrls = {
      'd3': `https://d3js.org/d3.v${dependency.version.split('.')[0]}.min.js`,
      'chart.js': `https://cdn.jsdelivr.net/npm/chart.js@${dependency.version}/dist/chart.min.js`,
      'three': `https://cdn.jsdelivr.net/npm/three@${dependency.version}/build/three.min.js`,
    }

    const url = baseUrls[dependency.name as keyof typeof baseUrls]
    if (!url) {
      throw new Error(`No CDN URL configured for ${dependency.name}`)
    }
    return url
  }

  /**
   * Get global variable name for a dependency
   */
  private getGlobalName(dependencyName: string): string {
    const globalNames = {
      'd3': 'd3',
      'chart.js': 'Chart',
      'three': 'THREE',
    }
    return globalNames[dependencyName as keyof typeof globalNames] || dependencyName
  }

  /**
   * Validate an AriesMod manifest
   */
  validateManifest(manifest: AriesModManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields
    if (!manifest.id) errors.push('Missing required field: id')
    if (!manifest.name) errors.push('Missing required field: name')
    if (!manifest.version) errors.push('Missing required field: version')
    if (!manifest.author) errors.push('Missing required field: author')

    // Validate dependencies
    manifest.dependencies?.forEach((dep, index) => {
      if (!dep.name) errors.push(`Dependency ${index}: missing name`)
      if (!dep.version) errors.push(`Dependency ${index}: missing version`)
      if (!dep.source) errors.push(`Dependency ${index}: missing source`)
      
      if (!this.isDependencyPermitted(dep)) {
        errors.push(`Dependency ${dep.name}@${dep.version} is not permitted`)
      }
    })

    // Validate permissions
    const allowedPermissions = ['network', 'storage', 'filesystem', 'hardware']
    manifest.permissions?.forEach(permission => {
      if (!allowedPermissions.includes(permission)) {
        errors.push(`Unknown permission: ${permission}`)
      }
    })

    return { valid: errors.length === 0, errors }
  }

  /**
   * Load all dependencies for an AriesMod
   */
  async loadDependencies(manifest: AriesModManifest): Promise<Record<string, any>> {
    const validation = this.validateManifest(manifest)
    if (!validation.valid) {
      throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`)
    }

    const dependencies: Record<string, any> = {}
    
    for (const dep of manifest.dependencies) {
      try {
        dependencies[dep.name] = await this.loadDependency(dep)
      } catch (error) {
        if (dep.required) {
          throw error
        } else {
          console.warn(`Optional dependency ${dep.name} failed to load:`, error)
        }
      }
    }

    return dependencies
  }

  /**
   * Get list of available dependencies
   */
  getAvailableDependencies(): DependencyManifest[] {
    return Array.from(this.permittedDependencies.values())
  }

  /**
   * Add a new permitted dependency (admin function)
   */
  addPermittedDependency(dependency: DependencyManifest): void {
    this.permittedDependencies.set(dependency.name, dependency)
  }

  /**
   * Remove a permitted dependency (admin function)
   */
  removePermittedDependency(name: string): void {
    this.permittedDependencies.delete(name)
    // Also remove loaded instances
    Array.from(this.loadedDependencies.keys())
      .filter(key => key.startsWith(name + '@'))
      .forEach(key => this.loadedDependencies.delete(key))
  }
}

// Export singleton instance
export const dependencyManager = new AriesModsDependencyManager()

// Utility function for AriesMod developers
export async function loadAriesModDependencies(manifest: AriesModManifest) {
  return dependencyManager.loadDependencies(manifest)
}

// Helper function to create a manifest
export function createAriesModManifest(
  id: string,
  name: string,
  version: string,
  author: string,
  dependencies: DependencyManifest[] = [],
  permissions: string[] = []
): AriesModManifest {
  return {
    id,
    name,
    version,
    author,
    description: '',
    dependencies,
    permissions,
    category: 'custom'
  }
} 