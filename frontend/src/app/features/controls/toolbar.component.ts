import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../../core/services/simulation.service';
import { SimulationTrafficMode } from '../../core/models/broker.model';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="control-panel">
      <!-- Traffic Presets -->
      <div class="panel-section">
        <span class="section-title">Telemetry Mode</span>
        <div class="button-group">
          <button
            (click)="selectPreset('DemoQuiet')"
            [class.active]="simulation.mode() === 'DemoQuiet'"
            title="Low traffic (2 msg/s)">
            🌱 Quiet
          </button>
          <button
            (click)="selectPreset('DemoNormal')"
            [class.active]="simulation.mode() === 'DemoNormal'"
            title="Balanced normal office flow (15 msg/s)">
            ⚡ Normal
          </button>
          <button
            (click)="selectPreset('DemoSpike')"
            [class.active]="simulation.mode() === 'DemoSpike'"
            title="Heavy burst (85 msg/s, shelf accumulates backlog)">
            🔥 Spike
          </button>
          <button
            (click)="selectPreset('DemoErrorSpike')"
            [class.active]="simulation.mode() === 'DemoErrorSpike'"
            title="Consumer failure / NACK diverted to Dead Letter Queue">
            🚨 Error DLQ
          </button>
        </div>
        <button
          class="live-mode-btn"
          (click)="selectPreset('LiveMetrics')"
          [class.active]="simulation.mode() === 'LiveMetrics'"
          title="Connect to actual local RabbitMQ broker">
          📡 Live RabbitMQ Broker
        </button>
      </div>

      <!-- Live Broker Actions (Visible when in Live Mode or backend active) -->
      <div class="panel-section live-actions">
        <span class="section-title">Live Actions</span>
        <div class="button-group">
          <button class="action-btn" (click)="onSetupQueues()" [disabled]="actionPending()">
            🛠️ Create Queues
          </button>
          <button class="action-btn publish-btn" (click)="onPublishMessage()" [disabled]="actionPending()">
            ✉️ Send Msg
          </button>
        </div>
        @if (actionStatus()) {
          <div class="action-feedback">{{ actionStatus() }}</div>
        }
      </div>

      <!-- Playback & Speed -->
      <div class="panel-section">
        <span class="section-title">Simulation Speed</span>
        <div class="button-group">
          <button
            (click)="simulation.togglePause()"
            [class.paused]="simulation.isPaused()">
            {{ simulation.isPaused() ? '▶ Resume' : '⏸ Pause' }}
          </button>
          <button
            (click)="simulation.setSpeed(0.5)"
            [class.active]="simulation.simulationSpeed() === 0.5 && !simulation.isPaused()">
            0.5x
          </button>
          <button
            (click)="simulation.setSpeed(1.0)"
            [class.active]="simulation.simulationSpeed() === 1.0 && !simulation.isPaused()">
            1x
          </button>
          <button
            (click)="simulation.setSpeed(2.0)"
            [class.active]="simulation.simulationSpeed() === 2.0 && !simulation.isPaused()">
            2x
          </button>
        </div>
      </div>

      <!-- Helper info hint -->
      <div class="hint-box">
        💡 <strong>Tip:</strong> Click any station or worker character to inspect live queue metrics. Drag mouse to pan, scroll to zoom.
      </div>
    </aside>
  `,
  styles: [`
    .control-panel {
      position: absolute;
      bottom: 24px;
      left: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(10px);
      padding: 16px;
      border-radius: 10px;
      border: 1px solid rgba(51, 65, 85, 0.7);
      color: #f1f5f9;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      z-index: 100;
      width: 300px;
      user-select: none;
    }

    .panel-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
    }

    .button-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    button {
      flex: 1;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid rgba(71, 85, 105, 0.6);
      background: rgba(30, 41, 59, 0.8);
      color: #cbd5e1;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    button:hover:not(:disabled) {
      background: rgba(51, 65, 85, 0.9);
      color: #ffffff;
      border-color: #64748b;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button.active {
      background: #0284c7;
      border-color: #38bdf8;
      color: #ffffff;
      font-weight: 600;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
    }

    button.live-mode-btn {
      width: 100%;
      margin-top: 4px;
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.4);
      color: #34d399;
    }

    button.live-mode-btn.active {
      background: #059669;
      border-color: #34d399;
      color: #ffffff;
      box-shadow: 0 0 12px rgba(52, 211, 153, 0.5);
    }

    button.publish-btn {
      background: rgba(245, 158, 11, 0.2);
      border-color: rgba(245, 158, 11, 0.5);
      color: #fbbf24;
    }

    button.publish-btn:hover:not(:disabled) {
      background: #d97706;
      color: #ffffff;
    }

    button.paused {
      background: #e11d48;
      border-color: #fb7185;
      color: #ffffff;
    }

    .action-feedback {
      font-size: 11px;
      color: #38bdf8;
      font-style: italic;
    }

    .hint-box {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.4;
      padding-top: 4px;
      border-top: 1px solid rgba(51, 65, 85, 0.5);
    }
  `]
})
export class ToolbarComponent {
  simulation = inject(SimulationService);
  actionPending = signal(false);
  actionStatus = signal('');

  selectPreset(mode: SimulationTrafficMode) {
    this.simulation.setMode(mode);
  }

  async onSetupQueues() {
    this.actionPending.set(true);
    this.actionStatus.set('Declaring demo queues in RabbitMQ...');
    const ok = await this.simulation.setupDemoQueues();
    this.actionStatus.set(ok ? 'Queues created in RabbitMQ!' : 'Failed. Ensure backend is running.');
    this.actionPending.set(false);
    setTimeout(() => this.actionStatus.set(''), 3000);
  }

  async onPublishMessage() {
    this.actionPending.set(true);
    this.actionStatus.set('Publishing message to orders.checkout...');
    const ok = await this.simulation.injectTestMessage();
    this.actionStatus.set(ok ? 'Message published successfully!' : 'Failed. Ensure backend is running.');
    this.actionPending.set(false);
    setTimeout(() => this.actionStatus.set(''), 3000);
  }
}
