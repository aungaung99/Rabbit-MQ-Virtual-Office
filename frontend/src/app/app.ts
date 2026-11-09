import { Component, ElementRef, OnInit, OnDestroy, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Phaser from 'phaser';
import { OfficeScene } from './game/scenes/office.scene';
import { SimulationService } from './core/services/simulation.service';
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
  }

  ngOnInit() {
    this.initPhaser();
  }

  ngOnDestroy() {
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
      backgroundColor: '#090d16',
      pixelArt: true,
      roundPixels: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [this.officeScene]
    };

    this.phaserGame = new Phaser.Game(config);

    // Pass initial data once scene starts
    this.phaserGame.events.once('ready', () => {
      this.officeScene?.init({
        snapshot: this.simulation.snapshot(),
        onSelect: (entity) => this.simulation.setInspectedEntity(entity)
      });
    });
  }

  zoomIn() {
    if (this.officeScene) {
      const cam = this.officeScene.cameras.main;
      cam.setZoom(Math.min(2.0, cam.zoom + 0.2));
    }
  }

  zoomOut() {
    if (this.officeScene) {
      const cam = this.officeScene.cameras.main;
      cam.setZoom(Math.max(0.6, cam.zoom - 0.2));
    }
  }

  resetCamera() {
    if (this.officeScene) {
      const cam = this.officeScene.cameras.main;
      cam.centerOn(500, 320);
      cam.setZoom(1.0);
    }
  }
}
