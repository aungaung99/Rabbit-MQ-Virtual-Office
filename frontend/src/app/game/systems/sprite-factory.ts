import * as Phaser from 'phaser';

/**
 * Generates rich, high-detail 2D game sprites and chibi character textures
 * matching the cozy "RabbitMQ Message Queue Playground" illustration style.
 */
export class SpriteFactory {
  static registerAllTextures(scene: Phaser.Scene): Promise<void> {
    const promises: Promise<void>[] = [
      this.loadSvgTexture(scene, 'office-bg', this.getOfficeBackgroundSvg(), 1280, 760),
      this.loadSvgTexture(scene, 'publisher-desk', this.getPublisherDeskSvg(false), 210, 190),
      this.loadSvgTexture(scene, 'publisher-desk-typing', this.getPublisherDeskSvg(true), 210, 190),
      this.loadSvgTexture(scene, 'exchange-machine', this.getExchangeMachineSvg(false), 190, 220),
      this.loadSvgTexture(scene, 'exchange-machine-active', this.getExchangeMachineSvg(true), 190, 220),
      this.loadSvgTexture(scene, 'queue-machine', this.getQueueMachineSvg(), 210, 230),
      this.loadSvgTexture(scene, 'consumer-1', this.getConsumerSvg(1, true), 150, 135),
      this.loadSvgTexture(scene, 'consumer-1-idle', this.getConsumerSvg(1, false), 150, 135),
      this.loadSvgTexture(scene, 'consumer-2', this.getConsumerSvg(2, true), 150, 135),
      this.loadSvgTexture(scene, 'consumer-2-idle', this.getConsumerSvg(2, false), 150, 135),
      this.loadSvgTexture(scene, 'consumer-3', this.getConsumerSvg(3, true), 150, 135),
      this.loadSvgTexture(scene, 'consumer-3-idle', this.getConsumerSvg(3, false), 150, 135),
      this.loadSvgTexture(scene, 'robot-bunny', this.getRobotBunnySvg(), 96, 120),
      this.loadSvgTexture(scene, 'sleeping-cat', this.getSleepingCatSvg(), 110, 75),
      this.loadSvgTexture(scene, 'envelope-gold', this.getEnvelopeSvg('#fbbf24', '#f59e0b', '#fef08a'), 42, 32),
      this.loadSvgTexture(scene, 'envelope-dlq', this.getEnvelopeSvg('#ef4444', '#b91c1c', '#fca5a5'), 42, 32),
      this.loadSvgTexture(scene, 'heart-bubble', this.getHeartBubbleSvg(), 44, 42),
      this.loadSvgTexture(scene, 'ack-badge', this.getAckBadgeSvg(), 36, 36),
      this.loadSvgTexture(scene, 'nack-badge', this.getNackBadgeSvg(), 48, 36),
      this.loadSvgTexture(scene, 'dlq-bin', this.getDlqBinSvg(), 110, 95)
    ];

    return Promise.all(promises).then(() => {});
  }

