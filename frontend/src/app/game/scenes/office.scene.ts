import * as Phaser from 'phaser';
import { BrokerSnapshot, InspectedEntity } from '../../core/models/broker.model';
import { TrafficScaler } from '../systems/traffic-scaler';

export class OfficeScene extends Phaser.Scene {
  private snapshot!: BrokerSnapshot;
  private onEntitySelectCallback!: (entity: InspectedEntity | null) => void;
  private speedMultiplier = 1.0;
  private isPaused = false;

  // Station positions in isometric world coordinates
  private publisherPos = { x: 200, y: 320 };
  private exchangePos = { x: 380, y: 300 };
  private queueShelfPos = { x: 560, y: 260 };
  private consumerDesks: { x: number; y: number; active: boolean; workerSprite?: Phaser.GameObjects.Sprite }[] = [
    { x: 740, y: 200, active: true },
    { x: 760, y: 290, active: true },
    { x: 740, y: 380, active: true },
  ];
  private dlqPos = { x: 580, y: 440 };

  // Visual shelf parcels
  private shelfParcels: Phaser.GameObjects.Image[] = [];
  private shelfText!: Phaser.GameObjects.Text;
  private dlqText!: Phaser.GameObjects.Text;

  // Timers & counters
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private activeParcelsCount = 0;
  private maxActiveParcels = 35; // Strict performance budget

  constructor() {
    super({ key: 'OfficeScene' });
  }

  init(data: { snapshot: BrokerSnapshot; onSelect: (e: InspectedEntity | null) => void }) {
    this.snapshot = data.snapshot;
    this.onEntitySelectCallback = data.onSelect;
  }

  preload() {
    this.generatePixelArtTextures();
  }

  create() {
    // Background and Isometric Floor
    this.createIsometricFloor();

    // Conveyor Belts
    this.createConveyors();

    // Entities & Stations
    this.createPublisherStation();
    this.createExchangeStation();
    this.createQueueShelfStation();
    this.createConsumerStations();
    this.createDlqDepot();

    // Setup Camera navigation
    this.setupCameraControls();

    // Start Traffic Parcel Spawner
    this.updateSpawnerRate();
  }

  updateSnapshot(snapshot: BrokerSnapshot, speed: number, paused: boolean) {
    this.snapshot = snapshot;
    this.speedMultiplier = speed;
    this.isPaused = paused;

    // Update shelf visually
    this.updateShelfVisuals();

    // Update spawner timer rate
    this.updateSpawnerRate();

    // Update consumer activity states
    if (this.snapshot.consumers) {
      this.consumerDesks.forEach((desk, idx) => {
        const c = this.snapshot.consumers[idx];
        desk.active = c ? c.isActive : false;
        if (desk.workerSprite) {
          desk.workerSprite.setAlpha(desk.active ? 1.0 : 0.35);
        }
      });
    }
  }

  private updateSpawnerRate() {
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }

    if (this.isPaused) return;

    const rate = this.snapshot ? this.snapshot.totalPublishRate : 15;
    const spawnsPerSec = TrafficScaler.getSpawnRatePerSecond(rate, this.speedMultiplier);
    const intervalMs = Math.max(120, 1000 / spawnsPerSec);

