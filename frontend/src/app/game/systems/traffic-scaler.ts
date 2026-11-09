/**
 * Scaler that maps actual RabbitMQ message rates to rendered visual parcel animations.
 * Ensures the scene stays smooth (target 60 FPS) and doesn't drown in thousands of sprites.
 */
export class TrafficScaler {
  /**
   * Calculates how many visual parcels to spawn per second.
   * Uses a dampened non-linear curve: min(20, log2(rate + 1) * 3.5)
   */
  static getSpawnRatePerSecond(msgRate: number, speedMultiplier: number = 1.0): number {
    if (msgRate <= 0) return 0;
    const visualRate = Math.min(18, Math.log2(msgRate + 1) * 3.2);
    return Math.max(0.5, visualRate * speedMultiplier);
  }

  /**
   * Calculates the visual height of stacked parcels on a queue shelf.
   * Max shelf capacity visual slots: 16
   */
  static getVisualShelfCount(backlogTotal: number): number {
    if (backlogTotal <= 0) return 0;
    if (backlogTotal <= 4) return backlogTotal;
    if (backlogTotal <= 20) return 4 + Math.floor((backlogTotal - 4) / 4);
    if (backlogTotal <= 100) return 8 + Math.floor((backlogTotal - 20) / 16);
    return Math.min(16, 12 + Math.floor((backlogTotal - 100) / 100));
  }
}
