"use client";

import type { Event } from "@/lib/intervals";
import { useZonePace } from "./use-zone-pace";
import { parseWorkoutDescription, expandWorkoutSteps, getEventDistance } from "@/lib/training-utils";
import { estimateWorkoutDistance } from "@/lib/zone-pace";

interface EstimatedDistance {
  distance: number;
  isEstimated: boolean;
  isLoading: boolean;
}

export function useEstimatedDistance(event: Event | null): EstimatedDistance {
  const sportType = event?.type;
  const { data, isLoading } = useZonePace(sportType);

  if (!event) {
    return { distance: 0, isEstimated: false, isLoading: false };
  }

  // 1. Authoritative distance from API
  if (event.distance && event.distance > 0) {
    return { distance: event.distance, isEstimated: false, isLoading: false };
  }

  // 2. Zone-pace estimate (if we have structured steps + zone data)
  const sections = parseWorkoutDescription(event.description);
  const steps = expandWorkoutSteps(sections);

  if (steps.length > 0 && data?.zonePace) {
    const estimated = estimateWorkoutDistance(steps, data.zonePace);
    if (estimated > 0) {
      return { distance: estimated, isEstimated: true, isLoading: false };
    }
  }

  if (steps.length > 0 && isLoading) {
    return { distance: 0, isEstimated: false, isLoading: true };
  }

  // 3. Fallback: name-parsed distance
  const parsed = getEventDistance(event);
  if (parsed > 0) {
    return { distance: parsed, isEstimated: false, isLoading: false };
  }

  return { distance: 0, isEstimated: false, isLoading: false };
}
