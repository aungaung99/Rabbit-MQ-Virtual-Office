export type SimulationTrafficMode =
  | 'DemoQuiet'
  | 'DemoNormal'
  | 'DemoSpike'
  | 'DemoErrorSpike'
  | 'LiveMetrics';

export interface QueueMetric {
  name: string;
  vhost: string;
  messagesReady: number;
  messagesUnacknowledged: number;
  messagesTotal: number;
  publishRate: number;
  deliverRate: number;
  ackRate: number;
  consumersCount: number;
  state: string;
  hasDeadLetterQueue?: boolean;
}

export interface ExchangeMetric {
  name: string;
  type: string;
  publishInRate: number;
  publishOutRate: number;
}

export interface ConsumerMetric {
  consumerTag: string;
  queueName: string;
  channelName: string;
  prefetchCount: number;
  isActive: boolean;
}

export interface BrokerSnapshot {
  timestamp: string;
  mode: SimulationTrafficMode;
  isConnectedToBroker: boolean;
  brokerVersion: string;
  queues: QueueMetric[];
  exchanges: ExchangeMetric[];
  consumers: ConsumerMetric[];
  totalPublishRate: number;
  totalDeliverRate: number;
  totalAckRate: number;
  totalBacklog: number;
}

export interface InspectedEntity {
  type: 'publisher' | 'exchange' | 'queue' | 'consumer' | 'dlq';
  title: string;
  data: Record<string, string | number | boolean>;
}