  private static loadSvgTexture(
    scene: Phaser.Scene,
    key: string,
    svgString: string,
    width: number,
    height: number
  ): Promise<void> {
    return new Promise((resolve) => {
      if (scene.textures.exists(key)) {
        resolve();
        return;
      }
      const encoded = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString.trim());
      const img = new Image();
      img.width = width;
      img.height = height;
      img.onload = () => {
        if (!scene.textures.exists(key)) {
          scene.textures.addImage(key, img);
        }
        resolve();
      };
      img.onerror = () => {
        resolve();
      };
      img.src = encoded;
    });
  }

  /**
   * Full Cozy Virtual Office Room Background:
   * - Sunset city window on left with skyscrapers & hanging vines
   * - "Demo Flow" whiteboard
   * - Warm studio back wall with glowing RabbitMQ logo & pendant lamps
   * - Bookshelf with books, plants, and cute white bunny plushie
   * - Warm wooden floor with isometric perspective lines & rugs
   * - Cozy blue lounge sofa with orange pillows & coffee table on bottom right
   */
  private static getOfficeBackgroundSvg(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 760" width="1280" height="760">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3b1d5e"/>
          <stop offset="45%" stop-color="#7c3f8c"/>
          <stop offset="80%" stop-color="#e57373"/>
          <stop offset="100%" stop-color="#ffb74d"/>
        </linearGradient>
        <linearGradient id="wallGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3e3546"/>
          <stop offset="50%" stop-color="#4a3e54"/>
          <stop offset="100%" stop-color="#322a3a"/>
        </linearGradient>
        <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5d4234"/>
          <stop offset="40%" stop-color="#755341"/>
          <stop offset="100%" stop-color="#4e3629"/>
        </linearGradient>
        <linearGradient id="lampGlow" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stop-color="#fde047" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#fde047" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="beltGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#1e3a8a"/>
          <stop offset="50%" stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      <!-- Back Studio Wall -->
      <rect x="0" y="0" width="1280" height="340" fill="url(#wallGrad)"/>

      <!-- Left Sunset City Window -->
      <g transform="translate(0, 20)">
        <rect x="0" y="0" width="290" height="240" fill="url(#skyGrad)" stroke="#271f30" stroke-width="10"/>
        <!-- Sun -->
        <circle cx="195" cy="175" r="38" fill="#fde047" opacity="0.85"/>
        <!-- City Skyscrapers Silhouette -->
        <rect x="15" y="95" width="42" height="140" fill="#2d1946"/>
        <rect x="22" y="105" width="8" height="12" fill="#fbbf24" opacity="0.7"/>
        <rect x="38" y="125" width="8" height="12" fill="#fbbf24" opacity="0.7"/>
        <rect x="62" y="120" width="38" height="115" fill="#392157"/>
        <rect x="108" y="75" width="48" height="160" fill="#241438"/>
        <rect x="116" y="88" width="10" height="8" fill="#38bdf8" opacity="0.6"/>
        <rect x="134" y="110" width="10" height="8" fill="#fbbf24" opacity="0.8"/>
        <rect x="165" y="135" width="36" height="100" fill="#3f245e"/>
        <rect x="215" y="105" width="52" height="130" fill="#2d1946"/>
        <!-- Window Mullions -->
        <line x1="95" y1="0" x2="95" y2="240" stroke="#271f30" stroke-width="8"/>
        <line x1="195" y1="0" x2="195" y2="240" stroke="#271f30" stroke-width="8"/>
        <line x1="0" y1="160" x2="290" y2="160" stroke="#271f30" stroke-width="6"/>
      </g>

      <!-- Hanging Vines & Warm String Lights on Top Left -->
      <g>
        <path d="M250,0 Q265,45 245,85 Q275,65 280,105" stroke="#15803d" stroke-width="14" stroke-linecap="round" fill="none"/>
        <circle cx="255" cy="35" r="14" fill="#22c55e"/>
        <circle cx="248" cy="65" r="12" fill="#16a34a"/>
        <circle cx="272" cy="52" r="13" fill="#4ade80"/>
        <circle cx="85" cy="18" r="5" fill="#fde047" filter="url(#softGlow)"/>
        <circle cx="155" cy="24" r="5" fill="#fde047" filter="url(#softGlow)"/>
        <circle cx="225" cy="16" r="5" fill="#fde047" filter="url(#softGlow)"/>
      </g>

      <!-- Framed Star Poster -->
      <g transform="translate(298, 95)">
        <rect x="0" y="0" width="42" height="54" rx="4" fill="#0f172a" stroke="#64748b" stroke-width="3"/>
        <rect x="6" y="6" width="30" height="42" fill="#0284c7"/>
        <polygon points="21,13 24,22 33,22 26,27 28,36 21,31 14,36 16,27 9,22 18,22" fill="#fde047"/>
      </g>

      <!-- Center Back Wall Panel with Big Glowing RabbitMQ Logo -->
      <g transform="translate(650, 55)">
        <rect x="0" y="0" width="185" height="215" rx="8" fill="#352c3f" stroke="#4c3f5a" stroke-width="4"/>
        <!-- RabbitMQ Orange Icon -->
        <g transform="translate(65, 32)" filter="url(#softGlow)">
          <path d="M0,0 H18 V24 H26 V0 H44 V56 H0 Z" fill="#f97316"/>
          <rect x="24" y="34" width="10" height="10" rx="2" fill="#352c3f"/>
        </g>
        <text x="92" y="122" text-anchor="middle" fill="#ffedd5" font-family="sans-serif" font-weight="800" font-size="24">RabbitMQ</text>
        <text x="92" y="142" text-anchor="middle" fill="#fdba74" font-family="sans-serif" font-weight="600" font-size="11">VIRTUAL OFFICE</text>
      </g>

      <!-- Right Wooden Bookshelf with Books, Plants & Bunny Plushie -->
      <g transform="translate(865, 90)">
        <!-- Shelf Frame -->
        <rect x="0" y="0" width="180" height="220" rx="6" fill="#7c4a2d" stroke="#452715" stroke-width="5"/>
        <rect x="10" y="10" width="160" height="45" fill="#4e2d1a"/>
        <rect x="10" y="65" width="160" height="45" fill="#4e2d1a"/>
        <rect x="10" y="120" width="160" height="45" fill="#4e2d1a"/>
        <rect x="10" y="175" width="160" height="35" fill="#4e2d1a"/>
        <!-- Books Row 1 -->
        <rect x="18" y="20" width="12" height="34" fill="#ef4444"/>
        <rect x="32" y="24" width="14" height="30" fill="#38bdf8"/>
        <rect x="48" y="18" width="11" height="36" fill="#fbbf24"/>
        <rect x="61" y="22" width="14" height="32" fill="#a855f7"/>
        <rect x="95" y="20" width="13" height="34" fill="#22c55e"/>
        <rect x="110" y="25" width="15" height="29" fill="#f97316"/>
        <!-- Books Row 2 -->
        <rect x="22" y="75" width="15" height="34" fill="#3b82f6"/>
        <rect x="39" y="78" width="12" height="31" fill="#ec4899"/>
        <rect x="53" y="72" width="14" height="37" fill="#eab308"/>
        <rect x="105" y="76" width="16" height="33" fill="#14b8a6"/>
        <rect x="123" y="74" width="12" height="35" fill="#f43f5e"/>
        <!-- Cute White Bunny Plushie on Top of Bookshelf -->
        <g transform="translate(125, -44)">
          <ellipse cx="14" cy="14" rx="5" ry="13" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
          <ellipse cx="14" cy="14" rx="2.5" ry="8" fill="#fbcfe8"/>
          <ellipse cx="28" cy="14" rx="5" ry="13" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
          <ellipse cx="28" cy="14" rx="2.5" ry="8" fill="#fbcfe8"/>
          <circle cx="21" cy="30" r="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
          <circle cx="16" cy="28" r="2" fill="#1e293b"/>
          <circle cx="26" cy="28" r="2" fill="#1e293b"/>
          <ellipse cx="13" cy="31" rx="3" ry="1.5" fill="#f472b6"/>
          <ellipse cx="29" cy="31" rx="3" ry="1.5" fill="#f472b6"/>
        </g>
        <!-- Hanging Plant on Left of Shelf -->
        <circle cx="25" cy="-8" r="14" fill="#22c55e"/>
        <circle cx="12" cy="5" r="11" fill="#16a34a"/>
        <circle cx="18" cy="22" r="9" fill="#4ade80"/>
      </g>

      <!-- Warm Pendant Ceiling Lamps -->
      <g transform="translate(510, 0)">
        <line x1="30" y1="0" x2="30" y2="55" stroke="#1e293b" stroke-width="4"/>
        <polygon points="10,55 50,55 62,75 -2,75" fill="#1e293b"/>
        <ellipse cx="30" cy="75" rx="22" ry="6" fill="#fde047" filter="url(#softGlow)"/>
        <polygon points="-2,75 62,75 130,320 -70,320" fill="url(#lampGlow)"/>
      </g>
      <g transform="translate(880, 0)">
        <line x1="30" y1="0" x2="30" y2="45" stroke="#1e293b" stroke-width="4"/>
        <polygon points="10,45 50,45 62,65 -2,65" fill="#1e293b"/>
        <ellipse cx="30" cy="65" rx="22" ry="6" fill="#fde047" filter="url(#softGlow)"/>
        <polygon points="-2,65 62,65 130,310 -70,310" fill="url(#lampGlow)"/>
      </g>

      <!-- Baseboard Molding -->
      <rect x="0" y="332" width="1280" height="14" fill="#261c2c"/>

      <!-- Warm Wooden Floor -->
      <rect x="0" y="344" width="1280" height="416" fill="url(#floorGrad)"/>
      <!-- Floor Plank Lines -->
      <g stroke="#3e291e" stroke-width="2" opacity="0.45">
        <line x1="0" y1="380" x2="1280" y2="380"/>
        <line x1="0" y1="420" x2="1280" y2="420"/>
        <line x1="0" y1="465" x2="1280" y2="465"/>
        <line x1="0" y1="515" x2="1280" y2="515"/>
        <line x1="0" y1="570" x2="1280" y2="570"/>
        <line x1="0" y1="630" x2="1280" y2="630"/>
        <line x1="0" y1="695" x2="1280" y2="695"/>
      </g>

      <!-- Center Floor Mat under Machines -->
      <polygon points="190,460 890,460 960,665 120,665" rx="16" fill="#2d2638" opacity="0.65" stroke="#475569" stroke-width="2"/>

      <!-- Standing "Demo Flow" Whiteboard (Left Back) -->
      <g transform="translate(155, 195)">
        <!-- Legs -->
        <line x1="25" y1="145" x2="15" y2="195" stroke="#64748b" stroke-width="6" stroke-linecap="round"/>
        <line x1="145" y1="145" x2="155" y2="195" stroke="#64748b" stroke-width="6" stroke-linecap="round"/>
        <!-- Board -->
        <rect x="0" y="0" width="170" height="152" rx="8" fill="#fef3c7" stroke="#92400e" stroke-width="7"/>
        <text x="85" y="28" text-anchor="middle" fill="#9a3412" font-family="sans-serif" font-weight="800" font-size="16">Demo Flow</text>
        <line x1="20" y1="36" x2="150" y2="36" stroke="#fdba74" stroke-width="2"/>
        <text x="16" y="60" fill="#15803d" font-family="sans-serif" font-weight="700" font-size="12">✓ Publish Message</text>
        <text x="16" y="84" fill="#15803d" font-family="sans-serif" font-weight="700" font-size="12">✓ Route (Exchange)</text>
        <text x="16" y="108" fill="#15803d" font-family="sans-serif" font-weight="700" font-size="12">✓ Queue (Buffer)</text>
        <text x="16" y="132" fill="#15803d" font-family="sans-serif" font-weight="700" font-size="12">✓ Consume (Process)</text>
      </g>

      <!-- Cozy Lounge Area (Bottom Right: Blue Sofa, Orange Pillow, Coffee Table & Plant) -->
      <g transform="translate(460, 625)">
        <!-- Rug -->
        <ellipse cx="260" cy="95" rx="280" ry="60" fill="#9a6b53" stroke="#7c533e" stroke-width="4" opacity="0.7"/>
        <!-- Blue Sofa -->
        <g transform="translate(0, 25)">
          <rect x="0" y="20" width="245" height="85" rx="14" fill="#1e3a8a" stroke="#172554" stroke-width="4"/>
          <rect x="12" y="4" width="220" height="45" rx="10" fill="#2563eb" stroke="#1e3a8a" stroke-width="3"/>
          <!-- Orange Throw Pillow -->
          <rect x="175" y="12" width="42" height="36" rx="6" transform="rotate(12 195 30)" fill="#f97316" stroke="#c2410c" stroke-width="2"/>
        </g>
        <!-- Coffee Table -->
        <g transform="translate(275, 55)">
          <polygon points="0,20 140,0 185,35 45,55" fill="#b45309" stroke="#78350f" stroke-width="3"/>
          <!-- Orange Book on Table -->
          <polygon points="35,22 65,16 78,28 48,34" fill="#f97316" stroke="#9a3412" stroke-width="1.5"/>
        </g>
        <!-- Potted Green Plant -->
        <g transform="translate(155, -10)">
          <ellipse cx="26" cy="52" rx="16" ry="14" fill="#d97706" stroke="#92400e" stroke-width="3"/>
          <circle cx="26" cy="28" r="16" fill="#16a34a"/>
          <circle cx="14" cy="34" r="12" fill="#22c55e"/>
          <circle cx="38" cy="34" r="12" fill="#15803d"/>
          <circle cx="26" cy="16" r="11" fill="#4ade80"/>
        </g>
      </g>
    </svg>`;
  }

  /**
   * Chibi Publisher Character at Desk:
   * - Cute anime boy with messy dark hair, orange headphones, dark hoodie
   * - Wooden desk with coffee mug, small plant, and monitor showing RabbitMQ icon
   */
  private static getPublisherDeskSvg(isTyping: boolean): string {
    const handOffset = isTyping ? -3 : 0;
    const headBob = isTyping ? 2 : 0;
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 190" width="210" height="190">
      <!-- Shadow -->
      <ellipse cx="105" cy="172" rx="88" ry="16" fill="#000000" opacity="0.35"/>

      <!-- Chair Back -->
      <rect x="20" y="68" width="44" height="58" rx="10" fill="#334155" stroke="#0f172a" stroke-width="3"/>

      <!-- Chibi Boy Character -->
      <g transform="translate(0, ${headBob})">
        <!-- Hoodie Torso -->
        <path d="M36,92 Q62,88 76,112 L72,142 L30,142 Z" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
        <!-- Orange Hoodie Strings & Collar -->
        <path d="M44,94 Q55,104 64,94" fill="#f97316" stroke="#c2410c" stroke-width="2"/>
        <!-- Head -->
        <circle cx="58" cy="64" r="28" fill="#ffedd5" stroke="#431407" stroke-width="3"/>
        <!-- Cute Blush & Eyes -->
        <ellipse cx="50" cy="70" rx="4" ry="2.5" fill="#fb7185" opacity="0.6"/>
        <ellipse cx="74" cy="68" rx="4" ry="2.5" fill="#fb7185" opacity="0.6"/>
        <ellipse cx="57" cy="64" rx="3.5" ry="4.5" fill="#1e293b"/>
        <circle cx="58" cy="62" r="1.5" fill="#ffffff"/>
        <ellipse cx="73" cy="63" rx="3.5" ry="4.5" fill="#1e293b"/>
        <circle cx="74" cy="61" r="1.5" fill="#ffffff"/>
        <!-- Happy Smile -->
        <path d="M62,72 Q66,77 70,72" fill="none" stroke="#431407" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Dark Spiky Anime Hair -->
        <path d="M28,60 Q26,32 58,30 Q86,30 90,56 Q82,44 72,48 Q62,38 50,48 Q38,42 32,62 Z" fill="#1e1b4b" stroke="#0f172a" stroke-width="3"/>
        <!-- Orange Headphones -->
        <path d="M36,58 A24,24 0 0,1 80,52" fill="none" stroke="#f97316" stroke-width="6" stroke-linecap="round"/>
        <ellipse cx="38" cy="65" rx="7" ry="10" fill="#f97316" stroke="#7c2d12" stroke-width="2.5"/>
        <circle cx="38" cy="65" r="3" fill="#fde047"/>
        <!-- Typing Hands -->
        <circle cx="78" cy="${114 + handOffset}" r="6" fill="#ffedd5" stroke="#431407" stroke-width="2.5"/>
        <circle cx="90" cy="${110 - handOffset}" r="6" fill="#ffedd5" stroke="#431407" stroke-width="2.5"/>
      </g>

      <!-- Wooden Isometric Desk -->
      <polygon points="35,126 165,104 202,126 72,148" fill="#d97706" stroke="#78350f" stroke-width="3"/>
      <polygon points="35,126 72,148 72,178 35,156" fill="#92400e" stroke="#451a03" stroke-width="3"/>
      <polygon points="72,148 202,126 202,142 72,164" fill="#b45309" stroke="#451a03" stroke-width="3"/>
      <!-- Desk Legs -->
      <rect x="74" y="156" width="8" height="24" fill="#78350f"/>
      <rect x="184" y="138" width="8" height="24" fill="#78350f"/>

      <!-- Computer Monitor (Back Facing with RabbitMQ Logo) -->
      <g transform="translate(105, 66)">
        <polygon points="0,12 52,0 52,42 0,54" fill="#334155" stroke="#0f172a" stroke-width="3"/>
        <!-- Stand -->
        <polygon points="20,48 32,45 36,58 16,61" fill="#1e293b" stroke="#0f172a" stroke-width="2.5"/>
        <!-- Mini Orange RabbitMQ emblem on monitor back -->
        <rect x="20" y="16" width="12" height="16" rx="2" fill="#f97316"/>
      </g>

      <!-- Orange Coffee Mug -->
      <g transform="translate(65, 118)">
        <rect x="0" y="0" width="14" height="15" rx="3" fill="#f97316" stroke="#7c2d12" stroke-width="2"/>
        <path d="M14,3 Q19,7 14,12" fill="none" stroke="#f97316" stroke-width="2.5"/>
      </g>
    </svg>`;
  }

  /**
   * Industrial Cute Exchange Sorting Machine:
   * - Metallic body with glowing orange intake/outtake portals
   * - Orange intersecting routing arrows icon on the front
   * - Glowing orange/yellow beacon light on top
   */
  private static getExchangeMachineSvg(active: boolean): string {
    const beaconGlow = active ? '#fde047' : '#f97316';
    const beaconRadius = active ? 22 : 14;
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 220" width="190" height="220">
      <defs>
        <radialGradient id="beaconGrad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stop-color="#fef08a" stop-opacity="1"/>
          <stop offset="50%" stop-color="#f97316" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#f97316" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Floor Shadow -->
      <ellipse cx="95" cy="202" rx="82" ry="15" fill="#000000" opacity="0.4"/>

      <!-- Main Machine Chassis (3D Isometric Box) -->
      <rect x="22" y="48" width="146" height="148" rx="12" fill="#475569" stroke="#1e293b" stroke-width="4"/>
      <rect x="28" y="54" width="134" height="136" rx="8" fill="#64748b"/>

      <!-- Top Roof Plate -->
      <polygon points="22,52 52,32 178,32 168,52" fill="#94a3b8" stroke="#1e293b" stroke-width="3.5"/>

      <!-- Top Flashing Beacon Light -->
      <circle cx="96" cy="24" r="${beaconRadius}" fill="url(#beaconGrad)"/>
      <rect x="82" y="30" width="28" height="8" rx="3" fill="#334155" stroke="#0f172a" stroke-width="2"/>
      <path d="M86,30 L88,14 Q96,10 104,14 L106,30 Z" fill="${beaconGlow}" stroke="#c2410c" stroke-width="2.5"/>

      <!-- Header Sign ("Exchange") -->
      <rect x="36" y="62" width="118" height="44" rx="6" fill="#1e293b" stroke="#334155" stroke-width="2.5"/>
      <text x="95" y="83" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-weight="800" font-size="18">Exchange</text>
      <text x="95" y="99" text-anchor="middle" fill="#cbd5e1" font-family="sans-serif" font-size="10">(direct / topic / fanout)</text>

      <!-- Center Routing Display Screen with Orange Crossed Arrows -->
      <rect x="48" y="114" width="94" height="58" rx="6" fill="#0f172a" stroke="#334155" stroke-width="3"/>
      <!-- Crossed Arrows Icon -->
      <g transform="translate(73, 124)" stroke="#f97316" stroke-width="5" stroke-linecap="round" fill="none">
        <line x1="4" y1="6" x2="38" y2="32"/>
        <line x1="4" y1="32" x2="38" y2="6"/>
        <polyline points="30,4 40,6 38,16"/>
        <polyline points="30,34 40,32 38,22"/>
      </g>

      <!-- Left & Right Glowing Conveyor Portals -->
      <rect x="14" y="132" width="14" height="44" rx="4" fill="#f97316" stroke="#7c2d12" stroke-width="2.5"/>
      <rect x="162" y="132" width="14" height="44" rx="4" fill="#f97316" stroke="#7c2d12" stroke-width="2.5"/>

      <!-- Bottom Mechanical Vent -->
      <rect x="54" y="178" width="82" height="12" rx="3" fill="#334155" stroke="#1e293b" stroke-width="2"/>
    </svg>`;
  }

  /**
   * Bright Orange Queue Buffer Storage Machine ("Queue orders.queue")
   * - 2 shelf rows inside where golden envelopes dynamically stack
   */
  private static getQueueMachineSvg(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 230" width="210" height="230">
      <!-- Shadow -->
      <ellipse cx="105" cy="212" rx="92" ry="15" fill="#000000" opacity="0.4"/>

      <!-- Outer Orange Industrial Frame -->
      <rect x="18" y="34" width="174" height="174" rx="14" fill="#ea580c" stroke="#7c2d12" stroke-width="4"/>
      <rect x="24" y="40" width="162" height="162" rx="10" fill="#f97316"/>

      <!-- Top Angled Hood -->
      <polygon points="18,38 46,16 184,16 192,38" fill="#fb923c" stroke="#7c2d12" stroke-width="3.5"/>

      <!-- Header Label ("Queue orders.queue") -->
      <rect x="36" y="48" width="138" height="44" rx="8" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
      <text x="105" y="70" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="800" font-size="19">Queue</text>
      <text x="105" y="85" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="11">(orders.queue)</text>

      <!-- Inner Dark Storage Cavity with 2 Horizontal Shelves -->
      <rect x="34" y="98" width="142" height="94" rx="6" fill="#1e1b2e" stroke="#431407" stroke-width="3.5"/>
      <!-- Shelf Divider 1 -->
      <rect x="34" y="142" width="142" height="7" fill="#78350f" stroke="#451a03" stroke-width="2"/>
      <!-- Shelf Base -->
      <rect x="34" y="185" width="142" height="7" fill="#78350f" stroke="#451a03" stroke-width="2"/>
    </svg>`;
  }

  /**
   * 3 Cute Chibi Consumer Characters at Individual Desks with Laptops:
   * - variant 1: Brown ponytail girl with orange headphones & green top
   * - variant 2: Glasses boy with dark hair & striped shirt
   * - variant 3: Girl with orange cap & headphones
   */
  private static getConsumerSvg(variant: number, active: boolean): string {
    const opacity = active ? '1.0' : '0.45';
    const hairColor = variant === 1 ? '#78350f' : variant === 2 ? '#1e1b4b' : '#92400e';
    const shirtColor = variant === 1 ? '#16a34a' : variant === 2 ? '#3b82f6' : '#ea580c';

    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 135" width="150" height="135" opacity="${opacity}">
      <!-- Floor Shadow -->
      <ellipse cx="75" cy="122" rx="64" ry="11" fill="#000000" opacity="0.35"/>

      <!-- Chibi Character -->
      <g transform="translate(22, 8)">
        ${variant === 1 ? `<ellipse cx="64" cy="28" rx="12" ry="18" fill="${hairColor}" stroke="#271206" stroke-width="2.5"/>` : ''}
        <!-- Torso -->
        <rect x="26" y="54" width="38" height="32" rx="10" fill="${shirtColor}" stroke="#0f172a" stroke-width="2.5"/>
        <!-- Head -->
        <circle cx="45" cy="36" r="22" fill="#ffedd5" stroke="#431407" stroke-width="2.5"/>
        <!-- Hair -->
        <path d="M22,34 Q22,10 45,10 Q68,10 68,34 Q58,22 45,24 Q32,22 22,34 Z" fill="${hairColor}" stroke="#0f172a" stroke-width="2.5"/>
        ${variant === 3 ? `<path d="M22,26 Q45,8 68,26 L74,28 Q45,20 20,28 Z" fill="#f97316" stroke="#7c2d12" stroke-width="2"/>` : ''}
        <!-- Eyes & Glasses -->
        <circle cx="38" cy="38" r="3" fill="#1e293b"/>
        <circle cx="52" cy="38" r="3" fill="#1e293b"/>
        <circle cx="39" cy="37" r="1" fill="#ffffff"/>
        <circle cx="53" cy="37" r="1" fill="#ffffff"/>
        ${variant === 2 ? `
          <circle cx="38" cy="38" r="6" fill="none" stroke="#0f172a" stroke-width="2"/>
          <circle cx="52" cy="38" r="6" fill="none" stroke="#0f172a" stroke-width="2"/>
          <line x1="44" y1="38" x2="46" y2="38" stroke="#0f172a" stroke-width="2"/>
        ` : ''}
        <!-- Blush & Smile -->
        <ellipse cx="32" cy="42" rx="3.5" ry="2" fill="#fb7185" opacity="0.6"/>
        <ellipse cx="58" cy="42" rx="3.5" ry="2" fill="#fb7185" opacity="0.6"/>
        <path d="M42,44 Q45,48 48,44" fill="none" stroke="#431407" stroke-width="2" stroke-linecap="round"/>
        <!-- Orange Headphones -->
        <ellipse cx="23" cy="36" rx="5" ry="8" fill="#f97316" stroke="#7c2d12" stroke-width="2"/>
        <ellipse cx="67" cy="36" rx="5" ry="8" fill="#f97316" stroke="#7c2d12" stroke-width="2"/>
      </g>

      <!-- Wooden Desk -->
      <polygon points="14,82 126,72 142,88 28,98" fill="#d97706" stroke="#78350f" stroke-width="2.5"/>
      <rect x="28" y="94" width="108" height="10" fill="#b45309" stroke="#78350f" stroke-width="2"/>
      <rect x="34" y="104" width="7" height="20" fill="#78350f"/>
      <rect x="122" y="96" width="7" height="24" fill="#78350f"/>

      <!-- Laptop on Desk -->
      <g transform="translate(52, 56)">
        <rect x="0" y="0" width="38" height="26" rx="4" fill="#334155" stroke="#0f172a" stroke-width="2.5"/>
        <!-- Gear Icon on Laptop Lid -->
        <circle cx="19" cy="13" r="5" fill="#4ade80"/>
        <circle cx="19" cy="13" r="2" fill="#334155"/>
      </g>

      <!-- Small Potted Succulent on Desk -->
      <g transform="translate(104, 62)">
        <rect x="2" y="12" width="12" height="10" rx="2" fill="#ea580c" stroke="#7c2d12" stroke-width="1.5"/>
        <circle cx="8" cy="8" r="6" fill="#22c55e" stroke="#14532d" stroke-width="1.5"/>
      </g>
    </svg>`;
  }

  /**
   * Cute White Robot Bunny Mascot holding a Tablet
   */
  private static getRobotBunnySvg(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 120" width="96" height="120">
      <ellipse cx="48" cy="110" rx="28" ry="8" fill="#000000" opacity="0.35"/>
      <!-- Ears -->
      <rect x="24" y="4" width="14" height="34" rx="7" fill="#f8fafc" stroke="#334155" stroke-width="3"/>
      <rect x="28" y="9" width="6" height="22" rx="3" fill="#fb923c"/>
      <rect x="56" y="4" width="14" height="34" rx="7" fill="#f8fafc" stroke="#334155" stroke-width="3"/>
      <rect x="60" y="9" width="6" height="22" rx="3" fill="#fb923c"/>
      <!-- Body -->
      <rect x="28" y="68" width="38" height="34" rx="12" fill="#f8fafc" stroke="#334155" stroke-width="3"/>
      <rect x="38" y="76" width="14" height="14" rx="3" fill="#f97316"/>
      <!-- Feet -->
      <ellipse cx="36" cy="105" rx="8" ry="5" fill="#cbd5e1" stroke="#334155" stroke-width="2.5"/>
      <ellipse cx="58" cy="105" rx="8" ry="5" fill="#cbd5e1" stroke="#334155" stroke-width="2.5"/>
      <!-- Head -->
      <rect x="16" y="30" width="62" height="44" rx="20" fill="#ffffff" stroke="#334155" stroke-width="3"/>
      <!-- Dark Visor Screen -->
      <rect x="24" y="40" width="46" height="24" rx="10" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
      <!-- Glowing Cyan Eyes -->
      <circle cx="37" cy="52" r="5" fill="#38bdf8"/>
      <circle cx="38" cy="50" r="1.8" fill="#ffffff"/>
      <circle cx="57" cy="52" r="5" fill="#38bdf8"/>
      <circle cx="58" cy="50" r="1.8" fill="#ffffff"/>
      <!-- Pink Cheeks -->
      <ellipse cx="29" cy="58" rx="3" ry="1.5" fill="#f472b6"/>
      <ellipse cx="65" cy="58" rx="3" ry="1.5" fill="#f472b6"/>
      <!-- Tablet in Hand -->
      <polygon points="62,74 86,66 90,86 66,94" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    </svg>`;
  }

  /**
   * Cute Sleeping Orange/White Tabby Cat on Round Cushion
   */
  private static getSleepingCatSvg(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 75" width="110" height="75">
      <!-- Cushion -->
      <ellipse cx="55" cy="52" rx="48" ry="18" fill="#d97706" stroke="#78350f" stroke-width="3"/>
      <ellipse cx="55" cy="49" rx="42" ry="14" fill="#f59e0b"/>
      <!-- Curled Cat Body -->
      <ellipse cx="56" cy="42" rx="28" ry="16" fill="#fb923c" stroke="#7c2d12" stroke-width="2.5"/>
      <ellipse cx="52" cy="47" rx="18" ry="9" fill="#ffffff"/>
      <!-- Cat Head -->
      <circle cx="36" cy="38" r="14" fill="#fb923c" stroke="#7c2d12" stroke-width="2.5"/>
      <!-- Ears -->
      <polygon points="24,30 28,18 36,26" fill="#fb923c" stroke="#7c2d12" stroke-width="2"/>
      <polygon points="38,26 46,18 48,30" fill="#fb923c" stroke="#7c2d12" stroke-width="2"/>
      <!-- Closed Sleeping Eyes -->
      <path d="M29,39 Q32,42 35,39" fill="none" stroke="#431407" stroke-width="2" stroke-linecap="round"/>
      <path d="M38,39 Q41,42 44,39" fill="none" stroke="#431407" stroke-width="2" stroke-linecap="round"/>
      <!-- Tail -->
      <path d="M82,44 Q94,38 88,52" fill="none" stroke="#fb923c" stroke-width="6" stroke-linecap="round"/>
    </svg>`;
  }

  /**
   * Golden Glowing Message Envelope / Parcel
   */
  private static getEnvelopeSvg(primary: string, border: string, highlight: string): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 32" width="42" height="32">
      <rect x="2" y="4" width="38" height="25" rx="4" fill="${primary}" stroke="${border}" stroke-width="2.5"/>
      <path d="M3,6 L21,18 L39,6" fill="${highlight}" stroke="${border}" stroke-width="2" stroke-linejoin="round"/>
      <line x1="3" y1="27" x2="15" y2="16" stroke="${border}" stroke-width="1.8"/>
      <line x1="39" y1="27" x2="27" y2="16" stroke="${border}" stroke-width="1.8"/>
    </svg>`;
  }

  private static getHeartBubbleSvg(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 42" width="44" height="42">
      <rect x="2" y="2" width="40" height="32" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
      <polygon points="16,33 24,33 18,40" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
      <path d="M22,26 C22,26 11,19 11,12 C11,8 15,6 18,8 C20,9 22,12 22,12 C22,12 24,9 26,8 C29,6 33,8 33,12 C33,19 22,26 22,26 Z" fill="#ef4444"/>
    </svg>`;
  }

  private static getAckBadgeSvg(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
      <circle cx="18" cy="18" r="15" fill="#10b981" stroke="#065f46" stroke-width="2.5"/>
      <polyline points="11,18 16,23 26,13" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  private static getNackBadgeSvg(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 36" width="48" height="36">
      <rect x="2" y="4" width="44" height="28" rx="8" fill="#ef4444" stroke="#7f1d1d" stroke-width="2.5"/>
      <text x="24" y="22" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="800" font-size="11">NACK</text>
    </svg>`;
  }

  private static getDlqBinSvg(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 95" width="110" height="95">
      <ellipse cx="55" cy="84" rx="48" ry="10" fill="#000000" opacity="0.4"/>
      <rect x="14" y="20" width="82" height="62" rx="8" fill="#7f1d1d" stroke="#450a0a" stroke-width="3"/>
      <rect x="10" y="12" width="90" height="14" rx="5" fill="#dc2626" stroke="#450a0a" stroke-width="2.5"/>
      <text x="55" y="48" text-anchor="middle" fill="#fecaca" font-family="sans-serif" font-weight="800" font-size="13">DEAD LETTER</text>
      <text x="55" y="64" text-anchor="middle" fill="#fca5a5" font-family="monospace" font-size="10">(orders.dlq)</text>
    </svg>`;
  }
}
