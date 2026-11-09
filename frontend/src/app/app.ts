import { Component, ElementRef, OnInit, OnDestroy, ViewChild, inject, effect, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Phaser from 'phaser';
import { OfficeScene } from './game/scenes/office.scene';
import { SimulationService } from './core/services/simulation.service';
import { SignalRService } from './core/services/signalr.service';
import { HudComponent } from './features/hud/hud.component';
import { ToolbarComponent } from './features/controls/toolbar.component';
import { InspectorModalComponent } from './features/inspector/inspector-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HudComponent, ToolbarComponent, InspectorModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  @ViewChild('gameContainer', { static: true }) gameContainerRef!: ElementRef<HTMLDivElement>;

  simulation = inject(SimulationService);
  signalR = inject(SignalRService);
  private ngZone = inject(NgZone);

  private phaserGame: Phaser.Game | null = null;
  private officeScene: OfficeScene | null = null;

  constructor() {
    // Reactive sync between Angular signals and Phaser scene
    effect(() => {
      const snap = this.simulation.snapshot();
      const speed = this.simulation.simulationSpeed();
      const paused = this.simulation.isPaused();
      if (this.officeScene) {
        this.officeScene.updateSnapshot(snap, speed, paused);
      }
    });

    // Reactive sync from SignalR live snapshots to simulation service
    effect(() => {
      const liveSnap = this.signalR.liveSnapshot();
      if (liveSnap) {
        this.simulation.applyLiveSnapshot(liveSnap);
      }
    });
  }

  ngOnInit() {
    this.initPhaser();
    this.signalR.connect('http://localhost:5000/hubs/monitoring');
  }

  ngOnDestroy() {
    this.signalR.disconnect();
    if (this.phaserGame) {
      this.phaserGame.destroy(true);
      this.phaserGame = null;
    }
  }

  private initPhaser() {
    this.officeScene = new OfficeScene();

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: this.gameContainerRef.nativeElement,
      width: '100%',
      height: '100%',
      backgroundColor: '#2a2232',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [this.officeScene]
    };

    this.phaserGame = new Phaser.Game(config);

    this.phaserGame.events.once('ready', () => {
      this.officeScene?.init({
        snapshot: this.simulation.snapshot(),
        onSelect: (entity) => this.ngZone.run(() => this.simulation.setInspectedEntity(entity)),
        onParcelEvent: (type, consumerIdx) =>
          this.ngZone.run(() => this.simulation.recordParcelEvent(type, consumerIdx))
      });
    });
  }

  resetCamera() {
    if (this.officeScene) {
      const cam = this.officeScene.cameras.main;
      const zx = this.officeScene.scale.width / 1280;
      const zy = this.officeScene.scale.height / 760;
      cam.setZoom(Math.max(0.75, Math.min(zx, zy)));
      cam.centerOn(640, 380);
    }
  }
}
