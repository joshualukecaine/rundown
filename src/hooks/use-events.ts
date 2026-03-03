"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Event, CreateEventInput } from "@/lib/intervals";

async function fetchEvents(oldest: string, newest: string): Promise<Event[]> {
  const params = new URLSearchParams({ oldest, newest, category: "WORKOUT" });
  const res = await fetch(`/api/events?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
  return res.json();
}

export function useEvents(oldest: string, newest: string) {
  return useQuery({
    queryKey: ["events", oldest, newest],
    queryFn: () => fetchEvents(oldest, newest),
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateEventInput>;
    }) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Failed to update event: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete event: ${res.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
