import { z } from "zod";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const EVENT_CATEGORIES = [
  "WORKOUT", "RACE_A", "RACE_B", "RACE_C", "NOTE", "PLAN",
  "HOLIDAY", "SICK", "INJURED", "SET_EFTP", "FITNESS_DAYS",
  "SEASON_START", "TARGET", "SET_FITNESS",
] as const;

export const EventQuerySchema = z.object({
  oldest: z.string().regex(ISO_DATE, "oldest must be YYYY-MM-DD").optional(),
  newest: z.string().regex(ISO_DATE, "newest must be YYYY-MM-DD").optional(),
  category: z.string().optional(),
});

export const CreateEventSchema = z.object({
  start_date_local: z.string().min(10, "start_date_local is required"),
  category: z.enum(EVENT_CATEGORIES),
  name: z.string().min(1, "name is required"),
  type: z.enum(["Run", "Ride", "VirtualRide", "Swim", "WeightTraining", "Hike", "Walk", "TrailRun", "VirtualRun"]).optional(),
  description: z.string().optional(),
  distance: z.number().nonnegative().optional(),
  moving_time: z.number().nonnegative().optional(),
  target: z.enum(["AUTO", "POWER", "HR", "PACE"]).optional(),
  tags: z.array(z.string()).optional(),
  uid: z.string().optional(),
  external_id: z.string().optional(),
  color: z.string().optional(),
  indoor: z.boolean().optional(),
});

export const UpdateEventSchema = CreateEventSchema.partial();

export const WellnessQuerySchema = z.object({
  oldest: z.string().regex(ISO_DATE, "oldest must be YYYY-MM-DD").optional(),
  newest: z.string().regex(ISO_DATE, "newest must be YYYY-MM-DD").optional(),
});

export const BulkCreateSchema = z.array(CreateEventSchema).min(1, "at least one event required");
