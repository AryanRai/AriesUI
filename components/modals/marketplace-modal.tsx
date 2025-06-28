"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Cloud, Boxes, Download } from 'lucide-react'

// Dummy data for marketplace mods
const availableMods = [
  { id: 'weather-station', name: 'Weather Station', description: 'Displays current weather conditions.', author: 'AriesLabs', version: '1.2.0', tags: ['weather', 'api', 'data'], icon: '☀️' },
  { id: 'stock-ticker', name: 'Stock Ticker', description: 'Live stock market data.', author: 'FinanceMods', version: '2.0.1', tags: ['stocks', 'finance'], icon: '📈' },
  { id: 'system-monitor', name: 'System Monitor', description: 'Monitors CPU, RAM, and disk usage.', author: 'SysAdmins', version: '1.5.3', tags: ['system', 'monitoring', 'cpu'], icon: '💻' },
  { id: 'world-clock', name: 'World Clock', description: 'Shows time across different timezones.', author: 'AriesLabs', version: '1.0.0', tags: ['time', 'clock', 'world'], icon: '🌍' },
]

const ModCard = ({ mod, onInstall, isInstalled }) => (
  <div className="flex items-center justify-between p-3 border rounded-md bg-card/50">
    <div className="flex items-center gap-4">
      <div className="text-2xl">{mod.icon}</div>
      <div>
        <h3 className="font-semibold">{mod.name} <span className="text-xs text-muted-foreground">v{mod.version}</span></h3>
        <p className="text-sm text-muted-foreground">{mod.description}</p>
        <p className="text-xs text-muted-foreground italic">by {mod.author}</p>
      </div>
    </div>
    <Button size="sm" onClick={() => onInstall(mod.id)} disabled={isInstalled}>
      <Download className="h-4 w-4 mr-2" />
      {isInstalled ? 'Installed' : 'Install'}
    </Button>
  </div>
)

export const MarketplaceModal = ({ isOpen, onClose }) => {
  const [installedMods, setInstalledMods] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const handleInstall = (modId) => {
    setInstalledMods(prev => [...prev, modId])
    // Here you would also trigger the actual download/registration logic
  }

  const filteredMods = availableMods.filter(mod => 
    mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mod.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mod.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[70vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Cloud className="h-6 w-6" /> AriesMods Marketplace</DialogTitle>
          <DialogDescription>Discover and install new widgets for your dashboard.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="discover" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discover"><Search className="h-4 w-4 mr-2" />Discover</TabsTrigger>
            <TabsTrigger value="installed"><Boxes className="h-4 w-4 mr-2" />Installed</TabsTrigger>
          </TabsList>
          <div className="relative mt-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search mods..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <TabsContent value="discover" className="flex-1 overflow-y-auto mt-4 space-y-3 pr-2">
            {filteredMods.map(mod => (
              <ModCard 
                key={mod.id} 
                mod={mod} 
                onInstall={handleInstall}
                isInstalled={installedMods.includes(mod.id)}
              />
            ))}
          </TabsContent>
          <TabsContent value="installed" className="flex-1 overflow-y-auto mt-4 space-y-3 pr-2">
            {availableMods.filter(m => installedMods.includes(m.id)).map(mod => (
               <ModCard 
                key={mod.id} 
                mod={mod} 
                onInstall={handleInstall}
                isInstalled
              />
            ))}
            {installedMods.length === 0 && (
              <div className="text-center text-muted-foreground py-10">No mods installed yet.</div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 