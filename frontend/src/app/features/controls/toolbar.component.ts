import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../../core/services/simulation.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Right Floating Telemetry Sidebar (3 Stacked Panels matching screenshot) -->
    <aside class="right-telemetry-sidebar">
      <!-- 1. Live Metrics Card -->
      <section class="glass-panel">
        <div class="panel-header">
          <span class="green-dot"></span>
          <h2>Live Metrics</h2>
        </div>

        <div class="metrics-list">
          <div class="metric-row">
            <span class="metric-label"><span class="icon-blue">✈️</span> Published</span>
            <span class="metric-value white">{{ simulation.publishedTotal() | number }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label"><span class="icon-green">✅</span> Consumed</span>
            <span class="metric-value white">{{ simulation.consumedTotal() | number }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label"><span class="icon-orange">📚</span> In Queue <small>(backlog)</small></span>
            <span class="metric-value orange">{{ simulation.totalBacklog() }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label"><span class="icon-blue">👥</span> Consumers</span>
            <span class="metric-value green">{{ simulation.activeConsumersCount() }} (Active)</span>
          </div>
        </div>
      </section>

      <!-- 2. Queue Backlog (Live) Area Chart Card -->
      <section class="glass-panel">
        <div class="panel-header">
          <span class="chart-icon">🕒</span>
          <h2>Queue Backlog (Live)</h2>
        </div>

        <div class="chart-container">
          <svg viewBox="0 0 230 95" class="backlog-svg">
            <defs>
              <linearGradient id="backlogAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.45"/>
                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <!-- Y-Axis Labels & Gridlines -->
            <text x="4" y="18" fill="#94a3b8" font-size="9">60</text>
            <line x1="22" y1="15" x2="224" y2="15" stroke="#334155" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="4" y="42" fill="#94a3b8" font-size="9">40</text>
            <line x1="22" y1="39" x2="224" y2="39" stroke="#334155" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="4" y="66" fill="#94a3b8" font-size="9">20</text>
            <line x1="22" y1="63" x2="224" y2="63" stroke="#334155" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="8" y="88" fill="#94a3b8" font-size="9">0</text>
            <line x1="22" y1="85" x2="224" y2="85" stroke="#475569" stroke-width="1.5"/>

            <!-- Area Fill -->
            <polygon [attr.points]="backlogAreaPoints()" fill="url(#backlogAreaGrad)"/>
            <!-- Line Stroke -->
            <polyline [attr.points]="backlogLinePoints()" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <!-- Data Vertex Dots -->
            @for (pt of backlogVertices(); track $index) {
              <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="2.5" fill="#fde047"/>
            }
          </svg>
        </div>
      </section>

      <!-- 3. Message Rate (msg/s) Bar Chart Card -->
      <section class="glass-panel">
        <div class="panel-header">
          <span class="chart-icon">📊</span>
          <h2>Message Rate (msg/s)</h2>
        </div>

        <div class="chart-container">
          <svg viewBox="0 0 230 62" class="rate-svg">
            <line x1="6" y1="56" x2="224" y2="56" stroke="#475569" stroke-width="1.5"/>
            @for (val of simulation.rateHistory(); track $index) {
              <rect
                [attr.x]="10 + $index * 12"
                [attr.y]="56 - getBarHeight(val)"
                width="8"
                [attr.height]="getBarHeight(val)"
                rx="1.5"
                fill="#10b981"/>
            }
          </svg>
        </div>

        <div class="rate-footer">
          <div class="rate-stat">
            <span class="rate-icon">✈️</span>
            <div>
              <div class="rate-title">Publish</div>
              <div class="rate-num">{{ simulation.publishRate() }} msg/s</div>
            </div>
          </div>
          <div class="rate-stat">
            <span class="rate-icon">✅</span>
            <div>
              <div class="rate-title">Consume</div>
              <div class="rate-num green">{{ simulation.ackRate() }} msg/s</div>
            </div>
          </div>
        </div>
      </section>
    </aside>

    <!-- Bottom-Left Live Events Feed Card -->
    <section class="live-events-card">
      <div class="panel-header">
        <span class="green-dot"></span>
        <h2>Live Events</h2>
      </div>
      <div class="events-list">
        @for (ev of simulation.liveEvents(); track ev.id) {
          <div class="event-row">
            <span class="ev-time">{{ ev.time }}</span>
            <span class="ev-icon">{{ getEventIcon(ev.type) }}</span>
            <span class="ev-msg">{{ ev.message }}</span>
            @if (ev.orderId) {
              <span class="ev-order">(order: {{ ev.orderId }})</span>
            }
          </div>
        }
      </div>
    </section>

    <!-- Bottom-Center Mascot Status Banner -->
    <div class="mascot-status-banner" [class.error-banner]="simulation.mode() === 'DemoErrorSpike'">
      <div class="status-check-circle">
        {{ simulation.mode() === 'DemoErrorSpike' ? '⚠️' : '✓' }}
      </div>
      <div class="status-texts">
        <div class="status-headline">
          {{ simulation.mode() === 'DemoErrorSpike' ? 'High NACK rate detected!' : 'Messages are flowing!' }}
        </div>
        <div class="status-subline">
          Publish → Exchange → Queue → Consumer
        </div>
      </div>
    </div>
  `,
  styles: [`
    .right-telemetry-sidebar {
      position: absolute;
      top: 66px;
      right: 16px;
      width: 265px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 85;
      user-select: none;
    }

    .glass-panel {
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
      color: #f8fafc;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(51, 65, 85, 0.6);
    }

    .panel-header h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #f8fafc;
    }

    .green-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e;
    }

    .metrics-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .metric-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
    }

    .metric-label {
      color: #cbd5e1;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .metric-label small {
      color: #94a3b8;
      font-size: 11px;
    }

    .metric-value {
      font-weight: 800;
      font-size: 15px;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .metric-value.white { color: #f8fafc; }
    .metric-value.orange { color: #fb923c; }
    .metric-value.green { color: #4ade80; font-size: 13px; }

    .chart-container {
      width: 100%;
    }

    .backlog-svg, .rate-svg {
      width: 100%;
      height: auto;
      display: block;
    }

    .rate-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(51, 65, 85, 0.5);
    }

    .rate-stat {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .rate-title {
      font-size: 11px;
      color: #94a3b8;
    }

    .rate-num {
      font-size: 13px;
      font-weight: 700;
      color: #f8fafc;
    }

    .rate-num.green {
      color: #4ade80;
    }

    /* Bottom-Left Live Events Card */
    .live-events-card {
      position: absolute;
      bottom: 16px;
      left: 16px;
      width: 440px;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(148, 163, 184, 0.28);
      border-radius: 14px;
      padding: 12px 16px;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
      z-index: 85;
      user-select: none;
    }

    .events-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 92px;
      overflow: hidden;
    }

    .event-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #e2e8f0;
      white-space: nowrap;
    }

    .ev-time {
      color: #94a3b8;
      font-family: monospace;
      font-size: 11px;
    }

    .ev-msg {
      font-weight: 500;
    }

    .ev-order {
      color: #94a3b8;
      font-size: 11px;
      margin-left: auto;
    }

    /* Bottom-Center Mascot Status Banner */
    .mascot-status-banner {
      position: absolute;
      bottom: 155px;
      left: 44%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(10px);
      border: 1.5px solid rgba(148, 163, 184, 0.4);
      border-radius: 14px;
      padding: 10px 18px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      z-index: 80;
      pointer-events: none;
      user-select: none;
    }

    .mascot-status-banner.error-banner {
      border-color: #ef4444;
    }

    .status-check-circle {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #22c55e;
      color: #ffffff;
      font-weight: 800;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
    }

    .status-headline {
      font-size: 13px;
      font-weight: 700;
      color: #f8fafc;
    }

    .status-subline {
      font-size: 11px;
      color: #cbd5e1;
    }
  `]
})
export class ToolbarComponent {
  simulation = inject(SimulationService);

  readonly backlogVertices = computed(() => {
    const pts = this.simulation.backlogHistory();
    const stepX = 200 / Math.max(1, pts.length - 1);
    return pts.map((val, idx) => {
      const x = Math.round(24 + idx * stepX);
      const clamped = Math.min(65, Math.max(0, val));
      const y = Math.round(85 - (clamped / 65) * 70);
      return { x, y };
    });
  });

  readonly backlogLinePoints = computed(() =>
    this.backlogVertices().map(p => `${p.x},${p.y}`).join(' ')
  );

  readonly backlogAreaPoints = computed(() => {
    const verts = this.backlogVertices();
    if (verts.length === 0) return '';
    const firstX = verts[0].x;
    const lastX = verts[verts.length - 1].x;
    const lineStr = verts.map(p => `${p.x},${p.y}`).join(' ');
    return `${firstX},85 ${lineStr} ${lastX},85`;
  });

  getBarHeight(val: number): number {
    const clamped = Math.min(90, Math.max(4, val));
    return Math.round((clamped / 90) * 46);
  }

  getEventIcon(type: string): string {
    switch (type) {
      case 'publish': return '✈️';
      case 'route': return '📚';
      case 'consume': return '✅';
      case 'nack': return '🚨';
      default: return '•';
    }
  }
}
