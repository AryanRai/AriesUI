const { spawn } = require('child_process')
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

let electronProcess = null

function startElectron(port = 3000) {
  if (electronProcess) {
    electronProcess.kill()
  }
  
  console.log('🚀 Starting Electron...')
  
  // Use appropriate command for Windows vs Unix
  const isWindows = process.platform === 'win32'
  const command = isWindows ? 'npx.cmd' : 'npx'
  
  electronProcess = spawn(command, ['electron', '.'], {
    stdio: 'inherit',
    shell: isWindows, // Use shell on Windows for better compatibility
    env: { 
      ...process.env, 
      NODE_ENV: 'development',
      NEXT_DEV_URL: `http://localhost:${port}`
    }
  })
  
  electronProcess.on('close', (code) => {
    if (code !== null) {
      console.log('⚡ Electron closed with code:', code)
    }
  })
  
  electronProcess.on('error', (err) => {
    console.error('Failed to start Electron:', err.message)
    console.log('Trying alternative method...')
    
    // Fallback: try to run electron directly
    const electronPath = require('electron')
    electronProcess = spawn(electronPath, ['.'], {
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NODE_ENV: 'development',
        NEXT_DEV_URL: `http://localhost:${port}`
      }
    })
  })
}

function waitForNextJs(callback) {
  let foundPort = null
  
  const checkPorts = [3000, 3001, 3002, 3003] // Common Next.js ports
  
  const checkServer = () => {
    if (foundPort) {
      callback(foundPort)
      return
    }
    
    let completed = 0
    checkPorts.forEach(port => {
      const req = require('http').request({ host: 'localhost', port, path: '/' }, (res) => {
        if (res.statusCode === 200 && !foundPort) {
          foundPort = port
          console.log(`✅ Next.js server is ready on port ${port}`)
          callback(foundPort)
        }
        completed++
        if (completed === checkPorts.length && !foundPort) {
          setTimeout(checkServer, 1000)
        }
      })
      
      req.on('error', () => {
        completed++
        if (completed === checkPorts.length && !foundPort) {
          setTimeout(checkServer, 1000)
        }
      })
      
      req.end()
    })
  }
  
  checkServer()
}

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(3000, (err) => {
    if (err) throw err
    console.log('🌐 Next.js server ready on http://localhost:3000')
    
    // Wait a moment then start Electron
    waitForNextJs((port) => {
      setTimeout(() => startElectron(port), 1000)
    })
  })
})

// Handle process termination
process.on('SIGTERM', () => {
  if (electronProcess) {
    electronProcess.kill()
  }
  process.exit(0)
})

process.on('SIGINT', () => {
  if (electronProcess) {
    electronProcess.kill()
  }
  process.exit(0)
}) 