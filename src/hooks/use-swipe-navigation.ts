"use client";

import { useCallback, useRef } from "react";

/** 最小水平位移（px），低于此值不触发切题 */
const SWIPE_MIN_DISTANCE_PX = 56;

/** 水平位移须大于垂直位移的倍数，避免与上下滚动冲突 */
const SWIPE_HORIZONTAL_RATIO = 1.25;

type TouchPoint = {
  x: number;
  y: number;
  id: number;
};

type UseSwipeNavigationOptions = {
  enabled: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

export function useSwipeNavigation({
  enabled,
  onSwipeLeft,
  onSwipeRight,
}: UseSwipeNavigationOptions) {
  const touchStartRef = useRef<TouchPoint | null>(null);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled) return;

      const touch = event.touches[0];
      if (!touch) return;

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier,
      };
    },
    [enabled]
  );

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !touchStartRef.current) return;

      const touch = Array.from(event.changedTouches).find(
        (item) => item.identifier === touchStartRef.current?.id
      );
      if (!touch) return;

      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx < SWIPE_MIN_DISTANCE_PX) return;
      if (absDx < absDy * SWIPE_HORIZONTAL_RATIO) return;

      if (dx < 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    },
    [enabled, onSwipeLeft, onSwipeRight]
  );

  const onTouchCancel = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  return { onTouchStart, onTouchEnd, onTouchCancel };
}
