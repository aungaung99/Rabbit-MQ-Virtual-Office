import * as Phaser from 'phaser';
import { BrokerSnapshot, InspectedEntity } from '../../core/models/broker.model';
import { TrafficScaler } from '../systems/traffic-scaler';
import { SpriteFactory } from '../systems/sprite-factory';

interface ConsumerStation {
  id: number;
  x: number;
  y: number;
  beltEndX: number;
  beltEndY: number;
  active: boolean;
  sprite?: Phaser.GameObjects.Image;
  statusBg?: Phaser.GameObjects.Graphics;
  statusDot?: Phaser.GameObjects.Arc;
  statusSubText?: Phaser.GameObjects.Text;
  heartBubble?: Phaser.GameObjects.Image;
}

export class OfficeScene extends Phaser.Scene {
  private snapshot!: BrokerSnapshot;
  private onEntitySelectCallback!: (entity: InspectedEntity | null) => void;
  private onParcelEventCallback?: (type: 'publish' | 'route' | 'consume' | 'nack', consumerIdx?: number) => void;
  private speedMultiplier = 1.0;
  private isPaused = false;
  private sceneReady = false;

  // Key positions in 1280x760 world space
  private publisherPos = { x: 120, y: 495 };
  private exchangePos = { x: 375, y: 445 };
  private queuePos = { x: 585, y: 435 };
  private dlqPos = { x: 585, y: 615 };
  private robotPos = { x: 365, y: 580 };
  private catPos = { x: 945, y: 645 };

  private consumers: ConsumerStation[] = [
    { id: 1, x: 840, y: 345, beltEndX: 775, beltEndY: 365, active: true },
    { id: 2, x: 855, y: 465, beltEndX: 790, beltEndY: 485, active: true },
    { id: 3, x: 840, y: 585, beltEndX: 775, beltEndY: 600, active: true }
  ];

  // Dynamic visual references
  private publisherSprite!: Phaser.GameObjects.Image;
  private exchangeSprite!: Phaser.GameObjects.Image;
  private dlqSprite!: Phaser.GameObjects.Image;
  private shelfEnvelopes: Phaser.GameObjects.Image[] = [];
  private chevronSprites: { sprite: Phaser.GameObjects.Text; baseX: number; baseY: number; dx: number; dy: number }[] = [];

  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private activeParcelsCount = 0;
  private maxActiveParcels = 30;
  private typingToggle = false;

  constructor() {
    super({ key: 'OfficeScene' });
  }

  init(data: {
    snapshot: BrokerSnapshot;
    onSelect: (e: InspectedEntity | null) => void;
    onParcelEvent?: (type: 'publish' | 'route' | 'consume' | 'nack', consumerIdx?: number) => void;
  }) {
    this.snapshot = data.snapshot;
    this.onEntitySelectCallback = data.onSelect;
    this.onParcelEventCallback = data.onParcelEvent;
  }

