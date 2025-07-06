/**
 * Main Content Module - Modular Grid System
 * 
 * This module provides a refactored, modular approach to the main content grid system.
 * The original 1700+ line main-content.tsx has been broken down into focused components:
 * 
 * - MainContent: Main orchestrator component
 * - StateManager: Handles all state management and auto-save
 * - PerformanceManager: Manages performance optimizations and virtual grid
 * - EventHandlers: Handles all mouse/keyboard events
 * - Types: TypeScript definitions for the module
 */

// Main orchestrator component
export { MainContent } from './MainContent'

// Modular components
export { StateManager, useStateContext } from './StateManager'
export { PerformanceManager, usePerformanceContext } from './PerformanceManager'
export { EventHandlers } from './EventHandlers'

// Type definitions
export type * from './types'

// Default export is the main component
export default MainContent 