import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../../core/services/simulation.service';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="hud-topbar">
      <!-- Title & Branding -->
      <div class="brand">
        <span class="logo-emoji">🐰</span>
        <div class="brand-text">
          <h1>RabbitMQ Virtual Office</h1>
          <span class="sub-label">Interactive Real-Time Infrastructure Simulation</span>
        </div>
      </div>

      <!-- Mode Badge -->
      <div class="mode-badge-container">
        <div class="mode-pill" [ngClass]="getModeClass()">
          <span class="pulsing-dot"></span>
          <span>{{ getModeLabel() }}</span>
        </div>
      </div>

      <!-- Telemetry Stats Cards -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-label">Publish Rate</span>
          <span class="stat-value text-cyan">{{ simulation.snapshot().totalPublishRate }} <small>msg/s</small></span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Deliver Rate</span>
          <span class="stat-value text-amber">{{ simulation.snapshot().totalDeliverRate }} <small>msg/s</small></span>
        </div>

        <div class="stat-card">
          <span class="stat-label">ACK Rate</span>
          <span class="stat-value text-emerald">{{ simulation.snapshot().totalAckRate }} <small>msg/s</small></span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Total Backlog</span>
          <span class="stat-value" [ngClass]="getBacklogClass()">
            {{ simulation.snapshot().totalBacklog }} <small>pkgs</small>
          </span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .hud-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid rgba(51, 65, 85, 0.6);
      color: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-emoji {
      font-size: 28px;
    }

    .brand-text h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #f1f5f9;
    }

    .sub-label {
      font-size: 11px;
      color: #94a3b8;
    }

    .mode-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .mode-pill.normal {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.35);
    }

    .mode-pill.spike {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.35);
    }

    .mode-pill.error {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.35);
    }

    .mode-pill.quiet {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.35);
    }

    .pulsing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 8px currentColor;
    }

    .stats-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      background: rgba(30, 41, 59, 0.5);
      padding: 4px 12px;
      border-radius: 6px;
      border: 1px solid rgba(51, 65, 85, 0.4);
    }

    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }

    .stat-value {
      font-size: 14px;
      font-weight: 700;
      font-family: monospace;
    }

    .stat-value small {
      font-size: 10px;
      font-weight: normal;
      color: #94a3b8;
    }

    .text-cyan { color: #38bdf8; }
    .text-amber { color: #fbbf24; }
    .text-emerald { color: #34d399; }
    .text-red { color: #f87171; }
  `]
})
export class HudComponent {
  simulation = inject(SimulationService);

  getModeLabel(): string {
    const m = this.simulation.mode();
    switch (m) {
      case 'DemoQuiet': return 'Simulated Demo (Quiet)';
      case 'DemoNormal': return 'Simulated Demo (Normal)';
      case 'DemoSpike': return 'Simulated Demo (Traffic Spike)';
      case 'DemoErrorSpike': return 'Simulated Demo (DLQ/Failure)';
      case 'LiveMetrics': return 'Live RabbitMQ Broker';
      default: return m;
    }
  }

  getModeClass(): string {
    const m = this.simulation.mode();
    if (m === 'DemoSpike') return 'spike';
    if (m === 'DemoErrorSpike') return 'error';
    if (m === 'DemoQuiet') return 'quiet';
    return 'normal';
  }

  getBacklogClass(): string {
    const backlog = this.simulation.snapshot().totalBacklog;
    if (backlog > 80) return 'text-red';
    if (backlog > 25) return 'text-amber';
    return 'text-emerald';
  }
}
