import { pgTable, uuid, numeric, timestamp } from 'drizzle-orm/pg-core';
import { boatModels } from './boat-models.js';

/**
 * Calculated ratios table — derived performance metrics per boat model.
 * Computed at ingest time from raw dimensions. One row per boat_model.
 * These make NauticFinder intelligent — exposing analysis no competitor provides.
 */
export const calculatedRatios = pgTable(
  'calculated_ratios',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    modelId: uuid('model_id')
      .references(() => boatModels.id, { onDelete: 'cascade' })
      .notNull(),

    // -- Sailboat ratios --
    /** SA / Displacement: <16 underpowered, >20 performance */
    saDisplacement: numeric('sa_displacement'),
    /** Ballast / Displacement %: >40 = stiff and stable */
    ballastDisplacement: numeric('ballast_displacement'),
    /** Displacement / Length: <100 ultralight, >350 ultraheavy */
    displacementLength: numeric('displacement_length'),
    /** Ted Brewer Comfort Ratio: motion comfort offshore */
    comfortRatio: numeric('comfort_ratio'),
    /** Capsize Screening Factor: <2.0 = blue-water capable */
    capsizeScreening: numeric('capsize_screening'),
    /** Hull speed in knots: 1.34 * sqrt(LWL) */
    hullSpeedKts: numeric('hull_speed_kts'),
    /** S# overall speed score combining power and weight */
    sNumber: numeric('s_number'),
    /** LWL / LOA ratio: waterline efficiency */
    lwlLoaRatio: numeric('lwl_loa_ratio'),
    /** Pounds per inch immersion */
    poundsPerInch: numeric('pounds_per_inch'),

    // -- Motorboat ratios --
    /** HP per tonne: raw performance indicator */
    powerWeightRatio: numeric('power_weight_ratio'),
    /** Range at cruise speed in nautical miles */
    fuelRangeNm: numeric('fuel_range_nm'),
    /** Cruise speed / sqrt(LWL): hull efficiency */
    speedLengthRatio: numeric('speed_length_ratio'),

    // -- Metadata --
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
  },
);
