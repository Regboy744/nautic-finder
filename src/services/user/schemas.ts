import { z } from 'zod';

export const updateProfileBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'expert']).optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
  notificationSettings: z.record(z.string(), z.unknown()).optional(),
});

export const saveBoatBodySchema = z.object({
  listingId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const createAlertBodySchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.record(z.string(), z.unknown()).optional(),
  keywords: z.string().max(500).optional(),
  frequency: z.enum(['instant', 'daily', 'weekly']).default('daily'),
  isActive: z.boolean().default(true),
});

export const updateAlertBodySchema = createAlertBodySchema.partial();
