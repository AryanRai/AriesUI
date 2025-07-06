import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Move,
  RotateCw,
  Square,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Settings,
  Shield,
  Target,
  MapPin,
  Zap,
  Home,
  Radio,
  Battery,
  Wifi,
  AlertTriangle
} from 'lucide-react'
import type { AriesModProps, AriesMod, AriesModData } from '@/types/ariesmods'

export interface RobotControlsConfig {
  title: string
  robotType: 'ground' | 'aerial' | 'underwater' | 'humanoid' | 'arm'
  controlMode: 'manual' | 'assisted' | 'autonomous'
  maxLinearSpeed: number
  maxAngularSpeed: number
  maxArmSpeed: number
  safetyEnabled: boolean
  obstacleAvoidance: boolean
  autoReturn: boolean
  enableArm: boolean
  enableGripper: boolean
  enableCamera: boolean
  missionPlanning: boolean
  telemetryRate: number
  joystickDeadzone: number
}

export interface RobotPose {
  position: { x: number; y: number; z: number }
  orientation: { roll: number; pitch: number; yaw: number }
  linear_velocity: { x: number; y: number; z: number }
  angular_velocity: { x: number; y: number; z: number }
}

export interface ArmState {
  joint_positions: number[]
  joint_velocities: number[]
  end_effector_position: { x: number; y: number; z: number }
  gripper_position: number
  gripper_force: number
}

export interface RobotStatus {
  battery_level: number
  signal_strength: number
  cpu_usage: number
  temperature: number
  errors: string[]
  warnings: string[]
  emergency_stop: boolean
  is_homed: boolean
}

export interface MissionWaypoint {
  id: string
  position: { x: number; y: number; z?: number }
  action: 'move' | 'pick' | 'place' | 'wait' | 'scan'
  parameters?: Record<string, any>
  completed: boolean
}

export interface RobotControlsData extends AriesModData {
  pose: RobotPose
  arm_state?: ArmState
  robot_status: RobotStatus
  mission_waypoints: MissionWaypoint[]
  current_waypoint: number
  connection_status: 'connected' | 'disconnected' | 'error'
  control_authority: 'local' | 'remote' | 'shared'
  last_command_time: number
}

