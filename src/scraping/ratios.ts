/**
 * Performance ratio calculators for sailboats and motorboats.
 * Formulas from datacollectionplan.md section 3.5.
 *
 * All inputs in imperial units (feet, pounds, sq ft, knots, litres).
 * Returns null if required inputs are missing.
 */

// ---------------------------------------------------------------------------
// Sailboat Ratios (9 ratios)
// ---------------------------------------------------------------------------

/**
 * SA/Displacement ratio — sail power relative to hull weight.
 * Formula: SA / (Disp_lbs / 64)^0.666
 * <16 = underpowered, >20 = performance
 */
export function saDisplacement(sailAreaSqft: number, displacementLbs: number): number | null {
  if (!sailAreaSqft || !displacementLbs || displacementLbs <= 0) return null;
  return round(sailAreaSqft / Math.pow(displacementLbs / 64, 0.666));
}

/**
 * Ballast/Displacement ratio — stiffness and stability.
 * Formula: (ballast_lbs / disp_lbs) * 100
 * >40 = stiff and stable
 */
export function ballastDisplacement(ballastLbs: number, displacementLbs: number): number | null {
  if (!ballastLbs || !displacementLbs || displacementLbs <= 0) return null;
  return round((ballastLbs / displacementLbs) * 100);
}

/**
 * Displacement/Length ratio — light vs heavy displacement.
 * Formula: (Disp_lbs / 2240) / (0.01 * LWL_ft)^3
 * <100 = ultralight, >350 = ultraheavy
 */
export function displacementLength(displacementLbs: number, lwlFt: number): number | null {
  if (!displacementLbs || !lwlFt || lwlFt <= 0) return null;
  const denominator = Math.pow(0.01 * lwlFt, 3);
  if (denominator === 0) return null;
  return round(displacementLbs / 2240 / denominator);
}

/**
 * Comfort Ratio (Ted Brewer) — motion comfort offshore.
 * Formula: D / (0.65 * (0.7*LWL + 0.3*LOA) * Beam^1.33)
 * Higher = more comfortable
 */
export function comfortRatio(
  displacementLbs: number,
  lwlFt: number,
  loaFt: number,
  beamFt: number,
): number | null {
  if (!displacementLbs || !lwlFt || !loaFt || !beamFt) return null;
  const denominator = 0.65 * (0.7 * lwlFt + 0.3 * loaFt) * Math.pow(beamFt, 1.33);
  if (denominator === 0) return null;
  return round(displacementLbs / denominator);
}

/**
 * Capsize Screening Factor (CSF) — blue-water safety.
 * Formula: Beam / (Disp_lbs / 64)^0.333
 * <2.0 = blue-water capable. Lower = safer.
 */
export function capsizeScreening(beamFt: number, displacementLbs: number): number | null {
  if (!beamFt || !displacementLbs || displacementLbs <= 0) return null;
  return round(beamFt / Math.pow(displacementLbs / 64, 0.333));
}

/**
 * Hull Speed — theoretical max displacement speed.
 * Formula: 1.34 * sqrt(LWL_ft)
 */
export function hullSpeed(lwlFt: number): number | null {
  if (!lwlFt || lwlFt <= 0) return null;
  return round(1.34 * Math.sqrt(lwlFt));
}

/**
 * S# Score — overall speed score combining power and weight.
 * Formula: sqrt(SA/Disp) / (D/L)^0.333
 */
export function sNumber(
  sailAreaSqft: number,
  displacementLbs: number,
  lwlFt: number,
): number | null {
  const saDisp = saDisplacement(sailAreaSqft, displacementLbs);
  const dL = displacementLength(displacementLbs, lwlFt);
  if (saDisp === null || dL === null || dL <= 0) return null;
  return round(Math.sqrt(saDisp) / Math.pow(dL, 0.333));
}

/**
 * LWL/LOA Ratio — waterline efficiency.
 * Formula: LWL / LOA
 * Higher = more hull in the water.
 */
export function lwlLoaRatio(lwlFt: number, loaFt: number): number | null {
  if (!lwlFt || !loaFt || loaFt <= 0) return null;
  return round(lwlFt / loaFt);
}

/**
 * Pounds per Inch Immersion (PPI) — sensitivity to added weight.
 * Formula: (LWL * Beam * 0.75) / 420
 */
