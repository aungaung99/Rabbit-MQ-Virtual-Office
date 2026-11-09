import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../../core/services/simulation.service';

@Component({
  selector: 'app-inspector-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (simulation.inspectedEntity(); as entity) {
      <aside class="inspector-card">
        <header class="inspector-header">
          <div class="header-title">
            <span class="icon">{{ getEntityIcon(entity.type) }}</span>
            <h3>{{ entity.title }}</h3>
          </div>
          <button class="close-btn" (click)="close()" title="Close details">✕</button>
        </header>

        <div class="inspector-body">
          <table class="properties-table">
            <tbody>
              @for (entry of getEntries(entity.data); track entry[0]) {
                <tr>
                  <td class="prop-key">{{ entry[0] }}</td>
                  <td class="prop-val">{{ entry[1] }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <footer class="inspector-footer">
          <span class="broker-source">Source: {{ simulation.snapshot().brokerVersion }}</span>
        </footer>
      </aside>
    }
  `,
  styles: [`
    .inspector-card {
      position: absolute;
      top: 76px;
      left: 16px;
      width: 310px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border-radius: 10px;
      border: 1px solid rgba(51, 65, 85, 0.8);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
      color: #f1f5f9;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      z-index: 100;
      animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .inspector-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(51, 65, 85, 0.6);
      background: rgba(30, 41, 59, 0.4);
      border-radius: 10px 10px 0 0;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-title h3 {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: #f8fafc;
    }

    .close-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 14px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      line-height: 1;
    }

    .close-btn:hover {
      color: #ffffff;
      background: rgba(51, 65, 85, 0.5);
    }

    .inspector-body {
      padding: 12px 16px;
      max-height: 380px;
      overflow-y: auto;
    }

    .properties-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .properties-table tr {
      border-bottom: 1px solid rgba(51, 65, 85, 0.3);
    }

    .properties-table tr:last-child {
      border-bottom: none;
    }

    .prop-key {
      padding: 7px 0;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 500;
      width: 45%;
    }

    .prop-val {
      padding: 7px 0;
      color: #38bdf8;
      font-family: monospace;
      font-weight: 600;
      text-align: right;
    }

    .inspector-footer {
      padding: 8px 16px;
      border-top: 1px solid rgba(51, 65, 85, 0.5);
      font-size: 10px;
      color: #64748b;
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class InspectorModalComponent {
  simulation = inject(SimulationService);

  close() {
    this.simulation.setInspectedEntity(null);
  }

  getEntityIcon(type: string): string {
    switch (type) {
      case 'publisher': return '📤';
      case 'exchange': return '⚙️';
      case 'queue': return '🗄️';
      case 'consumer': return '🧑‍💻';
      case 'dlq': return '🚨';
      default: return '🔍';
    }
  }

  getEntries(data: Record<string, any>): [string, any][] {
    return Object.entries(data);
  }
}
