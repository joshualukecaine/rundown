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
