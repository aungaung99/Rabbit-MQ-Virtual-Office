import { Component, inject } from '@angular/core';
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
        <span class="section-title">Traffic Scenario</span>
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
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(10px);
      padding: 16px;
      border-radius: 10px;
      border: 1px solid rgba(51, 65, 85, 0.7);
      color: #f1f5f9;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      z-index: 100;
      width: 290px;
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

    button:hover {
      background: rgba(51, 65, 85, 0.9);
      color: #ffffff;
      border-color: #64748b;
    }

    button.active {
      background: #0284c7;
      border-color: #38bdf8;
      color: #ffffff;
      font-weight: 600;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
    }

    button.paused {
      background: #e11d48;
      border-color: #fb7185;
      color: #ffffff;
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

  selectPreset(mode: SimulationTrafficMode) {
    this.simulation.setMode(mode);
  }
}
