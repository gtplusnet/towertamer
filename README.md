# Tower Tamer RPG

A simple web-based RPG game with mobile-first design and touch controls.

## Project Structure

This is a **monorepo** using Yarn workspaces, allowing you to manage frontend and backend from the root directory.

```
towertamer/
├── frontend/          # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components (Character, GameMap, TouchController)
│   │   ├── hooks/         # Custom React hooks (movement, swipe detection)
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions (sprite renderer)
│   └── package.json
├── backend/           # Backend API (planned for future)
├── package.json       # Root workspace configuration
├── ecosystem.config.js    # PM2 process manager config
└── README.md
```

## Features

- **Mobile-First Design**: Optimized for mobile viewport (320px-428px)
- **Touch/Swipe Controls**: Swipe in any direction to move the character
- **Pixel Art Character**: 16x16 pixel art sprite with walk animations
- **Walk Cycle Animation**: 3-frame animation for each direction
- **4-Directional Movement**: Move up, down, left, and right
- **Simple Game Map**: Grid-based grass tile background
- **Boundary Detection**: Character stays within screen bounds

## Getting Started

### Running with PM2 (Recommended)

The game is configured to run as a managed PM2 process:

```bash
# Start the game
pm2 start ecosystem.config.js

# Check status
pm2 list

# View logs
pm2 logs towertamer-frontend --lines 20 --nostream

# Stop the game
pm2 stop towertamer-frontend

# Restart the game
pm2 restart towertamer-frontend

# Remove from PM2
pm2 delete towertamer-frontend
```

### Manual Development (Alternative)

```bash
# From root directory (recommended)
yarn install
yarn dev

# Or from frontend directory
cd frontend
yarn dev
```

The game will be available at:
- Local: `http://localhost:4024`
- Network: `http://100.121.246.85:4024`

### Controls

- **Swipe Up**: Move character up
- **Swipe Down**: Move character down
- **Swipe Left**: Move character left
- **Swipe Right**: Move character right

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS Modules** - Scoped styling
- **HTML5 Canvas** - Sprite rendering

## Game Architecture

### Components

- **Character**: Renders the pixel art sprite with animations
- **GameMap**: Grid-based map with grass tiles
- **TouchController**: Handles swipe detection and movement input

### Hooks

- **useCharacterMovement**: Manages character position, direction, and animation state
- **useSwipeDetection**: Detects touch/swipe gestures and calculates direction

### Sprite System

- 16x16 pixel art sprites
- 3 animation frames per direction
- 4 directions (up, down, left, right)
- Rendered using HTML5 Canvas with pixel-perfect scaling

## Future Enhancements

- Backend API for game state persistence
- Multiplayer support
- Enemies and combat system
- Inventory and items
- Quests and storyline
- Sound effects and music
