# 🐰 RabbitMQ Virtual Office

[![CI Status](https://github.com/aungaung99/rabbitmq-virtual-office/actions/workflows/ci.yml/badge.svg)](https://github.com/aungaung99/rabbitmq-virtual-office/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-21+-dd0031.svg)](https://angular.dev/)
[![Phaser](https://img.shields.io/badge/Phaser-3.88+-e91e63.svg)](https://phaser.io/)
[![.NET](https://img.shields.io/badge/.NET-10.0-512bd4.svg)](https://dotnet.microsoft.com/)

> An interactive 2D isometric pixel-art virtual office that visualizes real-time RabbitMQ message traffic, queue depths, exchange routing, and consumer activity.

---

## 📸 Overview

Traditional RabbitMQ monitoring dashboards (e.g. RabbitMQ Management UI, Grafana) are technical, tabular, and disconnected from the intuitive physical metaphor of message queues. 

**RabbitMQ Virtual Office** turns your messaging infrastructure into a bustling, living pixel-art office:
- 📦 **Publishers**: Office dispatchers creating and stamping message parcels.
- ⚙️ **Exchanges**: Automated sorting machines directing parcels onto conveyor belts.
- 🗄️ **Queues**: Warehouse storage racks that visibly fill up with parcels as backlogs grow.
- 🧑‍💻 **Consumers**: Office workers taking parcels from racks, processing them, and acknowledging them (ACK) with green confetti or failing (NACK) into the Dead Letter Queue.
- 🚨 **Live Diagnostics**: Real-time traffic spike alerts, idle worker warnings, and queue congestion states.

---

## 🛠️ Tech Stack

- **Frontend**: Angular 21+, TypeScript, Tailwind CSS
- **Game Engine**: Phaser 3 (2D Isometric Rendering with crisp pixel-art canvas)
- **Backend**: ASP.NET Core (.NET 10), SignalR
- **Broker**: RabbitMQ with Management HTTP API
- **Deployment**: Docker Compose & GitHub Actions CI

---

## 🚀 Quick Start

### 1. Frontend Development (Phase 1 Playable Prototype)
```bash
cd frontend
npm install
npm start
```
Open [http://localhost:4200](http://localhost:4200) in your browser. The app starts immediately in **Interactive Demo Mode** with traffic presets (Quiet, Normal, Spike, Error/NACK).

### 2. Backend Development (.NET 10 Web API & SignalR)
```bash
cd backend
dotnet restore
dotnet build
dotnet run --project src/Api
```

### 3. Full Docker Environment (Phase 5)
```bash
docker compose up --build
```

---

## 🎮 Game Controls

- **Pan**: Click and drag on the office floor, or use Arrow / WASD keys.
- **Zoom**: Mouse wheel or on-screen `+` / `-` buttons.
- **Inspect**: Click on any entity (Publisher desk, Exchange sorter, Queue shelf, Consumer worker) to inspect live rates and status.
- **Simulation Controls**:
  - `Presets`: Quiet (2 msg/s), Normal (15 msg/s), Spike (80 msg/s), Error Spike (NACK surge).
  - `Speed`: 0.5x, 1x, 2x, or Pause.

---

## 📁 Repository Structure

```text
rabbitmq-virtual-office/
├── frontend/               # Angular + Phaser 3 Virtual Office application
│   └── src/app/
│       ├── core/          # Services, SignalR, Simulation state
│       ├── features/      # HUD, Inspector modals, Navigation
│       └── game/          # Phaser 3 Isometric scenes, entities, and graphics
├── backend/                # .NET 10 Monitoring Web API & SignalR Hub
│   ├── src/
│   │   ├── Api/           # SignalR Hub and REST endpoints
│   │   ├── Application/   # Aggregation & snapshot services
│   │   ├── Contracts/     # DTOs and event models
│   │   └── Infrastructure/# RabbitMQ Management API HTTP client
│   └── tests/             # xUnit unit tests
├── deploy/                 # Docker Compose and deployment files
├── docs/                   # Architecture, Roadmap, Game Design documents
└── .github/workflows/      # GitHub Actions CI pipeline
```

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
