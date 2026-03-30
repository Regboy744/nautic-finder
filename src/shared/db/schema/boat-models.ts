import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Boat models table — static specifications collected once per production model.
 * E.g., "Beneteau Oceanis 40.1" has fixed dimensions, sail area, designer, etc.
 * Listings link to this via nullable FK. Custom/unknown boats have model_id = NULL.
 */
export const boatModels = pgTable(
  'boat_models',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // -- Identity --
    make: text('make').notNull(),
    modelName: text('model_name').notNull(),
    boatType: text('boat_type').notNull(),
    subtype: text('subtype'),

    // -- Dimensions --
    loaFt: numeric('loa_ft'),
    lwlFt: numeric('lwl_ft'),
    beamFt: numeric('beam_ft'),
    draftMaxFt: numeric('draft_max_ft'),
    draftMinFt: numeric('draft_min_ft'),
    displacementLbs: numeric('displacement_lbs'),
    displacementKg: numeric('displacement_kg'),
    ballastLbs: numeric('ballast_lbs'),
    freeboardFt: numeric('freeboard_ft'),
    airDraftFt: numeric('air_draft_ft'),

    // -- Hull & Construction --
    hullType: text('hull_type'),
    hullMaterial: text('hull_material'),
    deckMaterial: text('deck_material'),
    constructionNotes: text('construction_notes'),

    // -- Production --
    firstBuilt: integer('first_built'),
    lastBuilt: integer('last_built'),
    designer: text('designer'),
    builder: text('builder'),

    // -- Sailing-specific (nullable, only for sailboats) --
    rigType: text('rig_type'),
    sailAreaMainSqft: numeric('sail_area_main_sqft'),
    sailAreaJibSqft: numeric('sail_area_jib_sqft'),
    sailAreaTotalSqft: numeric('sail_area_total_sqft'),
    iSparFt: numeric('i_spar_ft'),
    jSparFt: numeric('j_spar_ft'),
    pSparFt: numeric('p_spar_ft'),
    eSparFt: numeric('e_spar_ft'),
    mastMaterial: text('mast_material'),
    keelType: text('keel_type'),
    keelMaterial: text('keel_material'),
    rudderType: text('rudder_type'),
    cockpitType: text('cockpit_type'),

    // -- Motor-specific (nullable, only for motorboats) --
    hullForm: text('hull_form'),
    engineCountDefault: integer('engine_count_default'),
    driveTypeDefault: text('drive_type_default'),
    fuelTypeDefault: text('fuel_type_default'),
    maxSpeedKts: numeric('max_speed_kts'),
    cruiseSpeedKts: numeric('cruise_speed_kts'),

    // -- Common interior --
    headroomM: numeric('headroom_m'),
    berthsDefault: integer('berths_default'),
    headsDefault: integer('heads_default'),
    waterTankL: numeric('water_tank_l'),
    fuelTankL: numeric('fuel_tank_l'),

    // -- Metadata --
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('boat_models_make_model_idx').on(table.make, table.modelName),
  ],
);
