# Game Design Document: RabbitMQ Virtual Office

## 1. Visual Style & Palette
- **Perspective**: 2:1 Isometric Projection (Tile width: 64px, Tile height: 32px).
- **Aesthetic**: Warm retro pixel-art office simulation (inspired by Habbo, Kairosoft office simulators, and Cyberpunk cozy themes).
- **Color Themes**:
  - Floor: Charcoal tiles (`#1e293b`), Wood accent panels (`#334155`)
  - Publisher Station: Cyan glow (`#06b6d4`, `#0891b2`)
  - Exchange (Sorting Hub): Amber/Orange mechanics (`#f59e0b`, `#d97706`)
  - Queue Shelves: Emerald green / Teal storage racks (`#10b981`, `#059669`)
  - Consumer Desks: Violet / Indigo workstations (`#6366f1`, `#4f46e5`)
  - DLQ / Failure Depot: Crimson / Ruby warning area (`#ef4444`, `#dc2626`)
  - Parcels: Glowing neon cubes (`#38bdf8` normal, `#f87171` nack/poison)

## 2. World Coordinate System
Isometric transformation:
```typescript
function cartToIso(x: number, y: number): { x: number, y: number } {
  return {
    x: (x - y) * 32,
    y: (x + y) * 16
  };
}
```

## 3. Entity Specifications

### 3.1 Publisher (The Office Dispatcher)
- **Role**: Dispatches messages into the office.
- **Visual**: Desk with typing animation, stamp machine that emits parcels along the conveyor.
- **States**: `Idle`, `Typing`, `Dispatching`.

### 3.2 Exchange (The Sorting Matrix)
- **Role**: Receives messages from publishers and routes them to target queues.
- **Visual**: Central mechanical sorting console with flashing indicator lights and directional routing levers.
- **States**: `Idle`, `Routing`, `Directing`.

### 3.3 Queue (The Warehouse Shelf)
- **Role**: Holds message parcels waiting for consumers.
- **Visual**: Multilevel isometric metal rack. Parcels visibly stack vertically and in rows based on queue backlog depth.
- **States**: `Empty` (0-2 parcels), `Normal` (3-10 parcels), `Backlog Warning` (11-25 parcels), `Overload Critical` (>25 parcels glowing red with warning signs).

### 3.4 Consumer (The Office Worker)
- **Role**: Takes parcels from the queue shelf and processes them.
- **Visual**: Worker character seated at a computer desk. Picks up parcel, types/processes, then files it away (ACK) or raises exclamation mark (NACK).
- **States**: `Idle`, `Processing`, `AckSuccess` (green sparkle), `NackFailure` (red smoke), `Offline` (worker absent / sleeping).

### 3.5 Message Parcels
- **Visual**: 12x12 isometric pixel gift box with ribbon and gentle hover/pulse glow.
- **Movement**: Smooth linear interpolation along waypoint paths (Conveyor A -> Exchange -> Conveyor B -> Shelf -> Desk -> Archive).
