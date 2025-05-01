import { useEffect, useState } from "react";
import { getTimeRemaining } from "@/utils/web2";

export function useCountdown(endTime: number | undefined): string {
  const [timeRemaining, setTimeRemaining] = useState<string>(() => {
    if (!endTime) return "No deadline";
    return getTimeRemaining(endTime);
  });

  useEffect(() => {
    if (!endTime) return;

    const updateTimer = () => {
      setTimeRemaining(getTimeRemaining(endTime));
    };

    // Update every second
    const timer = setInterval(updateTimer, 1000);

    // Cleanup
    return () => clearInterval(timer);
  }, [endTime]);

  return timeRemaining;
}
