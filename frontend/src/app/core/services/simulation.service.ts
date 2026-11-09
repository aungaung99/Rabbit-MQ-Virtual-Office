import { Injectable, signal, computed } from '@angular/core';
import { BrokerSnapshot, SimulationTrafficMode, InspectedEntity } from '../models/broker.model';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  readonly mode = signal<SimulationTrafficMode>('DemoNormal');
  readonly snapshot = signal<BrokerSnapshot>(this.createSnapshot('DemoNormal'));
  readonly simulationSpeed = signal<number>(1.0);
  readonly isPaused = signal<boolean>(false);
  readonly inspectedEntity = signal<InspectedEntity | null>(null);
  readonly isLiveConnected = signal<boolean>(false);

  // Computed convenience signals
  readonly totalBacklog = computed(() => this.snapshot().totalBacklog);
  readonly publishRate = computed(() => this.snapshot().totalPublishRate);
  readonly ackRate = computed(() => this.snapshot().totalAckRate);

  private timer: any = null;
  private tickCount = 0;

  constructor() {
    this.startSimulationLoop();
  }

  setMode(newMode: SimulationTrafficMode) {
    this.mode.set(newMode);
    if (newMode !== 'LiveMetrics') {
      this.snapshot.set(this.createSnapshot(newMode));
    }
  }

  applyLiveSnapshot(liveSnapshot: BrokerSnapshot) {
    this.isLiveConnected.set(true);
    if (this.mode() === 'LiveMetrics') {
      this.snapshot.set(liveSnapshot);
    }
  }

  setSpeed(speed: number) {
    this.simulationSpeed.set(speed);
  }

  togglePause() {
    this.isPaused.update(p => !p);
  }

  setInspectedEntity(entity: InspectedEntity | null) {
    this.inspectedEntity.set(entity);
  }

  async injectTestMessage(): Promise<boolean> {
    try {
      const res = await fetch('http://localhost:5000/api/rabbitmq/publish-test', {
        method: 'POST'
      });
      return res.ok;
    } catch (e) {
      console.warn('Backend not reachable for publish-test:', e);
      return false;
    }
  }

  async setupDemoQueues(): Promise<boolean> {
    try {
      const res = await fetch('http://localhost:5000/api/rabbitmq/setup-demo-queues', {
        method: 'POST'
      });
      return res.ok;
    } catch (e) {
      console.warn('Backend not reachable for setup-demo-queues:', e);
      return false;
    }
  }

  private startSimulationLoop() {
    this.timer = setInterval(() => {
      if (this.isPaused() || this.mode() === 'LiveMetrics') return;
      this.tickCount++;
      const current = this.snapshot();
      const currentMode = this.mode();
      
      const jitter = Math.sin(this.tickCount * 0.5) * (currentMode === 'DemoSpike' ? 8 : 1.2);
      const pubRate = Math.max(1, Math.round((current.totalPublishRate + jitter) * 10) / 10);
      
      let backlogDelta = 0;
      if (currentMode === 'DemoSpike') {
        backlogDelta = Math.sin(this.tickCount * 0.2) > 0 ? 3 : -1;
      } else if (currentMode === 'DemoErrorSpike') {
        backlogDelta = 1;
      }

      const updatedBacklog = Math.max(0, current.totalBacklog + backlogDelta);

      this.snapshot.set({
        ...current,
        timestamp: new Date().toISOString(),
        totalPublishRate: pubRate,
        totalBacklog: updatedBacklog
      });
    }, 1000);
  }

  createSnapshot(mode: SimulationTrafficMode): BrokerSnapshot {
    let pubRate = 14.5;
    let delivRate = 14.2;
    let ackRate = 14.0;
    let backlog = 8;
    let consumersCount = 3;

    if (mode === 'DemoQuiet') {
      pubRate = 2.5;
      delivRate = 2.5;
      ackRate = 2.5;
      backlog = 1;
      consumersCount = 1;
    } else if (mode === 'DemoSpike') {
      pubRate = 88.0;
      delivRate = 38.0;
      ackRate = 36.5;
      backlog = 152;
      consumersCount = 3;
    } else if (mode === 'DemoErrorSpike') {
      pubRate = 32.0;
      delivRate = 28.0;
      ackRate = 4.5;
      backlog = 65;
      consumersCount = 2;
    }

    return {
      timestamp: new Date().toISOString(),
      mode,
      isConnectedToBroker: false,
      brokerVersion: 'RabbitMQ 3.13.7 (Virtual Demo)',
      totalPublishRate: pubRate,
      totalDeliverRate: delivRate,
      totalAckRate: ackRate,
      totalBacklog: backlog,
      queues: [
        {
          name: 'orders.checkout',
          vhost: '/',
          messagesReady: backlog,
          messagesUnacknowledged: consumersCount * 2,
          messagesTotal: backlog + consumersCount * 2,
          publishRate: Math.round(pubRate * 0.7 * 10) / 10,
          deliverRate: Math.round(delivRate * 0.7 * 10) / 10,
          ackRate: Math.round(ackRate * 0.7 * 10) / 10,
          consumersCount,
          state: 'running',
          hasDeadLetterQueue: true
        },
        {
          name: 'notifications.push',
          vhost: '/',
          messagesReady: Math.max(0, Math.floor(backlog / 4)),
          messagesUnacknowledged: 1,
          messagesTotal: Math.max(1, Math.floor(backlog / 4) + 1),
          publishRate: Math.round(pubRate * 0.3 * 10) / 10,
          deliverRate: Math.round(delivRate * 0.3 * 10) / 10,
          ackRate: Math.round(ackRate * 0.3 * 10) / 10,
          consumersCount: 1,
          state: 'running'
        },
        {
          name: 'orders.dlq',
          vhost: '/',
          messagesReady: mode === 'DemoErrorSpike' ? 34 : 2,
          messagesUnacknowledged: 0,
          messagesTotal: mode === 'DemoErrorSpike' ? 34 : 2,
          publishRate: mode === 'DemoErrorSpike' ? 18.5 : 0.2,
          deliverRate: 0,
          ackRate: 0,
          consumersCount: 0,
          state: mode === 'DemoErrorSpike' ? 'alert' : 'idle'
        }
      ],
      exchanges: [
        {
          name: 'amq.topic',
          type: 'topic',
          publishInRate: pubRate,
          publishOutRate: pubRate
        },
        {
          name: 'orders.direct',
          type: 'direct',
          publishInRate: Math.round(pubRate * 0.7 * 10) / 10,
          publishOutRate: Math.round(pubRate * 0.7 * 10) / 10
        }
      ],
      consumers: [
        {
          consumerTag: 'consumer-worker-1',
          queueName: 'orders.checkout',
          channelName: '127.0.0.1:54321',
          prefetchCount: 10,
          isActive: true
        },
        {
          consumerTag: 'consumer-worker-2',
          queueName: 'orders.checkout',
          channelName: '127.0.0.1:54322',
          prefetchCount: 10,
          isActive: mode !== 'DemoQuiet'
        },
        {
          consumerTag: 'consumer-worker-3',
          queueName: 'orders.checkout',
          channelName: '127.0.0.1:54323',
          prefetchCount: 10,
          isActive: mode === 'DemoNormal' || mode === 'DemoSpike'
        }
      ]
    };
  }
}
