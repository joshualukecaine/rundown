"use client";

import { useQuery } from "@tanstack/react-query";
import type { ZonePaceMap } from "@/lib/zone-pace";

interface ZonePaceResponse {
  zonePace: ZonePaceMap;
  activityCount: number;
}

async function fetchZonePace(sportType: string): Promise<ZonePaceResponse> {
  const params = new URLSearchParams({ sportType });
  const res = await fetch(`/api/zone-pace?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch zone pace: ${res.status}`);
  return res.json();
}

export function useZonePace(sportType: string | undefined) {
  return useQuery({
    queryKey: ["zone-pace", sportType],
    queryFn: () => fetchZonePace(sportType!),
    enabled: !!sportType,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
