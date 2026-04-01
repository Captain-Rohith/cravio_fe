"use client";

import { useState } from "react";

const STORAGE_KEY = "cravio.restaurant-id";

export function useRestaurantId(): {
  restaurantId: string;
  setRestaurantId: (value: string) => void;
} {
  const [restaurantId, setRestaurantId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  });

  const updateRestaurantId = (value: string) => {
    setRestaurantId(value);
    if (!value) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, value);
  };

  return {
    restaurantId,
    setRestaurantId: updateRestaurantId,
  };
}
