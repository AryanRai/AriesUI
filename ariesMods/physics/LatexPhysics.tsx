import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calculator, 
  BookOpen, 
  Settings, 
  Copy, 
  Download, 
  Eye,
  EyeOff,
  Plus,
  Search,
  Star,
  FileText,
  Zap
} from 'lucide-react'
import type { AriesModProps, AriesMod, AriesModData } from '@/types/ariesmods'

export interface LatexPhysicsConfig {
  title: string
  fontSize: 'small' | 'medium' | 'large'
  theme: 'light' | 'dark' | 'auto'
  showPreview: boolean
  autoRender: boolean
  equationNumbering: boolean
  favoriteEquations: string[]
  customMacros: Record<string, string>
  renderMode: 'inline' | 'display' | 'both'
}

export interface PhysicsEquation {
  id: string
  name: string
  category: string
  latex: string
  description: string
  variables: Record<string, string>
  units?: Record<string, string>
  isFavorite: boolean
}

export interface LatexPhysicsData extends AriesModData {
  currentEquation: string
  renderedEquation: string
  equationLibrary: PhysicsEquation[]
  recentEquations: string[]
  renderingStatus: 'success' | 'error' | 'pending'
  errorMessage?: string
  renderTime: number
}

const LatexPhysics: React.FC<AriesModProps> = ({
  id,
  title,
  width = 400,
  height = 300,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const latexConfig = config as LatexPhysicsConfig
  const latexData = data as LatexPhysicsData

  const [isExpanded, setIsExpanded] = useState(false)
  const [currentInput, setCurrentInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [customEquation, setCustomEquation] = useState({
    name: '',
    category: '',
    latex: '',
    description: ''
  })

  // Physics equation library
  const equationLibrary: PhysicsEquation[] = [
    {
      id: 'newton_2',
      name: "Newton's Second Law",
      category: 'mechanics',
      latex: 'F = ma',
      description: 'Force equals mass times acceleration',
      variables: { F: 'Force', m: 'Mass', a: 'Acceleration' },
      units: { F: 'N', m: 'kg', a: 'm/s²' },
      isFavorite: false
    },
    {
      id: 'kinetic_energy',
      name: 'Kinetic Energy',
      category: 'mechanics',
      latex: 'KE = \\frac{1}{2}mv^2',
      description: 'Kinetic energy of an object',
      variables: { KE: 'Kinetic Energy', m: 'Mass', v: 'Velocity' },
      units: { KE: 'J', m: 'kg', v: 'm/s' },
      isFavorite: true
    },
    {
      id: 'coulomb_law',
      name: "Coulomb's Law",
      category: 'electromagnetism',
      latex: 'F = k\\frac{q_1 q_2}{r^2}',
      description: 'Force between two point charges',
      variables: { F: 'Force', k: 'Coulomb constant', q1: 'Charge 1', q2: 'Charge 2', r: 'Distance' },
      units: { F: 'N', k: 'N⋅m²/C²', q: 'C', r: 'm' },
      isFavorite: false
    },
    {
      id: 'wave_equation',
      name: 'Wave Equation',
      category: 'waves',
      latex: '\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\frac{\\partial^2 u}{\\partial x^2}',
      description: 'General wave equation in one dimension',
      variables: { u: 'Wave function', c: 'Wave speed', t: 'Time', x: 'Position' },
      isFavorite: false
    },
    {
      id: 'schrodinger',
      name: 'Schrödinger Equation',
      category: 'quantum',
      latex: 'i\\hbar\\frac{\\partial\\psi}{\\partial t} = \\hat{H}\\psi',
      description: 'Time-dependent Schrödinger equation',
      variables: { ψ: 'Wave function', H: 'Hamiltonian operator', ħ: 'Reduced Planck constant' },
      isFavorite: true
    },
    {
      id: 'maxwell_faraday',
      name: "Faraday's Law",
      category: 'electromagnetism',
      latex: '\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}',
      description: "Faraday's law in differential form",
      variables: { E: 'Electric field', B: 'Magnetic field', t: 'Time' },
      isFavorite: false
    },
    {
      id: 'einstein_mass_energy',
      name: 'Mass-Energy Equivalence',
      category: 'relativity',
      latex: 'E = mc^2',
      description: 'Einstein mass-energy equivalence',
      variables: { E: 'Energy', m: 'Mass', c: 'Speed of light' },
      units: { E: 'J', m: 'kg', c: 'm/s' },
      isFavorite: true
    },
    {
      id: 'ideal_gas',
      name: 'Ideal Gas Law',
      category: 'thermodynamics',
      latex: 'PV = nRT',
      description: 'Equation of state for ideal gas',
      variables: { P: 'Pressure', V: 'Volume', n: 'Amount', R: 'Gas constant', T: 'Temperature' },
      units: { P: 'Pa', V: 'm³', n: 'mol', R: 'J/(mol⋅K)', T: 'K' },
      isFavorite: false
    }
  ]

  // Dummy data for demo purposes
  const getDummyData = useCallback((): LatexPhysicsData => ({
    value: latexData?.currentEquation || 'F = ma',
    timestamp: new Date().toISOString(),
    currentEquation: latexData?.currentEquation || 'F = ma',
    renderedEquation: latexData?.renderedEquation || 'F = ma',
    equationLibrary: latexData?.equationLibrary || equationLibrary,
    recentEquations: latexData?.recentEquations || ['F = ma', 'E = mc^2', 'PV = nRT'],
    renderingStatus: latexData?.renderingStatus || 'success',
    errorMessage: latexData?.errorMessage,
    renderTime: latexData?.renderTime || 12,
    metadata: { source: 'latex', type: 'physics' }
  }), [latexData])

  const currentData = latexData || getDummyData()

  const handleConfigChange = (key: keyof LatexPhysicsConfig, value: any) => {
    onConfigChange?.({
      ...latexConfig,
      [key]: value
    })
  }

  const renderEquation = (latex: string) => {
    setCurrentInput(latex)
    onDataRequest?.(id, {
      action: 'render_equation',
      latex,
      config: latexConfig
    })
  }

  const addToFavorites = (equationId: string) => {
    onDataRequest?.(id, {
      action: 'toggle_favorite',
      equationId
    })
  }

  const saveCustomEquation = () => {
    if (customEquation.name && customEquation.latex) {
      onDataRequest?.(id, {
        action: 'add_custom_equation',
        equation: {
          ...customEquation,
          id: `custom_${Date.now()}`,
          isFavorite: false
        }
      })
      setCustomEquation({ name: '', category: '', latex: '', description: '' })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportEquations = () => {
    const exportData = (currentData.equationLibrary || []).filter(eq => eq.isFavorite)
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'physics-equations.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredEquations = (currentData.equationLibrary || []).filter(eq => {
    const categoryMatch = selectedCategory === 'all' || eq.category === selectedCategory
    const searchMatch = !searchTerm || 
                       eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       eq.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       eq.latex.toLowerCase().includes(searchTerm.toLowerCase())
    return categoryMatch && searchMatch
  })

  const categories = ['all', ...Array.from(new Set((currentData.equationLibrary || []).map(eq => eq.category)))]

  // Simple LaTeX renderer (placeholder - in real implementation would use MathJax/KaTeX)
  const renderLatexPreview = (latex: string) => {
    // This is a simplified representation - real implementation would use proper LaTeX rendering
    const simplified = latex
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\partial/g, '∂')
      .replace(/\\nabla/g, '∇')
      .replace(/\\times/g, '×')
      .replace(/\\mathbf\{([^}]+)\}/g, '**$1**')
      .replace(/\\hat\{([^}]+)\}/g, '$1̂')
      .replace(/\\hbar/g, 'ℏ')
      .replace(/\\psi/g, 'ψ')
      .replace(/\\_(\d+)/g, '₁')
      .replace(/\^(\d+)/g, '²')
      .replace(/\{([^}]+)\}/g, '$1')
      .replace(/\\/g, '')

    return simplified
  }

  const renderEquationInput = () => (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">LaTeX Input</Label>
        <Textarea
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          placeholder="Enter LaTeX equation (e.g., F = ma or \frac{1}{2}mv^2)"
          className="font-mono text-sm"
          rows={3}
        />
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => renderEquation(currentInput)}
            disabled={!currentInput.trim()}
          >
            <Calculator className="h-4 w-4 mr-1" />
            Render
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(currentInput)}
            disabled={!currentInput.trim()}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {latexConfig?.showPreview && currentInput && (
        <div className="border rounded p-3 bg-muted/50">
          <div className="text-xs text-muted-foreground mb-2">Preview:</div>
          <div 
            className={`
              text-center p-4 bg-background rounded border
              ${latexConfig?.fontSize === 'small' ? 'text-sm' : ''}
              ${latexConfig?.fontSize === 'large' ? 'text-lg' : ''}
            `}
          >
            {renderLatexPreview(currentInput)}
          </div>
        </div>
      )}
    </div>
  )

  const renderEquationLibrary = () => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search equations..."
            className="pl-7 h-8 text-xs"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredEquations.map((eq) => (
          <div 
            key={eq.id}
            className="border rounded p-3 hover:bg-muted/50 cursor-pointer"
            onClick={() => setCurrentInput(eq.latex)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{eq.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {eq.category}
                  </Badge>
                  {eq.isFavorite && (
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {eq.description}
                </div>
                <div 
                  className="font-mono text-sm bg-muted/30 rounded p-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentInput(eq.latex)
                    renderEquation(eq.latex)
                  }}
                >
                  {renderLatexPreview(eq.latex)}
                </div>
              </div>
              <div className="flex flex-col gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    addToFavorites(eq.id)
                  }}
                >
                  <Star className={`h-3 w-3 ${eq.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(eq.latex)
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {eq.variables && Object.keys(eq.variables).length > 0 && (
              <div className="mt-2 text-xs">
                <div className="text-muted-foreground mb-1">Variables:</div>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(eq.variables).map(([symbol, description]) => (
                    <div key={symbol} className="flex items-center gap-1">
                      <span className="font-mono font-bold">{symbol}:</span>
                      <span>{description}</span>
                      {eq.units?.[symbol] && (
                        <span className="text-muted-foreground">({eq.units[symbol]})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderCustomEquation = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Name</Label>
          <Input
            value={customEquation.name}
            onChange={(e) => setCustomEquation(prev => ({ ...prev, name: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Equation name"
          />
        </div>
        <div>
          <Label className="text-xs">Category</Label>
          <Input
            value={customEquation.category}
            onChange={(e) => setCustomEquation(prev => ({ ...prev, category: e.target.value }))}
            className="h-8 text-xs"
            placeholder="e.g., mechanics"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">LaTeX</Label>
        <Textarea
          value={customEquation.latex}
          onChange={(e) => setCustomEquation(prev => ({ ...prev, latex: e.target.value }))}
          className="font-mono text-xs"
          placeholder="Enter LaTeX equation"
          rows={2}
        />
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Input
          value={customEquation.description}
          onChange={(e) => setCustomEquation(prev => ({ ...prev, description: e.target.value }))}
          className="h-8 text-xs"
          placeholder="Brief description"
        />
      </div>
      <Button
        variant="default"
        size="sm"
        onClick={saveCustomEquation}
        disabled={!customEquation.name || !customEquation.latex}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Equation
      </Button>
    </div>
  )

  const renderSettings = () => (
    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded">
      <div className="space-y-2">
        <Label className="text-xs">Font Size</Label>
        <Select
          value={latexConfig?.fontSize || 'medium'}
          onValueChange={(value) => handleConfigChange('fontSize', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Render Mode</Label>
        <Select
          value={latexConfig?.renderMode || 'display'}
          onValueChange={(value) => handleConfigChange('renderMode', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inline">Inline</SelectItem>
            <SelectItem value="display">Display</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="show-preview"
          checked={latexConfig?.showPreview || false}
          onCheckedChange={(checked) => handleConfigChange('showPreview', checked)}
        />
        <Label htmlFor="show-preview" className="text-xs">Live Preview</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="auto-render"
          checked={latexConfig?.autoRender || false}
          onCheckedChange={(checked) => handleConfigChange('autoRender', checked)}
        />
        <Label htmlFor="auto-render" className="text-xs">Auto Render</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="equation-numbering"
          checked={latexConfig?.equationNumbering || false}
          onCheckedChange={(checked) => handleConfigChange('equationNumbering', checked)}
        />
        <Label htmlFor="equation-numbering" className="text-xs">Equation Numbers</Label>
      </div>
    </div>
  )

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {latexConfig?.title || title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={currentData?.renderingStatus === 'success' ? "default" : 
                      currentData?.renderingStatus === 'error' ? "destructive" : "secondary"}
              className="text-xs"
            >
              {currentData?.renderingStatus || 'unknown'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={exportEquations}
              title="Export favorites"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isExpanded && renderSettings()}
        
        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input" className="text-xs">Input</TabsTrigger>
            <TabsTrigger value="library" className="text-xs">Library</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
          </TabsList>
          <TabsContent value="input" className="mt-3">
            {renderEquationInput()}
          </TabsContent>
          <TabsContent value="library" className="mt-3">
            {renderEquationLibrary()}
          </TabsContent>
          <TabsContent value="custom" className="mt-3">
            {renderCustomEquation()}
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground text-center">
          Render Time: {currentData?.renderTime || 0}ms | Equations: {currentData?.equationLibrary?.length || 0}
        </div>
      </CardContent>
    </Card>
  )
}

// AriesMod configuration
export const LatexPhysicsMod: AriesMod = {
  metadata: {
    id: 'latex-physics',
    name: 'LatexPhysics',
    displayName: 'LaTeX Physics Tool',
    description: 'Render mathematical equations and physics formulas with comprehensive equation library',
    category: 'physics',
    tags: ['latex', 'math', 'physics', 'equations', 'formulas', 'science'],
    version: '1.0.0',
    author: 'AriesUI',
    icon: Calculator,
    thumbnail: '/thumbnails/latex-physics.png',
    defaultWidth: 450,
    defaultHeight: 500,
    minWidth: 350,
    minHeight: 300,
    maxWidth: 600,
    maxHeight: 700,
    supportedDataTypes: ['equations', 'latex', 'mathematical'],
    configurable: true,
    hardwareIntegrated: false
  },
  component: LatexPhysics,
  defaultConfig: {
    title: 'LaTeX Physics',
    fontSize: 'medium',
    theme: 'auto',
    showPreview: true,
    autoRender: false,
    equationNumbering: false,
    favoriteEquations: [],
    customMacros: {},
    renderMode: 'display'
  },
  generateDummyData: () => ({
    value: 'F = ma',
    timestamp: new Date().toISOString(),
    currentEquation: 'F = ma',
    renderedEquation: 'F = ma',
    equationLibrary: [
      {
        id: 'newton_2',
        name: "Newton's Second Law",
        category: 'mechanics',
        latex: 'F = ma',
        description: 'Force equals mass times acceleration',
        variables: { F: 'Force', m: 'Mass', a: 'Acceleration' },
        isFavorite: true
      }
    ],
    recentEquations: ['F = ma', 'E = mc^2'],
    renderingStatus: 'success' as const,
    renderTime: 12,
    metadata: { source: 'demo' }
  }),
  validateConfig: (config: Record<string, any>) => {
    return typeof config.title === 'string' && 
           ['small', 'medium', 'large'].includes(config.fontSize)
  }
}

export default LatexPhysics 