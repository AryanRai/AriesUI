"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useComms } from "@/components/comms-context"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Loader2 } from "lucide-react"

interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: string
  _links: {
    self: string
    git: string
    html: string
  }
}

async function fetchModsFromRepo(repoUrl: string): Promise<GitHubFile[]> {
  // Example URL: https://github.com/inspo-soft/Aries-Dev-Mods
  // We need to convert it to the API format:
  // https://api.github.com/repos/inspo-soft/Aries-Dev-Mods/contents/aries-mods
  try {
    const urlParts = new URL(repoUrl)
    const pathParts = urlParts.pathname.split("/").filter(Boolean)
    if (pathParts.length < 2) throw new Error("Invalid GitHub repository URL")
    
    const owner = pathParts[0]
    const repo = pathParts[1]
    
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/aries-mods`
    
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch repository contents: ${response.statusText}`)
    }
    const data: GitHubFile[] = await response.json()
    // Filter for .tsx files only, as other files might exist (e.g., README)
    return data.filter(file => file.name.endsWith('.tsx'))
  } catch (error) {
    console.error("Error fetching mods from repo:", error)
    // Silently fail and return empty array
    return []
  }
}

export function MarketplaceModal() {
  const { state, dispatch } = useComms()
  const [availableMods, setAvailableMods] = useState<GitHubFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [repoUrl, setRepoUrl] = useState("https://github.com/inspo-soft/Aries-Dev-Mods")

  const handleClose = () => {
    dispatch({ type: "SET_MODAL", payload: null })
  }

  const handleFetchMods = async () => {
    setIsLoading(true)
    const mods = await fetchModsFromRepo(repoUrl)
    setAvailableMods(mods)
    setIsLoading(false)
  }

  useEffect(() => {
    handleFetchMods()
  }, [])


  return (
    <Dialog open={state.activeModal === "marketplace"} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AriesMods Marketplace</DialogTitle>
          <DialogDescription>
            Discover, install, and manage community-made and official mods from GitHub.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden p-1">
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Enter GitHub repository URL..." 
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            <Button onClick={handleFetchMods} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load Repo"}
            </Button>
          </div>

          <div className="flex-1 overflow-auto pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : availableMods.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableMods.map((mod) => (
                  <Card key={mod.sha} className="flex flex-col">
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="flex-1">
                        <div className="font-semibold">{mod.name.replace('.tsx', '')}</div>
                        <p className="text-sm text-muted-foreground mt-2">
                          A community-provided mod.
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <Badge variant="outline">{(mod.size / 1024).toFixed(2)} KB</Badge>
                        <Button variant="default" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Install
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                No mods found in the specified repository path, or the repository is invalid.
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 