export function poundsPerInch(lwlFt: number, beamFt: number): number | null {
  if (!lwlFt || !beamFt) return null;
  return round((lwlFt * beamFt * 0.75) / 420);
}

// ---------------------------------------------------------------------------
// Motorboat Ratios (3 ratios)
// ---------------------------------------------------------------------------

/**
 * Power/Weight Ratio — HP per tonne.
 * Formula: engine_hp / (disp_kg / 1000)
 */
export function powerWeightRatio(engineHp: number, displacementKg: number): number | null {
  if (!engineHp || !displacementKg || displacementKg <= 0) return null;
  return round(engineHp / (displacementKg / 1000));
}

/**
 * Fuel Range — operational range at cruise speed.
 * Formula: (tank_l / burn_lph) * cruise_kts
 */
export function fuelRange(tankLitres: number, burnLph: number, cruiseKts: number): number | null {
  if (!tankLitres || !burnLph || !cruiseKts || burnLph <= 0) return null;
  return round((tankLitres / burnLph) * cruiseKts);
}

/**
 * Speed/Length Ratio — hull efficiency relative to waterline.
 * Formula: cruise_kts / sqrt(LWL_ft)
 */
export function speedLengthRatio(cruiseKts: number, lwlFt: number): number | null {
  if (!cruiseKts || !lwlFt || lwlFt <= 0) return null;
  return round(cruiseKts / Math.sqrt(lwlFt));
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/** Input fields for calculating all sailboat ratios. */
export interface SailboatRatioInput {
  sailAreaTotalSqft?: number;
  displacementLbs?: number;
  ballastLbs?: number;
  lwlFt?: number;
  loaFt?: number;
  beamFt?: number;
}

/** All calculated sailboat ratios. */
export interface SailboatRatios {
  saDisplacement: number | null;
  ballastDisplacement: number | null;
  displacementLength: number | null;
  comfortRatio: number | null;
  capsizeScreening: number | null;
  hullSpeedKts: number | null;
  sNumber: number | null;
  lwlLoaRatio: number | null;
  poundsPerInch: number | null;
}

/**
 * Calculates all 9 sailboat ratios from raw model dimensions.
 */
export function calculateSailboatRatios(input: SailboatRatioInput): SailboatRatios {
  const sa = input.sailAreaTotalSqft ?? 0;
  const disp = input.displacementLbs ?? 0;
  const ballast = input.ballastLbs ?? 0;
  const lwl = input.lwlFt ?? 0;
  const loa = input.loaFt ?? 0;
  const beam = input.beamFt ?? 0;

  return {
    saDisplacement: saDisplacement(sa, disp),
    ballastDisplacement: ballastDisplacement(ballast, disp),
    displacementLength: displacementLength(disp, lwl),
    comfortRatio: comfortRatio(disp, lwl, loa, beam),
    capsizeScreening: capsizeScreening(beam, disp),
    hullSpeedKts: hullSpeed(lwl),
    sNumber: sNumber(sa, disp, lwl),
    lwlLoaRatio: lwlLoaRatio(lwl, loa),
    poundsPerInch: poundsPerInch(lwl, beam),
  };
}

/** Input fields for calculating motorboat ratios. */
export interface MotorboatRatioInput {
  engineHp?: number;
  displacementKg?: number;
  fuelTankLitres?: number;
  fuelBurnLph?: number;
  cruiseSpeedKts?: number;
  lwlFt?: number;
}

/** All calculated motorboat ratios. */
export interface MotorboatRatios {
  powerWeightRatio: number | null;
  fuelRangeNm: number | null;
  speedLengthRatio: number | null;
}

/**
 * Calculates all 3 motorboat ratios from raw specs.
 */
export function calculateMotorboatRatios(input: MotorboatRatioInput): MotorboatRatios {
  return {
    powerWeightRatio: powerWeightRatio(input.engineHp ?? 0, input.displacementKg ?? 0),
    fuelRangeNm: fuelRange(
      input.fuelTankLitres ?? 0,
      input.fuelBurnLph ?? 0,
      input.cruiseSpeedKts ?? 0,
    ),
    speedLengthRatio: speedLengthRatio(input.cruiseSpeedKts ?? 0, input.lwlFt ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Rounds to 2 decimal places. */
function round(num: number): number {
  return Math.round(num * 100) / 100;
}
