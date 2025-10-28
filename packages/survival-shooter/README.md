# Survival Shooter

A survival shooter game component built with React and Canvas 2D.

## Features

- Top-down survival shooter gameplay
- Multiple weapon types with unique behaviors
- Enemy variety with different movement patterns
- Item and upgrade system
- Particle effects
- Magnetic resource collection

## Usage

```tsx
import { SurvivalShooter } from 'survival-shooter'

export function MyComponent() {
  return (
    <SurvivalShooter
      availableResources={10}
      onExit={() => console.log('Game exited')}
    />
  )
}
```

## Architecture

The game uses a modular architecture with:

- **Weapons**: Extensible weapon system with custom behaviors and visuals
- **Enemies**: Flexible enemy types with custom movement patterns and rendering
- **Items**: Stackable upgrade system with weapon-specific effects
- **Event Bus**: Decoupled event system for game events
- **Engine**: Frame-based update loop with delta time physics
