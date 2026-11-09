import { Injectable, signal, computed } from '@angular/core';
import {
  BrokerSnapshot,
  SimulationTrafficMode,
  InspectedEntity,
  LiveEventItem
} from '../models/broker.model';

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
  readonly activeTab = signal<'live' | 'flow' | 'diagram' | 'metrics'>('live');

  // Cumulative counters & chart histories matching the playground UI
  readonly publishedTotal = signal<number>(1248);
  readonly consumedTotal = signal<number>(1232);
  readonly backlogHistory = signal<number[]>([
    16, 19, 25, 22, 34, 30, 38, 45, 36, 48, 32, 18, 22, 16, 14, 16
  ]);
  readonly rateHistory = signal<number[]>([
    18, 22, 26, 20, 30, 28, 32, 29, 34, 26, 30, 32, 28, 35, 31, 32, 29, 33
  ]);
  readonly liveEvents = signal<LiveEventItem[]>([
    {
      id: 1,
      time: this.formatTime(new Date()),
      type: 'publish',
      message: "Published to exchange 'orders'",
      orderId: '#10045'
    },
    {
      id: 2,
      time: this.formatTime(new Date()),
      type: 'route',
      message: "Routed to queue 'orders.queue'"
    },
    {
      id: 3,
      time: this.formatTime(new Date()),
      type: 'consume',
      message: 'Consumed by Consumer #2',
      orderId: '#10045'
    }
  ]);

  // Computed convenience signals
  readonly totalBacklog = computed(() => this.snapshot().totalBacklog);
  readonly publishRate = computed(() => this.snapshot().totalPublishRate);
  readonly ackRate = computed(() => this.snapshot().totalAckRate);
  readonly activeConsumersCount = computed(() =>
    this.snapshot().consumers.filter(c => c.isActive).length
  );

  private timer: any = null;
  private tickCount = 0;
  private nextEventId = 4;
  private nextOrderNum = 10046;

  constructor() {
    this.startSimulationLoop();
  }

  setMode(newMode: SimulationTrafficMode) {
    this.mode.set(newMode);
    if (newMode !== 'LiveMetrics') {
      this.snapshot.set(this.createSnapshot(newMode));
    }
  }

  setTab(tab: 'live' | 'flow' | 'diagram' | 'metrics') {
    this.activeTab.set(tab);
  }

  applyLiveSnapshot(liveSnapshot: BrokerSnapshot) {
    this.isLiveConnected.set(true);
    if (this.mode() === 'LiveMetrics') {
      this.snapshot.set(liveSnapshot);
      this.pushChartPoint(liveSnapshot.totalBacklog, Math.max(2, liveSnapshot.totalPublishRate));
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

  recordParcelEvent(type: 'publish' | 'route' | 'consume' | 'nack', consumerIdx?: number) {
    const orderTag = `#${this.nextOrderNum}`;
    if (type === 'publish') {
      this.nextOrderNum++;
      this.publishedTotal.update(v => v + 1);
      this.prependEvent({
        id: this.nextEventId++,
        time: this.formatTime(new Date()),
        type: 'publish',
        message: "Published to exchange 'orders'",
        orderId: orderTag
      });
    } else if (type === 'route') {
      this.prependEvent({
        id: this.nextEventId++,
        time: this.formatTime(new Date()),
        type: 'route',
        message: "Routed to queue 'orders.queue'"
      });
    } else if (type === 'consume') {
      this.consumedTotal.update(v => v + 1);
      this.prependEvent({
        id: this.nextEventId++,
        time: this.formatTime(new Date()),
        type: 'consume',
        message: `Consumed by Consumer #${consumerIdx ?? 1}`,
        orderId: orderTag
      });
    } else if (type === 'nack') {
      this.prependEvent({
        id: this.nextEventId++,
        time: this.formatTime(new Date()),
        type: 'nack',
        message: `NACK by Consumer #${consumerIdx ?? 1} → orders.dlq`,
        orderId: orderTag
      });
    }
  }

  private prependEvent(item: LiveEventItem) {
    this.liveEvents.update(list => [item, ...list.slice(0, 5)]);
  }

  private formatTime(date: Date): string {
    return date.toTimeString().split(' ')[0];
  }

  async injectTestMessage(): Promise<boolean> {
    try {
      this.recordParcelEvent('publish');
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

  private pushChartPoint(backlogVal: number, rateVal: number) {
    this.backlogHistory.update(arr => [...arr.slice(1), backlogVal]);
    this.rateHistory.update(arr => [...arr.slice(1), Math.round(rateVal)]);
  }

  private startSimulationLoop() {
    this.timer = setInterval(() => {
      if (this.isPaused() || this.mode() === 'LiveMetrics') return;
      this.tickCount++;
      const current = this.snapshot();
      const currentMode = this.mode();

      const jitter = Math.sin(this.tickCount * 0.6) * (currentMode === 'DemoSpike' ? 6 : 2);
      const baseRate =
        currentMode === 'DemoQuiet' ? 4 :
        currentMode === 'DemoSpike' ? 84 :
        currentMode === 'DemoErrorSpike' ? 32 : 32;
      const pubRate = Math.max(1, Math.round((baseRate + jitter) * 10) / 10);
      const ackRate = currentMode === 'DemoErrorSpike'
        ? 6
        : Math.max(1, Math.round((pubRate - (currentMode === 'DemoSpike' ? 18 : 1.5)) * 10) / 10);

      let backlogDelta = 0;
      if (currentMode === 'DemoSpike') {
        backlogDelta = Math.sin(this.tickCount * 0.25) > -0.2 ? 4 : -2;
      } else if (currentMode === 'DemoErrorSpike') {
        backlogDelta = 2;
      } else if (currentMode === 'DemoQuiet') {
        backlogDelta = current.totalBacklog > 2 ? -1 : 0;
      } else {
        backlogDelta = Math.round(Math.sin(this.tickCount * 0.5) * 2);
      }

      const updatedBacklog = Math.max(1, Math.min(95, current.totalBacklog + backlogDelta));

      this.snapshot.set({
        ...current,
        timestamp: new Date().toISOString(),
        totalPublishRate: pubRate,
        totalDeliverRate: ackRate,
        totalAckRate: ackRate,
        totalBacklog: updatedBacklog
      });

      this.pushChartPoint(updatedBacklog, pubRate);
    }, 1000);
  }

  createSnapshot(mode: SimulationTrafficMode): BrokerSnapshot {
    let pubRate = 32;
    let delivRate = 30;
    let ackRate = 30;
    let backlog = 16;
    let consumersCount = 3;

    if (mode === 'DemoQuiet') {
      pubRate = 4;
      delivRate = 4;
      ackRate = 4;
      backlog = 2;
      consumersCount = 1;
    } else if (mode === 'DemoSpike') {
      pubRate = 85;
      delivRate = 42;
      ackRate = 40;
      backlog = 54;
      consumersCount = 3;
    } else if (mode === 'DemoErrorSpike') {
      pubRate = 32;
      delivRate = 28;
      ackRate = 6;
      backlog = 38;
      consumersCount = 2;
    }

    return {
      timestamp: new Date().toISOString(),
      mode,
      isConnectedToBroker: false,
      brokerVersion: 'RabbitMQ 3.13.7 (Playground)',
      totalPublishRate: pubRate,
      totalDeliverRate: delivRate,
      totalAckRate: ackRate,
      totalBacklog: backlog,
      queues: [
        {
          name: 'orders.queue',
          vhost: '/',
          messagesReady: backlog,
          messagesUnacknowledged: consumersCount * 2,
          messagesTotal: backlog + consumersCount * 2,
          publishRate: pubRate,
          deliverRate: delivRate,
          ackRate: ackRate,
          consumersCount,
          state: 'running',
          hasDeadLetterQueue: true
        },
        {
          name: 'orders.dlq',
          vhost: '/',
          messagesReady: mode === 'DemoErrorSpike' ? 28 : 0,
          messagesUnacknowledged: 0,
          messagesTotal: mode === 'DemoErrorSpike' ? 28 : 0,
          publishRate: mode === 'DemoErrorSpike' ? 18.5 : 0,
          deliverRate: 0,
          ackRate: 0,
          consumersCount: 0,
          state: mode === 'DemoErrorSpike' ? 'alert' : 'idle'
        }
      ],
      exchanges: [
        {
          name: 'orders',
          type: 'direct / topic / fanout',
          publishInRate: pubRate,
          publishOutRate: pubRate
        }
      ],
      consumers: [
        {
          consumerTag: 'Consumer #1',
          queueName: 'orders.queue',
          channelName: '127.0.0.1:54321',
          prefetchCount: 10,
          isActive: true
        },
        {
          consumerTag: 'Consumer #2',
          queueName: 'orders.queue',
          channelName: '127.0.0.1:54322',
          prefetchCount: 10,
          isActive: mode !== 'DemoQuiet'
        },
        {
          consumerTag: 'Consumer #3',
          queueName: 'orders.queue',
          channelName: '127.0.0.1:54323',
          prefetchCount: 10,
          isActive: mode === 'DemoNormal' || mode === 'DemoSpike'
        }
      ]
    };
  }
}