    this.spawnTimer = this.time.addEvent({
      delay: intervalMs,
      callback: this.spawnParcelCycle,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Complete journey of a single parcel:
   * Publisher -> Conveyor -> Exchange Sorter -> Conveyor -> Queue Shelf -> Consumer Desk -> ACK / DLQ
   */
  private spawnParcelCycle() {
    if (this.isPaused || this.activeParcelsCount >= this.maxActiveParcels) return;

    this.activeParcelsCount++;
    const isErrorMode = this.snapshot.mode === 'DemoErrorSpike';
    const isDlqParcel = isErrorMode ? Math.random() < 0.65 : Math.random() < 0.05;

    // Spawn parcel at Publisher
    const parcel = this.add.image(this.publisherPos.x + 20, this.publisherPos.y - 10, isDlqParcel ? 'parcel-dlq' : 'parcel');
    parcel.setDepth(15);
    parcel.setScale(0);

    // Initial pop-in animation
    this.tweens.add({
      targets: parcel,
      scale: 1,
      duration: 200,
      onComplete: () => {
        // Step 1: Move from Publisher to Exchange Sorter
        const duration1 = 700 / this.speedMultiplier;
        this.tweens.add({
          targets: parcel,
          x: this.exchangePos.x,
          y: this.exchangePos.y - 15,
          duration: duration1,
          ease: 'Linear',
          onComplete: () => {
            // Pulse at Exchange
            this.tweens.add({
              targets: parcel,
              scale: 1.25,
              yoyo: true,
              duration: 150 / this.speedMultiplier,
              onComplete: () => {
                // Step 2: Move from Exchange to Queue Shelf
                const duration2 = 800 / this.speedMultiplier;
                this.tweens.add({
                  targets: parcel,
                  x: this.queueShelfPos.x - 20,
                  y: this.queueShelfPos.y + 10,
                  duration: duration2,
                  ease: 'Linear',
                  onComplete: () => {
                    // Temporarily absorbed into shelf
                    parcel.setVisible(false);

                    // Step 3: Pick up by an available Consumer
                    const availableDesks = this.consumerDesks.filter(d => d.active);
                    if (availableDesks.length === 0) {
                      // No consumers! Parcel remains or drops
                      this.destroyParcel(parcel);
                      return;
                    }

                    const targetDesk = availableDesks[Math.floor(Math.random() * availableDesks.length)];
                    const shelfWait = (300 + Math.random() * 400) / this.speedMultiplier;

                    this.time.delayedCall(shelfWait, () => {
                      if (!parcel.active) return;
                      parcel.setPosition(this.queueShelfPos.x + 10, this.queueShelfPos.y);
                      parcel.setVisible(true);

                      const duration3 = 600 / this.speedMultiplier;
                      this.tweens.add({
                        targets: parcel,
                        x: targetDesk.x - 15,
                        y: targetDesk.y - 10,
                        duration: duration3,
                        ease: 'Linear',
                        onComplete: () => {
                          // Consumer processing time
                          const processTime = (400 + Math.random() * 300) / this.speedMultiplier;
                          this.time.delayedCall(processTime, () => {
                            if (!parcel.active) return;

                            if (isDlqParcel) {
                              // NACK -> Divert to Dead Letter Queue
                              this.triggerNackAnimation(targetDesk.x, targetDesk.y);
                              this.tweens.add({
                                targets: parcel,
                                x: this.dlqPos.x,
                                y: this.dlqPos.y - 10,
                                duration: 600 / this.speedMultiplier,
                                ease: 'Cubic.easeIn',
                                onComplete: () => {
                                  this.triggerDlqBurst(this.dlqPos.x, this.dlqPos.y);
                                  this.destroyParcel(parcel);
                                }
                              });
                            } else {
                              // Successful ACK!
                              this.triggerAckCelebration(targetDesk.x - 15, targetDesk.y - 15);
                              this.destroyParcel(parcel);
                            }
                          });
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
    });
  }

  private destroyParcel(parcel: Phaser.GameObjects.Image) {
    this.tweens.add({
      targets: parcel,
      alpha: 0,
      scale: 0.5,
      duration: 150,
      onComplete: () => {
        parcel.destroy();
        this.activeParcelsCount = Math.max(0, this.activeParcelsCount - 1);
      }
    });
  }

  private triggerAckCelebration(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      const sparkle = this.add.image(x, y, 'ack-sparkle');
      sparkle.setDepth(25);
      const angle = (Math.PI * 2 * i) / 4 + Math.random() * 0.5;
      const dist = 16 + Math.random() * 12;

      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 400 / this.speedMultiplier,
        ease: 'Quad.easeOut',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  private triggerNackAnimation(x: number, y: number) {
    const alertIcon = this.add.text(x - 2, y - 30, '⚠️ NACK', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#f87171',
      backgroundColor: '#7f1d1d',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: alertIcon,
      y: y - 48,
      alpha: 0,
      duration: 800 / this.speedMultiplier,
      ease: 'Quad.easeOut',
      onComplete: () => alertIcon.destroy()
    });
  }

  private triggerDlqBurst(x: number, y: number) {
    const flash = this.add.circle(x, y - 10, 16, 0xef4444, 0.6).setDepth(20);
    this.tweens.add({
      targets: flash,
      radius: 28,
      alpha: 0,
      duration: 350,
      onComplete: () => flash.destroy()
    });
  }

  private updateShelfVisuals() {
    const backlog = this.snapshot ? this.snapshot.totalBacklog : 8;
    const visualCount = TrafficScaler.getVisualShelfCount(backlog);

    // Clean up excess shelf parcels
    while (this.shelfParcels.length > visualCount) {
      const p = this.shelfParcels.pop();
      p?.destroy();
    }

    // Add missing shelf parcels in an isometric stack
    while (this.shelfParcels.length < visualCount) {
      const idx = this.shelfParcels.length;
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const px = this.queueShelfPos.x - 18 + col * 9;
      const py = this.queueShelfPos.y - 12 - row * 8;

      const p = this.add.image(px, py, 'parcel').setDepth(10 + row);
      p.setScale(0.9);
      this.shelfParcels.push(p);
    }

    // Update shelf label
    if (this.shelfText) {
      this.shelfText.setText(`Backlog: ${backlog}`);
      this.shelfText.setColor(backlog > 50 ? '#f87171' : backlog > 20 ? '#fbbf24' : '#34d399');
    }

    // Update DLQ label
    if (this.dlqText && this.snapshot) {
      const dlqQueue = this.snapshot.queues.find(q => q.name.includes('dlq'));
      const count = dlqQueue ? dlqQueue.messagesTotal : 0;
      this.dlqText.setText(`DLQ: ${count}`);
    }
  }

  private createIsometricFloor() {
    const cols = 15;
    const rows = 12;
    const startX = 480;
    const startY = 100;
    const tileW = 64;
    const tileH = 32;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isoX = startX + (c - r) * (tileW / 2);
        const isoY = startY + (c + r) * (tileH / 2);

        const isBorder = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
        const isCarpet = (r >= 3 && r <= 8 && c >= 3 && c <= 10);
        const texture = isCarpet ? 'iso-tile-wood' : 'iso-tile-floor';

        const tile = this.add.image(isoX, isoY, texture);
        tile.setDepth(0);
        if (isBorder) tile.setAlpha(0.65);
      }
    }
  }

  private createConveyors() {
    // Belt from Publisher to Exchange
    this.createBeltLine(this.publisherPos.x, this.publisherPos.y, this.exchangePos.x, this.exchangePos.y);
    // Belt from Exchange to Queue Shelf
    this.createBeltLine(this.exchangePos.x, this.exchangePos.y, this.queueShelfPos.x, this.queueShelfPos.y);
    // Belt from Queue Shelf to Consumers
    this.consumerDesks.forEach(desk => {
      this.createBeltLine(this.queueShelfPos.x, this.queueShelfPos.y, desk.x, desk.y);
    });
    // Belt from Consumers to DLQ
    this.createBeltLine(this.consumerDesks[1].x, this.consumerDesks[1].y, this.dlqPos.x, this.dlqPos.y);
  }

  private createBeltLine(x1: number, y1: number, x2: number, y2: number) {
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const bx = x1 + (x2 - x1) * (i / steps);
      const by = y1 + (y2 - y1) * (i / steps);
      this.add.image(bx, by, 'conveyor-segment').setDepth(2).setAlpha(0.8);
    }
  }

  private createPublisherStation() {
    const desk = this.add.image(this.publisherPos.x, this.publisherPos.y, 'publisher-station')
      .setDepth(5)
      .setInteractive({ cursor: 'pointer' });

    this.add.image(this.publisherPos.x - 12, this.publisherPos.y - 18, 'publisher-character')
      .setDepth(6);

    this.add.text(this.publisherPos.x, this.publisherPos.y + 24, 'Publisher (Dispatcher)', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#38bdf8'
    }).setOrigin(0.5).setDepth(15);

    desk.on('pointerdown', () => {
      this.onEntitySelectCallback({
        type: 'publisher',
        title: 'Message Publisher (Order Service Dispatcher)',
        data: {
          'Role': 'Client Service Publisher',
          'Publish Rate': `${this.snapshot.totalPublishRate} msg/s`,
          'Status': 'Healthy / Active',
          'Exchange Target': 'amq.topic',
          'Routing Key': 'orders.new'
        }
      });
    });
  }

  private createExchangeStation() {
    const sorter = this.add.image(this.exchangePos.x, this.exchangePos.y, 'exchange-sorter')
      .setDepth(5)
      .setInteractive({ cursor: 'pointer' });

    this.add.text(this.exchangePos.x, this.exchangePos.y + 28, 'amq.topic (Sorter)', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#fbbf24'
    }).setOrigin(0.5).setDepth(15);

    sorter.on('pointerdown', () => {
      this.onEntitySelectCallback({
        type: 'exchange',
        title: 'Exchange (amq.topic)',
        data: {
          'Type': 'topic',
          'Throughput In': `${this.snapshot.totalPublishRate} msg/s`,
          'Throughput Out': `${this.snapshot.totalDeliverRate} msg/s`,
          'Bound Queues': 'orders.checkout, notifications.push',
          'Internal Routing': 'Direct Match'
        }
      });
    });
  }

  private createQueueShelfStation() {
    const shelf = this.add.image(this.queueShelfPos.x, this.queueShelfPos.y, 'queue-shelf')
      .setDepth(5)
      .setInteractive({ cursor: 'pointer' });

    this.add.text(this.queueShelfPos.x, this.queueShelfPos.y + 36, 'Queue (orders.checkout)', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#34d399'
    }).setOrigin(0.5).setDepth(15);

    this.shelfText = this.add.text(this.queueShelfPos.x, this.queueShelfPos.y + 48, 'Backlog: 8', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#34d399'
    }).setOrigin(0.5).setDepth(15);

    shelf.on('pointerdown', () => {
      const q = this.snapshot.queues.find(queue => queue.name.includes('orders')) || this.snapshot.queues[0];
      this.onEntitySelectCallback({
        type: 'queue',
        title: `Queue: ${q.name}`,
        data: {
          'Messages Ready (Backlog)': q.messagesReady,
          'Unacknowledged': q.messagesUnacknowledged,
          'Total Depth': q.messagesTotal,
          'Consumers Attached': q.consumersCount,
          'Publish Rate': `${q.publishRate} msg/s`,
          'Deliver Rate': `${q.deliverRate} msg/s`,
          'ACK Rate': `${q.ackRate} msg/s`,
          'DLQ Enabled': q.hasDeadLetterQueue ? 'Yes (orders.dlq)' : 'No'
        }
      });
    });
  }

  private createConsumerStations() {
    this.consumerDesks.forEach((desk, idx) => {
      const deskImage = this.add.image(desk.x, desk.y, 'consumer-desk')
        .setDepth(5)
        .setInteractive({ cursor: 'pointer' });

      desk.workerSprite = this.add.sprite(desk.x - 10, desk.y - 15, 'worker-character')
        .setDepth(6);

      this.add.text(desk.x, desk.y + 24, `Worker ${idx + 1}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#818cf8'
      }).setOrigin(0.5).setDepth(15);

      deskImage.on('pointerdown', () => {
        const c = this.snapshot.consumers[idx] || {
          consumerTag: `worker-${idx + 1}`,
          channelName: '127.0.0.1:54321',
          prefetchCount: 10,
          isActive: desk.active
        };

        this.onEntitySelectCallback({
          type: 'consumer',
          title: `Consumer Worker ${idx + 1}`,
          data: {
            'Consumer Tag': c.consumerTag,
            'Channel': c.channelName,
            'Prefetch Count': c.prefetchCount,
            'State': desk.active ? 'Processing Messages' : 'Idle / Offline',
            'Queue Listening': 'orders.checkout',
            'Avg ACK Latency': '32 ms'
          }
        });
      });
    });
  }

  private createDlqDepot() {
    const dlq = this.add.image(this.dlqPos.x, this.dlqPos.y, 'dlq-depot')
      .setDepth(5)
      .setInteractive({ cursor: 'pointer' });

    this.add.text(this.dlqPos.x, this.dlqPos.y + 28, 'Dead Letter (DLQ)', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#f87171'
    }).setOrigin(0.5).setDepth(15);

    this.dlqText = this.add.text(this.dlqPos.x, this.dlqPos.y + 40, 'DLQ: 0', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#f87171'
    }).setOrigin(0.5).setDepth(15);

    dlq.on('pointerdown', () => {
      const q = this.snapshot.queues.find(queue => queue.name.includes('dlq')) || {
        name: 'orders.dlq',
        messagesTotal: 0,
        publishRate: 0
      };

      this.onEntitySelectCallback({
        type: 'dlq',
        title: 'Dead Letter Queue (orders.dlq)',
        data: {
          'Queue Name': q.name,
          'Total Poison Messages': q.messagesTotal,
          'NACK Arrival Rate': `${q.publishRate} msg/s`,
          'Status': q.messagesTotal > 20 ? 'High Failure Count!' : 'Acceptable',
          'Action': 'Inspection required on failed payloads'
        }
      });
    });
  }

  private setupCameraControls() {
    const cam = this.cameras.main;
    cam.centerOn(500, 320);

    // Pan with mouse drag
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && pointer.button === 0) {
        cam.scrollX -= (pointer.x - pointer.prevPosition.x) / cam.zoom;
        cam.scrollY -= (pointer.y - pointer.prevPosition.y) / cam.zoom;
      }
    });

    // Zoom with mouse wheel
    this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
      const newZoom = Phaser.Math.Clamp(cam.zoom - deltaY * 0.001, 0.6, 2.0);
      cam.setZoom(newZoom);
    });
  }

  /**
   * Procedurally paints crisp retro isometric pixel-art textures
   * onto Phaser canvas textures. Zero external network dependency!
   */
  private generatePixelArtTextures() {
    // 1. Isometric Floor Tile (64x32)
    const floorGfx = this.make.graphics({ x: 0, y: 0 });
    floorGfx.fillStyle(0x1e293b, 1);
    floorGfx.beginPath();
    floorGfx.moveTo(32, 0);
    floorGfx.lineTo(64, 16);
    floorGfx.lineTo(32, 32);
    floorGfx.lineTo(0, 16);
    floorGfx.closePath();
    floorGfx.fillPath();
    floorGfx.lineStyle(1, 0x334155, 0.8);
    floorGfx.strokePath();
    floorGfx.generateTexture('iso-tile-floor', 64, 32);
    floorGfx.destroy();

    // 2. Isometric Wood Tile (64x32)
    const woodGfx = this.make.graphics({ x: 0, y: 0 });
    woodGfx.fillStyle(0x27272a, 1);
    woodGfx.beginPath();
    woodGfx.moveTo(32, 0);
    woodGfx.lineTo(64, 16);
    woodGfx.lineTo(32, 32);
    woodGfx.lineTo(0, 16);
    woodGfx.closePath();
    woodGfx.fillPath();
    woodGfx.lineStyle(1, 0x3f3f46, 0.9);
    woodGfx.strokePath();
    woodGfx.generateTexture('iso-tile-wood', 64, 32);
    woodGfx.destroy();

    // 3. Conveyor Segment (16x12)
    const convGfx = this.make.graphics({ x: 0, y: 0 });
    convGfx.fillStyle(0x475569, 1);
    convGfx.fillRect(2, 2, 12, 8);
    convGfx.fillStyle(0x0284c7, 0.8);
    convGfx.fillRect(4, 4, 8, 4);
    convGfx.generateTexture('conveyor-segment', 16, 12);
    convGfx.destroy();

    // 4. Publisher Station (48x44)
    const pubGfx = this.make.graphics({ x: 0, y: 0 });
    pubGfx.fillStyle(0x0f172a, 1);
    pubGfx.fillRect(4, 14, 40, 26);
    pubGfx.fillStyle(0x0284c7, 1);
    pubGfx.fillRect(8, 16, 32, 6);
    // Monitor
    pubGfx.fillStyle(0x38bdf8, 1);
    pubGfx.fillRect(16, 2, 16, 12);
    pubGfx.fillStyle(0x0369a1, 1);
    pubGfx.fillRect(22, 14, 4, 4);
    pubGfx.generateTexture('publisher-station', 48, 44);
    pubGfx.destroy();

    // 5. Publisher Character (16x24)
    const pubCharGfx = this.make.graphics({ x: 0, y: 0 });
    // Head
    pubCharGfx.fillStyle(0xfbcfe8, 1);
    pubCharGfx.fillRect(4, 2, 8, 8);
    // Hair
    pubCharGfx.fillStyle(0x854d0e, 1);
    pubCharGfx.fillRect(3, 0, 10, 4);
    // Shirt (Cyan)
    pubCharGfx.fillStyle(0x06b6d4, 1);
    pubCharGfx.fillRect(3, 10, 10, 10);
    // Tie
    pubCharGfx.fillStyle(0x0284c7, 1);
    pubCharGfx.fillRect(7, 11, 2, 6);
    pubCharGfx.generateTexture('publisher-character', 16, 24);
    pubCharGfx.destroy();

    // 6. Exchange Sorter (52x48)
    const exGfx = this.make.graphics({ x: 0, y: 0 });
    exGfx.fillStyle(0x78350f, 1);
    exGfx.fillRect(4, 12, 44, 32);
    exGfx.fillStyle(0xf59e0b, 1);
    exGfx.fillRect(8, 16, 36, 10);
    // Sorting gears & indicator lights
    exGfx.fillStyle(0xfef08a, 1);
    exGfx.fillCircle(16, 8, 4);
    exGfx.fillCircle(36, 8, 4);
    exGfx.fillStyle(0xd97706, 1);
    exGfx.fillRect(20, 4, 12, 8);
    exGfx.generateTexture('exchange-sorter', 52, 48);
    exGfx.destroy();

    // 7. Queue Shelf (54x56)
    const shelfGfx = this.make.graphics({ x: 0, y: 0 });
    shelfGfx.fillStyle(0x064e3b, 1);
    // Shelf metal legs
    shelfGfx.fillRect(4, 6, 4, 46);
    shelfGfx.fillRect(46, 6, 4, 46);
    // Horizontal racks
    shelfGfx.fillStyle(0x059669, 1);
    shelfGfx.fillRect(4, 16, 46, 4);
    shelfGfx.fillRect(4, 30, 46, 4);
    shelfGfx.fillRect(4, 44, 46, 4);
    shelfGfx.generateTexture('queue-shelf', 54, 56);
    shelfGfx.destroy();

    // 8. Consumer Desk (48x44)
    const conDeskGfx = this.make.graphics({ x: 0, y: 0 });
    conDeskGfx.fillStyle(0x1e1b4b, 1);
    conDeskGfx.fillRect(4, 14, 40, 26);
    conDeskGfx.fillStyle(0x4338ca, 1);
    conDeskGfx.fillRect(8, 16, 32, 6);
    // Dual monitors
    conDeskGfx.fillStyle(0x818cf8, 1);
    conDeskGfx.fillRect(10, 2, 13, 10);
    conDeskGfx.fillRect(25, 2, 13, 10);
    // Coffee cup
    conDeskGfx.fillStyle(0xf8fafc, 1);
    conDeskGfx.fillRect(40, 18, 4, 5);
    conDeskGfx.generateTexture('consumer-desk', 48, 44);
    conDeskGfx.destroy();

    // 9. Worker Character (16x24)
    const workerGfx = this.make.graphics({ x: 0, y: 0 });
    // Head
    workerGfx.fillStyle(0xfde68a, 1);
    workerGfx.fillRect(4, 2, 8, 8);
    // Hair
    workerGfx.fillStyle(0x18181b, 1);
    workerGfx.fillRect(3, 0, 10, 4);
    // Sweater (Indigo)
    workerGfx.fillStyle(0x6366f1, 1);
    workerGfx.fillRect(3, 10, 10, 10);
    workerGfx.generateTexture('worker-character', 16, 24);
    workerGfx.destroy();

    // 10. DLQ Depot (46x42)
    const dlqGfx = this.make.graphics({ x: 0, y: 0 });
    dlqGfx.fillStyle(0x450a0a, 1);
    dlqGfx.fillRect(4, 10, 38, 28);
    dlqGfx.fillStyle(0xdc2626, 1);
    dlqGfx.fillRect(8, 14, 30, 8);
    // Hazard Stripes
    dlqGfx.fillStyle(0xfef08a, 1);
    dlqGfx.fillRect(12, 16, 4, 4);
    dlqGfx.fillRect(22, 16, 4, 4);
    dlqGfx.fillRect(32, 16, 4, 4);
    dlqGfx.generateTexture('dlq-depot', 46, 42);
    dlqGfx.destroy();

    // 11. Normal Parcel (12x12 isometric box)
    const pGfx = this.make.graphics({ x: 0, y: 0 });
    pGfx.fillStyle(0x38bdf8, 1);
    pGfx.fillRect(1, 1, 10, 10);
    pGfx.fillStyle(0x0284c7, 1);
    pGfx.fillRect(5, 1, 2, 10);
    pGfx.fillRect(1, 5, 10, 2);
    pGfx.generateTexture('parcel', 12, 12);
    pGfx.destroy();

    // 12. DLQ Poison Parcel (12x12)
    const pDlqGfx = this.make.graphics({ x: 0, y: 0 });
    pDlqGfx.fillStyle(0xef4444, 1);
    pDlqGfx.fillRect(1, 1, 10, 10);
    pDlqGfx.fillStyle(0x7f1d1d, 1);
    pDlqGfx.fillRect(5, 1, 2, 10);
    pDlqGfx.fillRect(1, 5, 10, 2);
    pDlqGfx.generateTexture('parcel-dlq', 12, 12);
    pDlqGfx.destroy();

    // 13. ACK Sparkle (8x8)
    const spkGfx = this.make.graphics({ x: 0, y: 0 });
    spkGfx.fillStyle(0x34d399, 1);
    spkGfx.fillRect(3, 0, 2, 8);
    spkGfx.fillRect(0, 3, 8, 2);
    spkGfx.fillStyle(0xa7f3d0, 1);
    spkGfx.fillRect(2, 2, 4, 4);
    spkGfx.generateTexture('ack-sparkle', 8, 8);
    spkGfx.destroy();
  }
}
