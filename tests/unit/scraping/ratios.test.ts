import { describe, it, expect } from 'vitest';
import {
  saDisplacement,
  ballastDisplacement,
  displacementLength,
  comfortRatio,
  capsizeScreening,
  hullSpeed,
  sNumber,
  lwlLoaRatio,
  poundsPerInch,
  powerWeightRatio,
  fuelRange,
  speedLengthRatio,
  calculateSailboatRatios,
  calculateMotorboatRatios,
} from '../../../src/scraping/ratios.js';

describe('Sailboat Ratios', () => {
  // Example boat: Beneteau Oceanis 40.1
  // SA=722sqft, Disp=18,739lbs, Ballast=5,291lbs, LWL=35.42ft, LOA=39.37ft, Beam=13.29ft

  describe('saDisplacement', () => {
    it('calculates SA/Displacement ratio', () => {
      const result = saDisplacement(722, 18739);
      expect(result).not.toBeNull();
      // Expected ~16-18 range for a cruiser-racer
      expect(result!).toBeGreaterThan(14);
      expect(result!).toBeLessThan(20);
    });

    it('returns null for zero/missing inputs', () => {
      expect(saDisplacement(0, 18739)).toBeNull();
      expect(saDisplacement(722, 0)).toBeNull();
    });
  });

  describe('ballastDisplacement', () => {
    it('calculates ballast/displacement percentage', () => {
      const result = ballastDisplacement(5291, 18739);
      expect(result).not.toBeNull();
      // 5291/18739 * 100 ≈ 28.24%
      expect(result!).toBeCloseTo(28.24, 0);
    });
  });

  describe('displacementLength', () => {
    it('calculates displacement/length ratio', () => {
      const result = displacementLength(18739, 35.42);
      expect(result).not.toBeNull();
      // Expected ~188 for a moderate displacement cruiser
      expect(result!).toBeGreaterThan(150);
      expect(result!).toBeLessThan(250);
    });
  });

  describe('comfortRatio', () => {
    it('calculates Ted Brewer comfort ratio', () => {
      const result = comfortRatio(18739, 35.42, 39.37, 13.29);
      expect(result).not.toBeNull();
      // Typical cruiser: 20-40 range
      expect(result!).toBeGreaterThan(15);
      expect(result!).toBeLessThan(50);
    });
  });

  describe('capsizeScreening', () => {
    it('calculates capsize screening factor', () => {
      const result = capsizeScreening(13.29, 18739);
      expect(result).not.toBeNull();
      // <2.0 = blue-water capable
      expect(result!).toBeGreaterThan(1);
      expect(result!).toBeLessThan(3);
    });
  });

  describe('hullSpeed', () => {
    it('calculates theoretical hull speed', () => {
      const result = hullSpeed(35.42);
      expect(result).not.toBeNull();
      // 1.34 * sqrt(35.42) ≈ 7.97 kts
      expect(result!).toBeCloseTo(7.97, 1);
    });
  });

  describe('sNumber', () => {
    it('calculates S# speed score', () => {
      const result = sNumber(722, 18739, 35.42);
      expect(result).not.toBeNull();
      // Typical cruiser: 0.5-1.5
      expect(result!).toBeGreaterThan(0.3);
      expect(result!).toBeLessThan(2);
    });
  });

  describe('lwlLoaRatio', () => {
    it('calculates LWL/LOA ratio', () => {
      const result = lwlLoaRatio(35.42, 39.37);
      expect(result).not.toBeNull();
      // 35.42/39.37 ≈ 0.90
      expect(result!).toBeCloseTo(0.9, 1);
    });
  });

  describe('poundsPerInch', () => {
    it('calculates PPI', () => {
      const result = poundsPerInch(35.42, 13.29);
      expect(result).not.toBeNull();
      expect(result!).toBeGreaterThan(0);
    });
  });

  describe('calculateSailboatRatios', () => {
    it('calculates all 9 ratios at once', () => {
      const result = calculateSailboatRatios({
        sailAreaTotalSqft: 722,
        displacementLbs: 18739,
        ballastLbs: 5291,
        lwlFt: 35.42,
        loaFt: 39.37,
        beamFt: 13.29,
      });

      expect(result.saDisplacement).not.toBeNull();
      expect(result.ballastDisplacement).not.toBeNull();
      expect(result.displacementLength).not.toBeNull();
      expect(result.comfortRatio).not.toBeNull();
      expect(result.capsizeScreening).not.toBeNull();
      expect(result.hullSpeedKts).not.toBeNull();
      expect(result.sNumber).not.toBeNull();
      expect(result.lwlLoaRatio).not.toBeNull();
      expect(result.poundsPerInch).not.toBeNull();
    });

    it('returns nulls when data is missing', () => {
      const result = calculateSailboatRatios({});

      expect(result.saDisplacement).toBeNull();
      expect(result.hullSpeedKts).toBeNull();
    });
  });
});

describe('Motorboat Ratios', () => {
  describe('powerWeightRatio', () => {
    it('calculates HP per tonne', () => {
      const result = powerWeightRatio(300, 5000);
      expect(result).not.toBeNull();
      // 300 / (5000/1000) = 60 HP/tonne
      expect(result!).toBe(60);
    });
  });

  describe('fuelRange', () => {
    it('calculates operational range', () => {
      const result = fuelRange(500, 25, 22);
      expect(result).not.toBeNull();
      // (500/25) * 22 = 440 nm
      expect(result!).toBe(440);
    });
  });

  describe('speedLengthRatio', () => {
    it('calculates speed/length ratio', () => {
      const result = speedLengthRatio(22, 30);
      expect(result).not.toBeNull();
      // 22 / sqrt(30) ≈ 4.02
      expect(result!).toBeCloseTo(4.02, 1);
    });
  });

  describe('calculateMotorboatRatios', () => {
    it('calculates all 3 ratios', () => {
      const result = calculateMotorboatRatios({
        engineHp: 300,
        displacementKg: 5000,
        fuelTankLitres: 500,
        fuelBurnLph: 25,
        cruiseSpeedKts: 22,
        lwlFt: 30,
      });

      expect(result.powerWeightRatio).toBe(60);
      expect(result.fuelRangeNm).toBe(440);
      expect(result.speedLengthRatio).not.toBeNull();
    });
  });
});
