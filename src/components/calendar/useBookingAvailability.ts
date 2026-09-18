import React, { useState, useEffect, useMemo, useRef } from "react";
import { slotsWithContinuousTime } from "./continuousTime";
import type {
  Employee,
  Slot,
  SlotGroup,
  RawSlot,
  UseBookingAvailabilityArgs,
} from "./types";

export const DAYS_PER_PAGE = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function normalizeDate(date: Date | string | number): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function monthsAhead(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  );
}

function toCalendarEvents(arrayOfEvents: RawSlot[]): Slot[] {
  if (!arrayOfEvents) return [];
  return arrayOfEvents.map((event) => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
  }));
}

function sortByStartTime(slots: Slot[]): Slot[] {
  return [...slots].sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Maps employee ID to the live employee list from the DB to get 
 * their current name and color dynamically.
 */
function withEmployeeInfo(slots: Slot[], employees: Employee[]): Slot[] {
  return slots.map((slot) => {
    // Find the current live details of the professional
    const match = employees.find((emp) => emp.id === slot.employeeId);
    return {
      ...slot,
      employeeName: match ? match.name : "Professional",
      employeeColor: match ? match.color : "#111111" // Fallback to theme primary
    };
  });
}

interface PeriodDefinition {
  key: string;
  label: string;
  startHour: number;
  endHour: number;
}

const PERIOD_DEFINITIONS: PeriodDefinition[] = [
  { key: "morning", label: "Morning", startHour: 0, endHour: 12 },
  { key: "afternoon", label: "Afternoon", startHour: 12, endHour: 17 },
  { key: "evening", label: "Evening", startHour: 17, endHour: 24 },
];

export function groupSlotsByPeriod(slots: Slot[]): SlotGroup[] {
  return PERIOD_DEFINITIONS.map(({ key, label, startHour, endHour }) => ({
    key,
    label,
    slots: slots.filter((slot) => {
      const hour = slot.start.getHours();
      return hour >= startHour && hour < endHour;
    }),
  })).filter((group) => group.slots.length > 0);
}

export default function useBookingAvailability({
  firebase,
  employees,
  onSlotClicked,
  requiredMinutes,
}: UseBookingAvailabilityArgs) {
  const [today] = useState(() => normalizeDate(new Date()));

  const [monthFetchingOffset, setMonthFetchingOffset] = useState(2);
  const [employee, setEmployee] = useState<null | Employee>(null); // "" / "null" = no filter
  const [eventsToDisplay, setEventsToDisplay] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayWindowStart, setDayWindowStart] = useState(0);

  const autoSelectedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = firebase.subscribeToFreeAppointments(
      today.getFullYear(),
      today.getMonth(),
      monthFetchingOffset,
      (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const newEvents: RawSlot[] = [];
          Object.keys(val).forEach((monthlyKey) => {
            const thisMonthEvents = val[monthlyKey];
            Object.keys(thisMonthEvents).forEach((key) => {
              newEvents.push({ ...thisMonthEvents[key] });
            });
          });
          setEventsToDisplay(toCalendarEvents(newEvents));
        }
      },
    );
    return () => unsubscribe();
  }, [firebase, monthFetchingOffset, today]);

  // Booked slots come out before runs are built, so one can't bridge two
  // open stretches into a run that isn't really free.
  const bookableSlots = useMemo(
    () =>
      slotsWithContinuousTime(
        eventsToDisplay.filter((event) => !event.extra?.status),
        requiredMinutes,
      ),
    [eventsToDisplay, requiredMinutes],
  );

  /**
   * Filters slots matching the selected date and active employeeId. Every
   * per-day view — the chips' dots, the picker's disabled dates, the
   * earliest-time tooltip — goes through here, so they all honour
   * `requiredMinutes` too.
   */
  const getSlotsForDate = (date: Date, employee: Employee | null): Slot[] => {
    return bookableSlots.filter((event) => {
      if (!isSameDay(event.start, date)) return false;
      return !employee?.id || event.employeeId === employee.id;
    });
  };

  const dayHasOpening = (date: Date): boolean => getSlotsForDate(date, employee).length > 0;

  const getEarliestSlotForDate = (date: Date): Slot | null => {
    const slots = getSlotsForDate(date, employee);
    if (slots.length === 0) return null;
    return slots.reduce((earliest, slot) =>
      slot.start < earliest.start ? slot : earliest,
    );
  };

  const selectDate = (date: Date) => {
    const normalized = normalizeDate(date);
    const diffDays = Math.round(
      (normalized.getTime() - today.getTime()) / MS_PER_DAY,
    );
    const page = Math.max(
      0,
      Math.floor(diffDays / DAYS_PER_PAGE) * DAYS_PER_PAGE,
    );
    setDayWindowStart(page);
    setSelectedDate(normalized);
  };

  useEffect(() => {
    if (autoSelectedRef.current || eventsToDisplay.length === 0) return;
    const SCAN_WINDOW_DAYS = 60;
    const firstOpenDay = Array.from({ length: SCAN_WINDOW_DAYS }, (_, i) => addDays(today, i)).find(dayHasOpening);
    // Nothing open — typically a cart too long for any run of free time.
    // Landing on today shows the "no openings" message; leaving nothing
    // selected would sit on "Loading availability…" for good.
    selectDate(firstOpenDay ?? today);
    autoSelectedRef.current = true;
  }, [eventsToDisplay, employee]);

  const visibleDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < DAYS_PER_PAGE; i += 1)
      days.push(addDays(today, dayWindowStart + i));
    return days;
  }, [today, dayWindowStart]);

  useEffect(() => {
    const lastVisibleDay = addDays(today, dayWindowStart + DAYS_PER_PAGE - 1);
    const offset = monthsAhead(today, lastVisibleDay);
    setMonthFetchingOffset((prev) => (offset >= prev ? offset + 1 : prev));
  }, [dayWindowStart, today]);

  const goToNextDayWindow = () =>
    setDayWindowStart((prev) => prev + DAYS_PER_PAGE);
  const goToPrevDayWindow = () =>
    setDayWindowStart((prev) => Math.max(0, prev - DAYS_PER_PAGE));
  const canGoPrevDayWindow = dayWindowStart > 0;

  const handleCalendarMonthChange = (visibleMonth: Date) => {
    const offset = monthsAhead(today, visibleMonth);
    setMonthFetchingOffset((prev) => (offset >= prev ? offset + 1 : prev));
  };

  const shouldDisableCalendarDate = (date: Date): boolean => {
    const normalized = normalizeDate(date);
    if (monthsAhead(today, normalized) > monthFetchingOffset) return false;
    return !dayHasOpening(normalized);
  };

  const handleUserTimeSlotClick = (timeSlotObject: Slot) => {
    if (timeSlotObject.extra && timeSlotObject.extra.status) return;
    onSlotClicked(timeSlotObject);
  };

  const slotsForSelectedDate = selectedDate
    ? withEmployeeInfo(
      sortByStartTime(getSlotsForDate(selectedDate, employee)),
      employees,
    )
    : [];
  const slotGroupsForSelectedDate = groupSlotsByPeriod(slotsForSelectedDate);

  return {
    today,
    employees,
    employee,
    setEmployee,
    selectedDate,
    selectDate,
    visibleDays,
    dayHasOpening,
    getEarliestSlotForDate,
    goToNextDayWindow,
    goToPrevDayWindow,
    canGoPrevDayWindow,
    shouldDisableCalendarDate,
    handleCalendarMonthChange,
    handleUserTimeSlotClick,
    slotsForSelectedDate,
    slotGroupsForSelectedDate,
  };
}