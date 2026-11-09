# Roadmap: RabbitMQ Virtual Office

## Milestones Overview

### Phase 1: Playable Visual Prototype (Current Milestone)
- [x] Monorepo structure setup (Angular + .NET 10 solution)
- [x] Phaser 3 isometric virtual office scene
- [x] Pixel-art procedural sprites (Office floor, publisher desk, exchange sorter, queue shelves, consumer desks, workers, parcels)
- [x] Entity state machines (idle, working, walking, error, offline)
- [x] Parcel journey animations (Publisher -> Sorter -> Queue Shelf -> Consumer -> ACK/DLQ)
- [x] Dynamic queue backlog visual stacking
- [x] Traffic simulator with presets: Quiet, Normal, Spike, Error/NACK
- [x] Interactive UI overlay (HUD metrics, speed controls, camera pan/zoom, node inspector)
- [x] Verification and unit testing

### Phase 2: Backend Monitoring Foundation
- [x] .NET 10 Web API and Clean Architecture scaffold
- [x] RabbitMQ Management HTTP API client (`/api/overview`, `/api/queues`, `/api/exchanges`)
- [x] SignalR Hub (`/hubs/monitoring`) broadcasting `BrokerSnapshotDto`
- [x] Background Polling Service with rate limiting and resilience
- [x] Health checks and secure configuration handling

### Phase 3: Real-Time Game Integration
- [ ] Connect Angular SignalR service to live .NET Backend
- [ ] Seamless toggle between Demo Mode and Live RabbitMQ Mode
- [ ] Dynamic multi-queue and multi-consumer layout generation
- [ ] Connection health, heartbeat, and stale-data indicators

### Phase 4: Advanced Observability
- [ ] OpenTelemetry & MassTransit trace correlation
- [ ] Individual message tracing timeline
- [ ] Dead Letter Queue (DLQ) automated inspection drawer
- [ ] Historical throughput charts

### Phase 5: Open Source & Production Packaging
- [ ] Docker Compose one-command launch (`docker-compose up`)
- [ ] GitHub Actions CI pipeline
- [ ] Public v0.1.0 release
