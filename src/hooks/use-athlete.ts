"use client";

import { useQuery } from "@tanstack/react-query";
import type { Athlete } from "@/lib/intervals";

export function useAthlete() {
  return useQuery({
    queryKey: ["athlete"],
    queryFn: async (): Promise<Athlete> => {
      const res = await fetch("/api/athlete");
      if (!res.ok) throw new Error(`Failed to fetch athlete: ${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