const RobotControls: React.FC<AriesModProps> = ({
  id,
  title,
  width = 400,
  height = 300,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const robotConfig = config as RobotControlsConfig
  const robotData = data as RobotControlsData

  const [isExpanded, setIsExpanded] = useState(false)
  const [velocityCommand, setVelocityCommand] = useState({ linear: 0, angular: 0 })
  const [armCommand, setArmCommand] = useState({ joint: 0, gripper: 0 })
  const [missionMode, setMissionMode] = useState(false)
  const [selectedWaypoint, setSelectedWaypoint] = useState<string | null>(null)

  // Dummy data for demo purposes
  const getDummyData = useCallback((): RobotControlsData => ({
    value: robotData?.pose?.position.x || 0,
    timestamp: new Date().toISOString(),
    pose: robotData?.pose || {
      position: { x: 2.5, y: 1.8, z: 0.3 },
      orientation: { roll: 0.02, pitch: -0.01, yaw: 1.57 },
      linear_velocity: { x: 0.0, y: 0.0, z: 0.0 },
      angular_velocity: { x: 0.0, y: 0.0, z: 0.0 }
    },
    arm_state: robotConfig?.enableArm ? (robotData?.arm_state || {
      joint_positions: [0.0, -0.5, 1.2, 0.0, 0.8, 0.0],
      joint_velocities: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      end_effector_position: { x: 0.6, y: 0.0, z: 0.4 },
      gripper_position: 0.5,
      gripper_force: 10.0
    }) : undefined,
    robot_status: robotData?.robot_status || {
      battery_level: 78.5,
      signal_strength: 85,
      cpu_usage: 45.2,
      temperature: 42.8,
      errors: [],
      warnings: ['GPS signal weak'],
      emergency_stop: false,
      is_homed: true
    },
    mission_waypoints: robotData?.mission_waypoints || [
      { id: 'wp1', position: { x: 0, y: 0 }, action: 'move', completed: true },
      { id: 'wp2', position: { x: 2, y: 1 }, action: 'pick', completed: true },
      { id: 'wp3', position: { x: 4, y: 2 }, action: 'place', completed: false },
      { id: 'wp4', position: { x: 0, y: 0 }, action: 'move', completed: false }
    ],
    current_waypoint: 2,
    connection_status: robotData?.connection_status || 'connected',
    control_authority: robotData?.control_authority || 'local',
    last_command_time: robotData?.last_command_time || Date.now() - 1000,
    metadata: { source: 'robot', type: 'controls' }
  }), [robotConfig, robotData])

  const currentData = robotData || getDummyData()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-600'
    if (level > 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleConfigChange = (key: keyof RobotControlsConfig, value: any) => {
    onConfigChange?.({
      ...robotConfig,
      [key]: value
    })
  }

  const sendVelocityCommand = (linear: number, angular: number) => {
    setVelocityCommand({ linear, angular })
    onDataRequest?.(id, {
      action: 'velocity_command',
      linear_velocity: { x: linear, y: 0, z: 0 },
      angular_velocity: { x: 0, y: 0, z: angular }
    })
  }

  const sendDirectionCommand = (direction: string) => {
    const speed = robotConfig?.maxLinearSpeed || 1.0
    const angularSpeed = robotConfig?.maxAngularSpeed || 1.0
    
    switch (direction) {
      case 'forward':
        sendVelocityCommand(speed, 0)
        break
      case 'backward':
        sendVelocityCommand(-speed, 0)
        break
      case 'left':
        sendVelocityCommand(0, angularSpeed)
        break
      case 'right':
        sendVelocityCommand(0, -angularSpeed)
        break
      case 'stop':
        sendVelocityCommand(0, 0)
        break
    }
  }

  const sendArmCommand = (joint: number, position: number) => {
    onDataRequest?.(id, {
      action: 'arm_command',
      joint_index: joint,
      position: position
    })
  }

  const sendGripperCommand = (position: number) => {
    setArmCommand(prev => ({ ...prev, gripper: position }))
    onDataRequest?.(id, {
      action: 'gripper_command',
      position: position
    })
  }

  const emergencyStop = () => {
    onDataRequest?.(id, {
      action: 'emergency_stop'
    })
  }

  const homeRobot = () => {
    onDataRequest?.(id, {
      action: 'home_robot'
    })
  }

  const startMission = () => {
    onDataRequest?.(id, {
      action: 'start_mission',
      waypoints: currentData.mission_waypoints
    })
  }

  const renderMovementControls = () => (
    <div className="space-y-3">
      {/* Emergency Stop */}
      <Button
        variant={currentData.robot_status.emergency_stop ? "default" : "destructive"}
        className="w-full"
        onClick={currentData.robot_status.emergency_stop ? () => onDataRequest?.(id, { action: 'reset_estop' }) : emergencyStop}
      >
        <Square className="h-4 w-4 mr-2" />
        {currentData.robot_status.emergency_stop ? 'Reset E-Stop' : 'Emergency Stop'}
      </Button>

      {/* Direction Controls */}
      <div className="grid grid-cols-3 gap-2">
        <div />
        <Button
          variant="outline"
          onMouseDown={() => sendDirectionCommand('forward')}
          onMouseUp={() => sendDirectionCommand('stop')}
          disabled={currentData.robot_status.emergency_stop}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <div />
        <Button
          variant="outline"
          onMouseDown={() => sendDirectionCommand('left')}
          onMouseUp={() => sendDirectionCommand('stop')}
          disabled={currentData.robot_status.emergency_stop}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={() => sendDirectionCommand('stop')}
          disabled={currentData.robot_status.emergency_stop}
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onMouseDown={() => sendDirectionCommand('right')}
          onMouseUp={() => sendDirectionCommand('stop')}
          disabled={currentData.robot_status.emergency_stop}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div />
        <Button
          variant="outline"
          onMouseDown={() => sendDirectionCommand('backward')}
          onMouseUp={() => sendDirectionCommand('stop')}
          disabled={currentData.robot_status.emergency_stop}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <div />
      </div>

      {/* Speed Controls */}
      <div className="space-y-2">
        <Label className="text-xs">Linear Speed: {velocityCommand.linear.toFixed(1)} m/s</Label>
        <Slider
          value={[Math.abs(velocityCommand.linear)]}
          onValueChange={(value) => setVelocityCommand(prev => ({ ...prev, linear: prev.linear >= 0 ? value[0] : -value[0] }))}
          max={robotConfig?.maxLinearSpeed || 2.0}
          step={0.1}
          className="w-full"
          disabled={currentData.robot_status.emergency_stop}
        />
        <Label className="text-xs">Angular Speed: {velocityCommand.angular.toFixed(1)} rad/s</Label>
        <Slider
          value={[Math.abs(velocityCommand.angular)]}
          onValueChange={(value) => setVelocityCommand(prev => ({ ...prev, angular: prev.angular >= 0 ? value[0] : -value[0] }))}
          max={robotConfig?.maxAngularSpeed || 2.0}
          step={0.1}
          className="w-full"
          disabled={currentData.robot_status.emergency_stop}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={homeRobot}
          disabled={currentData.robot_status.emergency_stop}
          className="flex-1"
        >
          <Home className="h-4 w-4 mr-1" />
          Home
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMissionMode(!missionMode)}
          disabled={currentData.robot_status.emergency_stop}
          className="flex-1"
        >
          <Target className="h-4 w-4 mr-1" />
          Mission
        </Button>
      </div>
    </div>
  )

  const renderArmControls = () => {
    if (!robotConfig?.enableArm || !currentData.arm_state) return null

    return (
      <div className="space-y-3">
        <div className="text-sm font-medium">Arm Control</div>
        
        {/* Joint Controls */}
        <div className="space-y-2">
          {currentData.arm_state.joint_positions.map((position, index) => (
            <div key={index}>
              <Label className="text-xs">Joint {index + 1}: {position.toFixed(2)} rad</Label>
              <Slider
                value={[position]}
                onValueChange={(value) => sendArmCommand(index, value[0])}
                min={-Math.PI}
                max={Math.PI}
                step={0.1}
                className="w-full"
                disabled={currentData.robot_status.emergency_stop}
              />
            </div>
          ))}
        </div>

        {/* Gripper Control */}
        {robotConfig?.enableGripper && (
          <div className="space-y-2">
            <Label className="text-xs">Gripper: {(currentData.arm_state.gripper_position * 100).toFixed(0)}%</Label>
            <Slider
              value={[currentData.arm_state.gripper_position]}
              onValueChange={(value) => sendGripperCommand(value[0])}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
              disabled={currentData.robot_status.emergency_stop}
            />
            <div className="text-xs text-muted-foreground">
              Force: {currentData.arm_state.gripper_force.toFixed(1)} N
            </div>
          </div>
        )}

        {/* End Effector Position */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">X</div>
            <div className="font-mono">{currentData.arm_state.end_effector_position.x.toFixed(3)} m</div>
          </div>
          <div>
            <div className="text-muted-foreground">Y</div>
            <div className="font-mono">{currentData.arm_state.end_effector_position.y.toFixed(3)} m</div>
          </div>
          <div>
            <div className="text-muted-foreground">Z</div>
            <div className="font-mono">{currentData.arm_state.end_effector_position.z.toFixed(3)} m</div>
          </div>
        </div>
      </div>
    )
  }

  const renderMissionPlanning = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Mission Waypoints</div>
        <Button
          variant="default"
          size="sm"
          onClick={startMission}
          disabled={currentData.robot_status.emergency_stop}
        >
          <Play className="h-4 w-4 mr-1" />
          Start
        </Button>
      </div>
      
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {currentData.mission_waypoints.map((waypoint, index) => (
          <div 
            key={waypoint.id}
            className={`
              flex items-center justify-between p-2 rounded border cursor-pointer
              ${index === currentData.current_waypoint ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}
              ${waypoint.completed ? 'opacity-60' : ''}
            `}
            onClick={() => setSelectedWaypoint(selectedWaypoint === waypoint.id ? null : waypoint.id)}
          >
            <div className="flex items-center gap-2">
              <Badge 
                variant={waypoint.completed ? "default" : index === currentData.current_waypoint ? "secondary" : "outline"}
                className="text-xs"
              >
                {index + 1}
              </Badge>
              <div>
                <div className="text-sm font-medium">{waypoint.action}</div>
                <div className="text-xs text-muted-foreground">
                  ({waypoint.position.x.toFixed(1)}, {waypoint.position.y.toFixed(1)})
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {waypoint.completed && (
                <Badge variant="outline" className="text-xs text-green-600">
                  ✓
                </Badge>
              )}
              {index === currentData.current_waypoint && !waypoint.completed && (
                <Badge variant="outline" className="text-xs text-blue-600">
                  →
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-muted-foreground">
        Progress: {currentData.mission_waypoints.filter(w => w.completed).length} / {currentData.mission_waypoints.length} waypoints
      </div>
    </div>
  )

  const renderRobotStatus = () => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <div className="text-muted-foreground">Connection</div>
        <Badge className={getStatusColor(currentData.connection_status)}>
          {currentData.connection_status}
        </Badge>
      </div>
      <div>
        <div className="text-muted-foreground">Control</div>
        <Badge variant="outline">{currentData.control_authority}</Badge>
      </div>
      <div>
        <div className="text-muted-foreground">Battery</div>
        <div className={`font-mono ${getBatteryColor(currentData.robot_status.battery_level)}`}>
          {currentData.robot_status.battery_level.toFixed(1)}%
        </div>
      </div>
      <div>
        <div className="text-muted-foreground">Signal</div>
        <div className="font-mono">{currentData.robot_status.signal_strength}%</div>
      </div>
      <div>
        <div className="text-muted-foreground">CPU</div>
        <div className="font-mono">{currentData.robot_status.cpu_usage.toFixed(1)}%</div>
      </div>
      <div>
        <div className="text-muted-foreground">Temperature</div>
        <div className="font-mono">{currentData.robot_status.temperature.toFixed(1)}°C</div>
      </div>
      <div>
        <div className="text-muted-foreground">Position</div>
        <div className="font-mono">
          ({currentData.pose.position.x.toFixed(1)}, {currentData.pose.position.y.toFixed(1)})
        </div>
      </div>
      <div>
        <div className="text-muted-foreground">Heading</div>
        <div className="font-mono">{(currentData.pose.orientation.yaw * 180 / Math.PI).toFixed(0)}°</div>
      </div>
      {currentData.robot_status.warnings.length > 0 && (
        <div className="col-span-2">
          <div className="text-muted-foreground">Warnings</div>
          {currentData.robot_status.warnings.map((warning, index) => (
            <Badge key={index} variant="outline" className="text-xs text-yellow-600 mr-1">
              {warning}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )

  const renderSettings = () => (
    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded">
      <div className="space-y-2">
        <Label className="text-xs">Robot Type</Label>
        <Select
          value={robotConfig?.robotType || 'ground'}
          onValueChange={(value) => handleConfigChange('robotType', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ground">Ground Robot</SelectItem>
            <SelectItem value="aerial">Aerial/Drone</SelectItem>
            <SelectItem value="underwater">Underwater</SelectItem>
            <SelectItem value="humanoid">Humanoid</SelectItem>
            <SelectItem value="arm">Robotic Arm</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Control Mode</Label>
        <Select
          value={robotConfig?.controlMode || 'manual'}
          onValueChange={(value) => handleConfigChange('controlMode', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="assisted">Assisted</SelectItem>
            <SelectItem value="autonomous">Autonomous</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="enable-arm"
          checked={robotConfig?.enableArm || false}
          onCheckedChange={(checked) => handleConfigChange('enableArm', checked)}
        />
        <Label htmlFor="enable-arm" className="text-xs">Enable Arm</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="enable-gripper"
          checked={robotConfig?.enableGripper || false}
          onCheckedChange={(checked) => handleConfigChange('enableGripper', checked)}
        />
        <Label htmlFor="enable-gripper" className="text-xs">Enable Gripper</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="safety-enabled"
          checked={robotConfig?.safetyEnabled || false}
          onCheckedChange={(checked) => handleConfigChange('safetyEnabled', checked)}
        />
        <Label htmlFor="safety-enabled" className="text-xs">Safety Features</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="obstacle-avoidance"
          checked={robotConfig?.obstacleAvoidance || false}
          onCheckedChange={(checked) => handleConfigChange('obstacleAvoidance', checked)}
        />
        <Label htmlFor="obstacle-avoidance" className="text-xs">Obstacle Avoidance</Label>
      </div>
    </div>
  )

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {robotConfig?.title || title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(currentData.connection_status)}>
              {currentData.connection_status}
            </Badge>
            {currentData.robot_status.emergency_stop && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                E-STOP
              </Badge>
            )}
            <div className={`flex items-center gap-1 ${getBatteryColor(currentData.robot_status.battery_level)}`}>
              <Battery className="h-3 w-3" />
              <span className="text-xs">{currentData.robot_status.battery_level.toFixed(0)}%</span>
            </div>
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
        
        <Tabs defaultValue="movement" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="movement" className="text-xs">Movement</TabsTrigger>
            <TabsTrigger value="arm" className="text-xs">Arm</TabsTrigger>
            <TabsTrigger value="mission" className="text-xs">Mission</TabsTrigger>
            <TabsTrigger value="status" className="text-xs">Status</TabsTrigger>
          </TabsList>
          <TabsContent value="movement" className="mt-3">
            {renderMovementControls()}
          </TabsContent>
          <TabsContent value="arm" className="mt-3">
            {renderArmControls() || (
              <div className="text-center text-muted-foreground text-sm">
                Arm controls disabled
              </div>
            )}
          </TabsContent>
          <TabsContent value="mission" className="mt-3">
            {renderMissionPlanning()}
          </TabsContent>
          <TabsContent value="status" className="mt-3">
            {renderRobotStatus()}
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground text-center">
          Last Command: {new Date(currentData.last_command_time).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}

// AriesMod configuration
export const RobotControlsMod: AriesMod = {
  metadata: {
    id: 'robot-controls',
    displayName: 'Enhanced Robot Controls',
    description: 'Comprehensive robot control interface with movement, arm control, mission planning, and safety features',
    category: 'controls',
    tags: ['robot', 'control', 'movement', 'arm', 'mission', 'safety', 'navigation'],
    version: '1.0.0',
    author: 'AriesUI',
    thumbnail: '/thumbnails/robot-controls.png',
    defaultSize: { width: 450, height: 500 },
    minSize: { width: 350, height: 400 },
    maxSize: { width: 600, height: 700 },
    supportedDataTypes: ['robot', 'control', 'telemetry'],
    configurable: true,
    hardwareIntegrated: true
  },
  component: RobotControls,
  defaultConfig: {
    title: 'Robot Controls',
    robotType: 'ground',
    controlMode: 'manual',
    maxLinearSpeed: 2.0,
    maxAngularSpeed: 2.0,
    maxArmSpeed: 1.0,
    safetyEnabled: true,
    obstacleAvoidance: true,
    autoReturn: false,
    enableArm: true,
    enableGripper: true,
    enableCamera: true,
    missionPlanning: true,
    telemetryRate: 10,
    joystickDeadzone: 0.1
  },
  generateDummyData: () => ({
    value: 0.5,
    timestamp: new Date().toISOString(),
    pose: {
      position: { x: 2.5, y: 1.8, z: 0.3 },
      orientation: { roll: 0.02, pitch: -0.01, yaw: 1.57 },
      linear_velocity: { x: 0.0, y: 0.0, z: 0.0 },
      angular_velocity: { x: 0.0, y: 0.0, z: 0.0 }
    },
    arm_state: {
      joint_positions: [0.0, -0.5, 1.2, 0.0, 0.8, 0.0],
      joint_velocities: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      end_effector_position: { x: 0.6, y: 0.0, z: 0.4 },
      gripper_position: 0.5,
      gripper_force: 10.0
    },
    robot_status: {
      battery_level: 78.5,
      signal_strength: 85,
      cpu_usage: 45.2,
      temperature: 42.8,
      errors: [],
      warnings: [],
      emergency_stop: false,
      is_homed: true
    },
    mission_waypoints: [],
    current_waypoint: 0,
    connection_status: 'connected' as const,
    control_authority: 'local' as const,
    last_command_time: Date.now() - 1000,
    metadata: { source: 'demo' }
  }),
  validateConfig: (config: Record<string, any>) => {
    return typeof config.title === 'string' && 
           typeof config.maxLinearSpeed === 'number' &&
           config.maxLinearSpeed > 0
  }
}

export default RobotControls 