# RabbitMQ Virtual Office Architecture

## 1. High-Level Architecture Overview

RabbitMQ Virtual Office bridges real-world distributed message broker telemetry with an interactive 2D isometric pixel-art simulation.

```text
+--------------------------------------------------------------+
|                     RabbitMQ Broker                          |
|  - Management HTTP API (:15672)                              |
|  - Exchanges, Queues, Bindings, Consumers, Message Rates     |
+------------------------------+-------------------------------+
                               |
                               | Polling (1-3s intervals)
                               v
+--------------------------------------------------------------+
|                  .NET 10 Backend Service                     |
|  - RabbitMqManagementClient (Typed HttpClient)               |
|  - RabbitMqPollingService (BackgroundService)                |
|  - SnapshotAggregator & Metric Normalizer                    |
|  - SignalR MonitoringHub (/hubs/monitoring)                  |
+------------------------------+-------------------------------+
                               |
                               | WebSocket (SignalR)
                               v
+--------------------------------------------------------------+
|               Angular 21+ Frontend Application               |
|  - SignalR Service & Connection Recovery                     |
|  - Simulation Mode Switcher (Live SignalR vs Demo Preset)    |
|  - Metrics Dashboard & Interactive Inspection Overlays       |
|  - Phaser 3 Game Wrapper & Canvas Viewport                   |
+------------------------------+-------------------------------+
                               |
                               | Game Events & Store
                               v
+--------------------------------------------------------------+
|               Phaser 3 Virtual Office Engine                 |
|  - Isometric Tile Grid (Projections: cartToIso, isoToCart)   |
|  - Office Scene: Workstations, Shelves, Conveyors, Sorters   |
|  - Animated Entities: Publishers, Exchange, Queues, Workers  |
|  - Particle System: Message Parcels, ACKs, NACK alerts       |
|  - Non-linear Parcel Rate Scaler (Preserves exact metrics)   |
+--------------------------------------------------------------+
```

## 2. Core Modules

### 2.1 Backend (.NET 10)
- **`Contracts`**: Pure records and DTOs representing broker states, queue metrics, exchange metrics, and SignalR messages.
- **`Application`**: Service abstractions and orchestration logic for snapshot aggregation and traffic throttling.
- **`Infrastructure`**: HTTP client interacting with the RabbitMQ Management API (`/api/overview`, `/api/queues`, `/api/exchanges`), background worker for periodic sampling, and resilient retry logic.
- **`Api`**: ASP.NET Core minimal APIs for health checks, environment status, configuration, and SignalR `MonitoringHub`.

### 2.2 Frontend (Angular + Phaser 3)
- **`src/app/core`**: Core services, SignalR client, simulation state store, audio/settings manager.
- **`src/app/features`**: UI overlay, control toolbar (presets, pause, speed), queue inspector modal, metrics charts.
- **`src/app/game`**:
  - `scenes/OfficeScene.ts`: Isometric world setup, tile rendering, lighting, camera controls (zoom/pan).
  - `characters/WorkerCharacter.ts`: Pixel-art workers with idle, walking, processing, and error animations.
  - `objects/QueueShelf.ts`: Storage shelves with dynamic parcel stacking reflecting queue depth.
  - `objects/ConveyorBelt.ts`: Conveyor belts carrying parcels between stages.
  - `systems/TrafficScaler.ts`: Maps real-world messages/second to visual parcel spawn rates smoothly.

## 3. Visualization Principles & Constraints
1. **Metrics Mode vs Tracing Mode**: Aggregate metrics represent traffic volume with representative parcels. Tracing mode is reserved for correlated span data.
2. **Deterministic Scaling**: We never spawn 10,000 parcels for 10,000 msg/s. Instead, we use logarithmic/non-linear scaling (`min(30, log2(rate + 1) * 4)`) to ensure smooth 60 FPS performance.
3. **Zero Secret Leakage**: RabbitMQ credentials are kept strictly on the backend. The frontend connects exclusively to the .NET proxy and SignalR hub.
