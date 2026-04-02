"use client";

import { useState } from "react";

const STORAGE_KEY = "cravio.restaurant-id";

function normalizeRestaurantId(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return "";
  }

  return trimmed;
}

export function useRestaurantId(): {
  restaurantId: string;
  setRestaurantId: (value: string) => void;
} {
  const [restaurantId, setRestaurantId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    const normalized = normalizeRestaurantId(stored);
    if (stored !== normalized) {
      if (normalized) {
        window.localStorage.setItem(STORAGE_KEY, normalized);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    return normalized;
  });

  const updateRestaurantId = (value: string) => {
    const normalized = normalizeRestaurantId(value);
    setRestaurantId(normalized);
    if (!normalized) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, normalized);
  };

  return {
    restaurantId,
    setRestaurantId: updateRestaurantId,
  };
}
