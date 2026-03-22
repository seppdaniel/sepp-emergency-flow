import { z } from 'zod';

export const VALID_EMERGENCY_TYPES = [
  'heart_attack',
  'stroke',
  'accident',
  'breathing_problem',
  'severe_bleeding',
] as const;

export const emergencyTypeSchema = z.enum(VALID_EMERGENCY_TYPES);

export const userLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const hospitalSchema = z.object({
  id: z.string(),
  name: z.string(),
  distance: z.number().min(0).max(500),
  estimatedTime: z.number().min(0).max(999),
  beds: z.number().int().min(0).max(10000),
  occupancy: z.number().min(0).max(1),
  specialties: z.array(emergencyTypeSchema),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const decisionRequestSchema = z.object({
  emergencyType: emergencyTypeSchema,
  userLocation: userLocationSchema.optional(),
  hospitals: z.array(hospitalSchema).optional(),
});

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type DecisionRequest = z.infer<typeof decisionRequestSchema>;
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
