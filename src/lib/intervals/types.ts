export type EventCategory =
  | "WORKOUT"
  | "RACE_A"
  | "RACE_B"
  | "RACE_C"
  | "NOTE"
  | "PLAN"
  | "HOLIDAY"
  | "SICK"
  | "INJURED"
  | "SET_EFTP"
  | "FITNESS_DAYS"
  | "SEASON_START"
  | "TARGET"
  | "SET_FITNESS";

export type SportType =
  | "Run"
  | "Ride"
  | "VirtualRide"
  | "Swim"
  | "WeightTraining"
  | "Hike"
  | "Walk"
  | "TrailRun"
  | "VirtualRun";

export type TargetType = "AUTO" | "POWER" | "HR" | "PACE";

export interface CreateEventInput {
  start_date_local: string;
  category: EventCategory;
  type?: SportType;
  name: string;
  description?: string;
  distance?: number;
  moving_time?: number;
  target?: TargetType;
  tags?: string[];
  uid?: string;
  external_id?: string;
  color?: string;
  indoor?: boolean;
}

export interface Event {
  id: number;
  start_date_local: string;
  category: EventCategory;
  type?: string;
  name: string;
  description?: string;
  distance?: number;
  moving_time?: number;
  target?: TargetType;
  tags?: string[];
  uid?: string;
  external_id?: string;
  athlete_id: string;
  icu_training_load?: number;
  icu_atl?: number;
  icu_ctl?: number;
  workout_doc?: Record<string, unknown>;
  color?: string;
  indoor?: boolean;
  end_date_local?: string;
  updated?: string;
}

export interface Athlete {
  id: string;
  name?: string;
  email?: string;
  timezone?: string;
  locale?: string;
}

export interface Interval {
  zone: number;
  average_speed: number;
  moving_time: number;
  distance: number;
  average_heartrate: number;
}

export interface IntervalsDTO {
  icu_intervals: Interval[];
}

export interface Wellness {
  id: string;                    // date string YYYY-MM-DD
  restingHR: number | null;
  hrv: number | null;
  hrvSDNN: number | null;
  sleepSecs: number | null;
  sleepScore: number | null;
  sleepQuality: number | null;
  avgSleepingHR: number | null;
  steps: number | null;
  weight: number | null;
  spO2: number | null;
  ctl: number | null;
  atl: number | null;
  stress: number | null;
  mood: number | null;
  fatigue: number | null;
  soreness: number | null;
  readiness: number | null;
  vo2max: number | null;
  updated: string | null;
}

export interface Activity {
  id: number;
  start_date_local: string;
  type: string;
  name: string;
  distance?: number;          // metres
  moving_time?: number;       // seconds
  elapsed_time?: number;      // seconds
  average_speed?: number;     // m/s
  max_speed?: number;         // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  icu_training_load?: number;
  icu_atl?: number;
  icu_ctl?: number;
  calories?: number;
  perceived_exertion?: number;
}
