// DateTimePicker.tsx
import React, { useState, useEffect } from "react";

type DateTimePickerProps = {
  onEndTimeChange: (timestamp: number) => void;
  minDate?: Date;
  initialDays: number;
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  onEndTimeChange,
  minDate = new Date(),
  initialDays,
}) => {
  // Calculate the default timestamp in a consistent way
  const calculateDefaultTimestamp = (days: number): number => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    // Round to nearest minute to avoid second/millisecond discrepancies
    date.setSeconds(0, 0);
    return date.getTime();
  };

  const defaultTimestamp = calculateDefaultTimestamp(initialDays);

  // Format the dates for input elements
  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  };

  const [selectedDateTime, setSelectedDateTime] = useState(
    formatDateForInput(new Date(defaultTimestamp))
  );

  // Common durations
  const durationOptions = [
    { label: "24 hours", value: "24h", days: 1 },
    { label: "3 days", value: "3d", days: 3 },
    { label: "7 days", value: "7d", days: 7 },
    { label: "14 days", value: "14d", days: 14 },
    { label: "30 days", value: "30d", days: 30 },
    { label: "Custom", value: "custom", days: 0 },
  ];

  // Determine initial duration option based on initialDays prop
  const getInitialDurationOption = () => {
    const matchingOption = durationOptions.find(
      (option) => option.days === initialDays
    );
    return matchingOption ? matchingOption.value : "custom";
  };

  const [durationOption, setDurationOption] = useState(
    getInitialDurationOption()
  );

  // Initialize with proper timestamp
  useEffect(() => {
    // Log the initial timestamp for debugging
    console.log("DateTimePicker initial timestamp:", defaultTimestamp);
    console.log(
      "DateTimePicker formatted date:",
      new Date(defaultTimestamp).toLocaleString()
    );

    // Send initial timestamp to parent
    onEndTimeChange(defaultTimestamp);
  }, []);

  // Handle preset duration selections
  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDurationOption(value);

    if (value !== "custom") {
      const option = durationOptions.find((opt) => opt.value === value);
      if (option) {
        const newTimestamp = calculateDefaultTimestamp(option.days);
        setSelectedDateTime(formatDateForInput(new Date(newTimestamp)));
        console.log("Duration change timestamp:", newTimestamp);
        console.log(
          "Duration change date:",
          new Date(newTimestamp).toLocaleString()
        );
        onEndTimeChange(newTimestamp);
      }
    }
  };

  // Handle date-time input changes
  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDateTime(e.target.value);
    setDurationOption("custom");
    const timestamp = new Date(e.target.value).getTime();
    console.log("Custom date change timestamp:", timestamp);
    console.log(
      "Custom date change date:",
      new Date(timestamp).toLocaleString()
    );
    onEndTimeChange(timestamp);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Listing Duration</label>
        <select
          value={durationOption}
          onChange={handleDurationChange}
          className="w-full p-2 border border-gray-300 rounded-none bg-transparent"
        >
          {durationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {durationOption === "custom" && (
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">
            Custom End Date and Time
          </label>
          <input
            type="datetime-local"
            value={selectedDateTime}
            onChange={handleDateTimeChange}
            min={formatDateForInput(minDate)}
            className="w-full p-2 border border-gray-300 rounded-none bg-transparent"
          />
        </div>
      )}

      <div className="text-sm text-gray-500">
        Your listing will end on {new Date(selectedDateTime).toLocaleString()}
      </div>
    </div>
  );
};
