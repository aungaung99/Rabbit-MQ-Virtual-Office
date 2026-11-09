import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../../core/services/simulation.service';
import { SimulationTrafficMode } from '../../core/models/broker.model';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Top Floating Bar -->
    <header class="playground-topbar">
      <!-- Left Brand Box -->
      <div class="brand-card">
        <div class="rmq-logo">
          <svg viewBox="0 0 36 38" width="28" height="30">
            <path d="M2,2 H14 V16 H20 V2 H32 V36 H2 Z" fill="#f97316"/>
            <rect x="19" y="22" width="7" height="7" rx="1.5" fill="#1e293b"/>
          </svg>
        </div>
        <div class="brand-titles">
          <div class="title-row">
            <h1>RabbitMQ</h1>
            <span class="bunny-mini">🐰</span>
          </div>
          <span class="subtitle">Message Queue Playground</span>
        </div>
      </div>

      <!-- Center Mode & Scenario Switcher Pill -->
      <nav class="center-nav-pill">
        <button
          class="nav-pill-btn live-dot-btn"
          [class.active]="simulation.mode() === 'DemoNormal'"
          (click)="setMode('DemoNormal')">
          <span class="green-dot"></span> Live Flow
        </button>
        <button
          class="nav-pill-btn"
          [class.active]="simulation.mode() === 'DemoQuiet'"
          (click)="setMode('DemoQuiet')">
          🌱 Quiet
        </button>
        <button
          class="nav-pill-btn"
          [class.active]="simulation.mode() === 'DemoSpike'"
          (click)="setMode('DemoSpike')">
          🔥 Spike
        </button>
        <button
          class="nav-pill-btn"
          [class.active]="simulation.mode() === 'DemoErrorSpike'"
          (click)="setMode('DemoErrorSpike')">
          🚨 DLQ Error
        </button>
        <button
          class="nav-pill-btn broker-btn"
          [class.active]="simulation.mode() === 'LiveMetrics'"
          (click)="setMode('LiveMetrics')">
          📡 Real Broker
        </button>
        <button class="nav-pill-btn send-btn" (click)="sendTestMsg()">
          ✉️ +Publish
        </button>
      </nav>

      <!-- Right Speed & Playback Controls -->
      <div class="right-controls">
        <div class="speed-group">
          <button
            class="speed-btn"
            [class.active]="simulation.simulationSpeed() === 0.5"
            (click)="simulation.setSpeed(0.5)">
            0.5x
          </button>
          <button
            class="speed-btn"
            [class.active]="simulation.simulationSpeed() === 1.0"
            (click)="simulation.setSpeed(1.0)">
            Speed 1x
          </button>
          <button
            class="speed-btn"
            [class.active]="simulation.simulationSpeed() === 2.0"
            (click)="simulation.setSpeed(2.0)">
            2x
          </button>
        </div>

        <button
          class="icon-circle-btn"
          [class.paused]="simulation.isPaused()"
          (click)="simulation.togglePause()"
          title="Pause / Resume">
          {{ simulation.isPaused() ? '▶' : '⏸' }}
        </button>

        <button
          class="icon-circle-btn"
          (click)="resetCamera.emit()"
          title="Fit & Center Camera">
          ⛶
        </button>
      </div>
    </header>

    <!-- Top-Center Neon "Message Flow" Pipeline Diagram Card -->
    <div class="message-flow-banner">
      <div class="flow-title">Message Flow</div>
      <div class="flow-steps">
        <div class="flow-step">
          <div class="step-icon orange-box">📦</div>
          <span>Publisher</span>
        </div>
        <div class="flow-arrow">➔</div>
        <div class="flow-step">
          <div class="step-icon blue-circle">🔀</div>
          <span>Exchange</span>
        </div>
        <div class="flow-arrow">➔</div>
        <div class="flow-step">
          <div class="step-icon stack-box">📚</div>
          <span>Queue(s)</span>
        </div>
        <div class="flow-arrow">➔</div>
        <div class="flow-step">
          <div class="step-icon users-box">👥</div>
          <span>Consumer(s)</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .playground-topbar {
      position: absolute;
      top: 12px;
      left: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 90;
      pointer-events: none;
      user-select: none;
    }

    .brand-card, .center-nav-pill, .right-controls {
      pointer-events: auto;
    }

    .brand-card {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(10px);
      padding: 8px 16px;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .brand-titles h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 11px;
      color: #cbd5e1;
      display: block;
    }

    .center-nav-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(10px);
      padding: 5px 8px;
      border-radius: 9999px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
    }

    .nav-pill-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: 1px solid transparent;
      color: #cbd5e1;
      padding: 6px 13px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .nav-pill-btn:hover {
      color: #ffffff;
      background: rgba(51, 65, 85, 0.6);
    }

    .nav-pill-btn.active {
      background: rgba(16, 185, 129, 0.2);
      border-color: rgba(16, 185, 129, 0.6);
      color: #4ade80;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
    }

    .nav-pill-btn.send-btn {
      background: rgba(249, 115, 22, 0.2);
      border-color: rgba(249, 115, 22, 0.5);
      color: #fb923c;
    }

    .nav-pill-btn.send-btn:hover {
      background: #ea580c;
      color: #ffffff;
    }

    .green-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e;
    }

    .right-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .speed-group {
      display: flex;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(10px);
      padding: 4px;
      border-radius: 9999px;
      border: 1px solid rgba(148, 163, 184, 0.25);
    }

    .speed-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 5px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .speed-btn.active {
      background: #334155;
      color: #f8fafc;
    }

    .icon-circle-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid rgba(148, 163, 184, 0.3);
      color: #f8fafc;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-circle-btn.paused {
      background: #e11d48;
      border-color: #fb7185;
    }

    /* Top-Center Message Flow Neon Card */
    .message-flow-banner {
      position: absolute;
      top: 68px;
      left: 44%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(12px);
      border: 2px solid #3b82f6;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.45), inset 0 0 12px rgba(59, 130, 246, 0.2);
      border-radius: 14px;
      padding: 10px 26px 14px;
      z-index: 80;
      pointer-events: none;
      user-select: none;
      text-align: center;
    }

    .flow-title {
      font-size: 14px;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 10px;
      letter-spacing: 0.02em;
    }

    .flow-steps {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .flow-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      color: #e2e8f0;
    }

    .step-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(96, 165, 250, 0.4);
    }

    .flow-arrow {
      color: #60a5fa;
      font-size: 16px;
      margin-top: -14px;
    }
  `]
})
export class HudComponent {
  simulation = inject(SimulationService);
  @Output() resetCamera = new EventEmitter<void>();

  setMode(mode: SimulationTrafficMode) {
    this.simulation.setMode(mode);
  }

  async sendTestMsg() {
    await this.simulation.injectTestMessage();
  }
}