  async create() {
    // Generate crisp SVG sprites and wait until loaded into Phaser Texture Manager
    await SpriteFactory.registerAllTextures(this);

    // 1. Cozy Sunset Room Background
    const bg = this.add.image(640, 380, 'office-bg').setDepth(0);
    bg.setOrigin(0.5, 0.5);

    // 2. Animated Blue Tech Conveyor Belts
    this.createConveyorBelts();

    // 3. Publisher Desk & Chibi Developer + Speech Callout
    this.createPublisherStation();

    // 4. Exchange Sorting Machine
    this.createExchangeStation();

    // 5. Orange Queue Buffer Machine + Stacked Envelopes
    this.createQueueStation();

    // 6. Three Chibi Consumers at Desks + Status Pills
    this.createConsumerStations();

    // 7. Dead Letter Queue Bin
    this.createDlqStation();

    // 8. Robot Bunny Mascot & Sleeping Tabby Cat with Zzz
    this.createMascotAndCat();

    // 9. Camera & Zoom Setup
    this.setupCamera();

    this.sceneReady = true;
    this.updateShelfVisuals();
    this.updateSpawnerRate();

    // Subtle Publisher Typing & Beacon Animation Loop
    this.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        if (this.isPaused) return;
        this.typingToggle = !this.typingToggle;
        if (this.publisherSprite) {
          this.publisherSprite.setTexture(this.typingToggle ? 'publisher-desk-typing' : 'publisher-desk');
        }
        if (this.exchangeSprite) {
          this.exchangeSprite.setTexture(this.typingToggle ? 'exchange-machine-active' : 'exchange-machine');
        }
      }
    });
  }

  override update(time: number) {
    if (!this.sceneReady || this.isPaused) return;
    // Animate conveyor chevron arrows smoothly along belt direction
    const shift = ((time * 0.03 * this.speedMultiplier) % 16);
    for (const c of this.chevronSprites) {
      c.sprite.setPosition(c.baseX + c.dx * shift, c.baseY + c.dy * shift);
    }
  }

  updateSnapshot(snapshot: BrokerSnapshot, speed: number, paused: boolean) {
    this.snapshot = snapshot;
    this.speedMultiplier = speed;
    this.isPaused = paused;

    if (!this.sceneReady) return;

    this.updateShelfVisuals();
    this.updateSpawnerRate();

    // Update Consumer Active/Idle Visuals
    this.consumers.forEach((c, idx) => {
      const metric = this.snapshot.consumers[idx];
      c.active = metric ? metric.isActive : true;
      if (c.sprite) {
        c.sprite.setTexture(c.active ? `consumer-${c.id}` : `consumer-${c.id}-idle`);
      }
      if (c.statusDot) {
        c.statusDot.setFillStyle(c.active ? 0x22c55e : 0x94a3b8);
      }
      if (c.statusSubText) {
        c.statusSubText.setText(c.active ? '(Processing...)' : '(Idle / Standby)');
        c.statusSubText.setColor(c.active ? '#4ade80' : '#94a3b8');
      }
    });
  }

  private createConveyorBelts() {
    const beltGfx = this.add.graphics().setDepth(2);

    // Helper to draw a thick glowing blue conveyor track
    const drawTrack = (points: { x: number; y: number }[]) => {
      // Dark outer casing
      beltGfx.lineStyle(28, 0x0f172a, 1);
      beltGfx.beginPath();
      beltGfx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) beltGfx.lineTo(points[i].x, points[i].y);
      beltGfx.strokePath();

      // Blue metallic belt body
      beltGfx.lineStyle(20, 0x1e3a8a, 1);
      beltGfx.beginPath();
      beltGfx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) beltGfx.lineTo(points[i].x, points[i].y);
      beltGfx.strokePath();

      // Glowing cyan inner stripe
      beltGfx.lineStyle(4, 0x38bdf8, 0.65);
      beltGfx.beginPath();
      beltGfx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) beltGfx.lineTo(points[i].x, points[i].y);
      beltGfx.strokePath();
    };

    // Track 1: Publisher -> Exchange
    drawTrack([
      { x: 195, y: 515 },
      { x: 315, y: 500 }
    ]);
    this.addBeltChevrons(210, 513, 290, 502, 3);

    // Track 2: Exchange -> Queue
    drawTrack([
      { x: 440, y: 495 },
      { x: 515, y: 490 }
    ]);
    this.addBeltChevrons(450, 494, 495, 491, 2);

    // Track 3A: Queue -> Consumer #1 (Top branch)
    drawTrack([
      { x: 660, y: 435 },
      { x: 720, y: 365 },
      { x: 785, y: 365 }
    ]);
    this.addBeltChevrons(670, 425, 715, 370, 2);

    // Track 3B: Queue -> Consumer #2 (Middle branch)
    drawTrack([
      { x: 660, y: 475 },
      { x: 795, y: 485 }
    ]);
    this.addBeltChevrons(675, 476, 765, 483, 3);

    // Track 3C: Queue -> Consumer #3 (Bottom branch)
    drawTrack([
      { x: 660, y: 510 },
      { x: 720, y: 595 },
      { x: 785, y: 595 }
    ]);
    this.addBeltChevrons(670, 520, 715, 585, 2);
  }

  private addBeltChevrons(x1: number, y1: number, x2: number, y2: number, count: number) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const dx = (x2 - x1) / dist;
    const dy = (y2 - y1) / dist;

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const bx = x1 + (x2 - x1) * t;
      const by = y1 + (y2 - y1) * t;
      const txt = this.add.text(bx, by, '»', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#60a5fa'
      }).setOrigin(0.5).setDepth(3);
      this.chevronSprites.push({ sprite: txt, baseX: bx, baseY: by, dx, dy });
    }
  }

  private createPublisherStation() {
    this.publisherSprite = this.add.image(this.publisherPos.x, this.publisherPos.y, 'publisher-desk')
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    // Floating Speech Callout ("Publisher (Publish Message)")
    const calloutX = this.publisherPos.x - 5;
    const calloutY = this.publisherPos.y - 125;
    const bubbleGfx = this.add.graphics().setDepth(12);
    bubbleGfx.fillStyle(0x1e293b, 0.92);
    bubbleGfx.lineStyle(2, 0x60a5fa, 0.9);
    bubbleGfx.fillRoundedRect(calloutX - 78, calloutY - 26, 156, 52, 12);
    bubbleGfx.strokeRoundedRect(calloutX - 78, calloutY - 26, 156, 52, 12);

    this.add.text(calloutX + 8, calloutY - 9, 'Publisher', {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(13);

    this.add.text(calloutX, calloutY + 11, '(Publish Message)', {
      fontFamily: 'sans-serif',
      fontSize: '11px',
      color: '#cbd5e1'
    }).setOrigin(0.5).setDepth(13);

    this.add.text(calloutX - 54, calloutY - 8, '✈️', {
      fontSize: '16px'
    }).setOrigin(0.5).setDepth(13);

    this.publisherSprite.on('pointerdown', () => {
      this.onEntitySelectCallback({
        type: 'publisher',
        title: 'Publisher (Order Service Producer)',
        data: {
          'Role': 'Message Producer',
          'Publish Rate': `${this.snapshot.totalPublishRate} msg/s`,
          'Target Exchange': 'orders (topic)',
          'Routing Key': 'orders.new',
          'Delivery Mode': '2 (Persistent)'
        }
      });
    });
  }

  private createExchangeStation() {
    this.exchangeSprite = this.add.image(this.exchangePos.x, this.exchangePos.y, 'exchange-machine')
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    this.exchangeSprite.on('pointerdown', () => {
      this.onEntitySelectCallback({
        type: 'exchange',
        title: 'Exchange: orders (direct / topic / fanout)',
        data: {
          'Exchange Name': 'orders',
          'Exchange Type': 'topic',
          'Inbound Rate': `${this.snapshot.totalPublishRate} msg/s`,
          'Routed Out Rate': `${this.snapshot.totalDeliverRate} msg/s`,
          'Bound Queue': 'orders.queue',
          'Status': 'Active Routing'
        }
      });
    });
  }

  private createQueueStation() {
    const qSprite = this.add.image(this.queuePos.x, this.queuePos.y, 'queue-machine')
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    qSprite.on('pointerdown', () => {
      const q = this.snapshot.queues[0];
      this.onEntitySelectCallback({
        type: 'queue',
        title: `Queue: ${q?.name || 'orders.queue'}`,
        data: {
          'Queue Name': q?.name || 'orders.queue',
          'In Queue (Backlog)': this.snapshot.totalBacklog,
          'Unacknowledged': q?.messagesUnacknowledged ?? 4,
          'Publish Rate': `${this.snapshot.totalPublishRate} msg/s`,
          'Consume Rate': `${this.snapshot.totalAckRate} msg/s`,
          'Active Consumers': this.consumers.filter(c => c.active).length,
          'Dead Letter Exchange': 'orders.dlx'
        }
      });
    });
  }

  private createConsumerStations() {
    this.consumers.forEach((c) => {
      c.sprite = this.add.image(c.x, c.y, `consumer-${c.id}`)
        .setDepth(10)
        .setInteractive({ useHandCursor: true });

      // Status Pill to the right of each Consumer matching screenshot
      const pillX = c.x + 128;
      const pillY = c.y - 6;
      c.statusBg = this.add.graphics().setDepth(11);
      c.statusBg.fillStyle(0x0f172a, 0.88);
      c.statusBg.lineStyle(1.5, 0x22c55e, 0.8);
      c.statusBg.fillRoundedRect(pillX - 68, pillY - 22, 136, 42, 10);
      c.statusBg.strokeRoundedRect(pillX - 68, pillY - 22, 136, 42, 10);

      c.statusDot = this.add.circle(pillX - 52, pillY - 7, 5, 0x22c55e).setDepth(12);

      this.add.text(pillX + 6, pillY - 7, `Consumer #${c.id}`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f8fafc'
      }).setOrigin(0.5).setDepth(12);

      c.statusSubText = this.add.text(pillX, pillY + 9, '(Processing...)', {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#4ade80'
      }).setOrigin(0.5).setDepth(12);

      // Cute floating heart bubble above Consumer #1
      if (c.id === 1) {
        c.heartBubble = this.add.image(c.x + 38, c.y - 65, 'heart-bubble').setDepth(15);
        this.tweens.add({
          targets: c.heartBubble,
          y: c.y - 73,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      c.sprite.on('pointerdown', () => {
        this.onEntitySelectCallback({
          type: 'consumer',
          title: `Consumer #${c.id} Worker Station`,
          data: {
            'Consumer Tag': `consumer-worker-${c.id}`,
            'Bound Queue': 'orders.queue',
            'Status': c.active ? 'Processing Messages (Active)' : 'Idle / Standby',
            'Prefetch Count': 10,
            'ACK Mode': 'Auto / Correlated'
          }
        });
      });
    });
  }

  private createDlqStation() {
    this.dlqSprite = this.add.image(this.dlqPos.x, this.dlqPos.y, 'dlq-bin')
      .setDepth(9)
      .setScale(0.85)
      .setInteractive({ useHandCursor: true });

    this.dlqSprite.on('pointerdown', () => {
      const dlq = this.snapshot.queues.find(q => q.name.includes('dlq'));
      this.onEntitySelectCallback({
        type: 'dlq',
        title: 'Dead Letter Queue (orders.dlq)',
        data: {
          'Queue Name': 'orders.dlq',
          'Failed Messages': dlq?.messagesTotal ?? 0,
          'Rejection Reason': 'NACK / Retry Exhausted',
          'Status': (dlq?.messagesTotal ?? 0) > 0 ? 'Attention Needed' : 'Clean (0 Failed)'
        }
      });
    });
  }

  private createMascotAndCat() {
    // Cute White Robot Bunny Mascot
    const robot = this.add.image(this.robotPos.x, this.robotPos.y, 'robot-bunny')
      .setDepth(18)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: robot,
      y: this.robotPos.y - 5,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    robot.on('pointerdown', () => {
      this.onEntitySelectCallback({
        type: 'mascot',
        title: 'BunBot v2.1 (Office Telemetry Assistant)',
        data: {
          'Broker': this.snapshot.brokerVersion,
          'Pipeline Health': this.snapshot.mode === 'DemoErrorSpike' ? 'Degraded (High NACKs)' : 'Optimal (100% Flowing)',
          'Active Workers': `${this.consumers.filter(c => c.active).length} / 3`,
          'Queue Backlog': `${this.snapshot.totalBacklog} messages`
        }
      });
    });

    // Sleeping Tabby Cat on Cushion
    this.add.image(this.catPos.x, this.catPos.y, 'sleeping-cat').setDepth(14);

    // Animated Floating "Zzz" above the sleeping cat
    const zzz = this.add.text(this.catPos.x + 18, this.catPos.y - 28, 'Zzz', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#fde68a',
      stroke: '#451a03',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: zzz,
      y: this.catPos.y - 42,
      alpha: 0.35,
      scale: 1.15,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private updateShelfVisuals() {
    const backlog = this.snapshot ? this.snapshot.totalBacklog : 16;
    // Map backlog to 0..8 visible envelopes inside the 2 shelves of the Queue machine
    const slots = Math.min(8, Math.max(1, Math.ceil(backlog / 6)));

    while (this.shelfEnvelopes.length > slots) {
      const env = this.shelfEnvelopes.pop();
      env?.destroy();
    }

    while (this.shelfEnvelopes.length < slots) {
      const idx = this.shelfEnvelopes.length;
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      // Positioned neatly inside the two dark shelf cavities of Queue machine
      const ex = this.queuePos.x - 45 + col * 30;
      const ey = this.queuePos.y + 5 + row * 42;

      const env = this.add.image(ex, ey, 'envelope-gold').setDepth(12).setScale(0.76);
      this.shelfEnvelopes.push(env);
    }
  }

  private updateSpawnerRate() {
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }

    if (this.isPaused) return;

    const rate = this.snapshot ? this.snapshot.totalPublishRate : 32;
    const spawnsPerSec = TrafficScaler.getSpawnRatePerSecond(rate, this.speedMultiplier);
    const intervalMs = Math.max(180, 1000 / spawnsPerSec);

    this.spawnTimer = this.time.addEvent({
      delay: intervalMs,
      callback: this.spawnEnvelopeJourney,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Spawns a golden message envelope at the Publisher desk, glides along the blue conveyor
   * through the Exchange machine, into the Queue buffer, and branches out to one of the 3 Consumers!
   */
  private spawnEnvelopeJourney() {
    if (!this.sceneReady || this.isPaused || this.activeParcelsCount >= this.maxActiveParcels) return;

    this.activeParcelsCount++;
    const isErrorMode = this.snapshot.mode === 'DemoErrorSpike';
    const isNack = isErrorMode ? Math.random() < 0.6 : false;

    const env = this.add.image(205, 505, isNack ? 'envelope-dlq' : 'envelope-gold')
      .setDepth(14)
      .setScale(0.2);

    this.onParcelEventCallback?.('publish');

    // Pop onto Conveyor 1
    this.tweens.add({
      targets: env,
      scale: 0.92,
      duration: 140,
      onComplete: () => {
        // 1. Glide along Conveyor 1 into Exchange Machine
        this.tweens.add({
          targets: env,
          x: 320,
          y: 492,
          duration: 620 / this.speedMultiplier,
          ease: 'Linear',
          onComplete: () => {
            this.onParcelEventCallback?.('route');
            // Pass through Exchange to Conveyor 2
            env.setPosition(442, 488);
            this.tweens.add({
              targets: env,
              x: 520,
              y: 484,
              duration: 420 / this.speedMultiplier,
              ease: 'Linear',
              onComplete: () => {
                // Briefly buffer inside Queue
                env.setVisible(false);
                const activeConsumers = this.consumers.filter(c => c.active);
                if (activeConsumers.length === 0) {
                  this.cleanupEnvelope(env);
                  return;
                }

                const chosen = activeConsumers[Math.floor(Math.random() * activeConsumers.length)];
                const waitMs = (220 + Math.random() * 250) / this.speedMultiplier;

                this.time.delayedCall(waitMs, () => {
                  if (!env.active) return;
                  const startY = chosen.id === 1 ? 430 : chosen.id === 2 ? 470 : 505;
                  env.setPosition(662, startY);
                  env.setVisible(true);

                  // Move along branching track to Consumer desk
                  this.tweens.add({
                    targets: env,
                    x: chosen.beltEndX,
                    y: chosen.beltEndY - 8,
                    duration: 580 / this.speedMultiplier,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                      if (!env.active) return;
                      if (isNack) {
                        this.showFeedbackBadge(chosen.x, chosen.y - 45, 'nack-badge');
                        this.onParcelEventCallback?.('nack', chosen.id);
                        // Divert to DLQ bin
                        this.tweens.add({
                          targets: env,
                          x: this.dlqPos.x,
                          y: this.dlqPos.y - 10,
                          scale: 0.5,
                          duration: 500 / this.speedMultiplier,
                          ease: 'Back.easeIn',
                          onComplete: () => this.cleanupEnvelope(env)
                        });
                      } else {
                        this.showFeedbackBadge(chosen.x - 10, chosen.y - 45, 'ack-badge');
                        this.onParcelEventCallback?.('consume', chosen.id);
                        this.cleanupEnvelope(env);
                      }
                    }
                  });
                });
              }
            });
          }
        });
      }
    });
  }

  private showFeedbackBadge(x: number, y: number, texture: string) {
    const badge = this.add.image(x, y, texture).setDepth(25).setScale(0.75);
    this.tweens.add({
      targets: badge,
      y: y - 24,
      alpha: 0,
      duration: 650 / this.speedMultiplier,
      ease: 'Quad.easeOut',
      onComplete: () => badge.destroy()
    });
  }

  private cleanupEnvelope(env: Phaser.GameObjects.Image) {
    env.destroy();
    this.activeParcelsCount = Math.max(0, this.activeParcelsCount - 1);
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.centerOn(640, 380);

    // Responsive auto-fit to viewport
    const fitCamera = () => {
      const zx = this.scale.width / 1280;
      const zy = this.scale.height / 760;
      const bestZoom = Math.max(0.75, Math.min(zx, zy));
      cam.setZoom(bestZoom);
      cam.centerOn(640, 380);
    };

    fitCamera();
    this.scale.on('resize', fitCamera);

    // Drag to pan
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && pointer.button === 0) {
        cam.scrollX -= (pointer.x - pointer.prevPosition.x) / cam.zoom;
        cam.scrollY -= (pointer.y - pointer.prevPosition.y) / cam.zoom;
      }
    });

    // Wheel to zoom
    this.input.on('wheel', (_p: any, _go: any, _dx: number, deltaY: number) => {
      const newZoom = Phaser.Math.Clamp(cam.zoom - deltaY * 0.0008, 0.6, 1.8);
      cam.setZoom(newZoom);
    });
  }
}
