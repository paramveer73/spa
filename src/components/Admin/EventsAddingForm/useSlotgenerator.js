import { v4 as uuidv4 } from "uuid";

/** The salon's working week. Sunday is closed, so it is never generated. */
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DAY_NAMES = ["Sunday", ...WEEKDAYS];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Safely shifts a date by a given number of days, avoiding timezone and DST drift.
 *
 * setDate() moves along the calendar and keeps the wall-clock time, so a 10:00
 * slot stays at 10:00 across the change back from daylight saving. Adding
 * N × 24h in milliseconds would land it at 9:00 the week after.
 */
export const addDaysToDate = (baseDate, days) => {
    const copy = new Date(baseDate.getTime());
    copy.setDate(copy.getDate() + days);
    return copy;
};

/** "Monday" … "Sunday" for a date. */
export const weekdayName = (date) => DAY_NAMES[date.getDay()];

/**
 * The days that actually get slots: the ones ticked by hand, plus the start
 * date's own weekday, in Monday→Saturday order.
 *
 * The start weekday is derived here rather than stored as a tick. If it were
 * stored, moving the start from Thursday to Friday would leave Thursday
 * ticked unless the form tracked which ticks were automatic. Deriving it means
 * a manual tick survives a start-date change and the automatic one simply
 * follows the picker.
 */
export const effectiveDays = (ticked, startDate) => {
    const startDay = weekdayName(startDate);
    return WEEKDAYS.filter((day) => day === startDay || ticked.includes(day));
};

const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Why a start/end pair can't be published, or null if it can. The form uses
 * this to explain the problem inline; generateSlots enforces the same rules.
 */
export const validateSlotWindow = (start, end) => {
    // The pickers pass an Invalid Date while a value is half-typed. Without this
    // it would fall through to the checks below and be misreported as a
    // same-day problem.
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Enter a complete start and end time.";
    if (start.getDay() === 0) return "The salon is closed on Sundays. Pick another start date.";
    if (end.getTime() <= start.getTime()) return "The end time must be after the start time.";
    // Every slot is copied from this one window, so an end on another day would
    // turn each generated slot into a multi-day block.
    if (!isSameDay(start, end)) return "The end time must be on the same day as the start.";
    return null;
};

/**
 * Builds availability slots from one start/end window.
 *
 * Days and weeks are independent:
 *   - `days` — which weekdays get a slot. The start date's weekday is always
 *     included, whether or not it is ticked.
 *   - `noOfWeeks` — how many weeks *after* the start week to continue.
 *     0 means this week only.
 *
 * Week 0 is the Monday–Saturday week containing the start date, and only its
 * days on or after the start are used — earlier ones have already passed.
 * Weeks 1…N use every selected day. Each slot keeps the start's time of day
 * and the window's duration.
 *
 * This replaces four separate scenarios that could not combine: ticked days
 * with weeks > 0 matched none of them and produced only the start slot, and
 * "every day" counted weeks one short of the weekly repeat.
 *
 * @param {object}   args
 * @param {Date}     args.selectedDate     start of the first slot
 * @param {Date}     args.selectedEndDate  end of the first slot (same day)
 * @param {string}   args.title
 * @param {{id: string}} args.employee     only the id is stored; name and colour are looked up live
 * @param {string[]} [args.days]           weekday names ticked by hand
 * @param {number}   [args.noOfWeeks]      additional weeks after the start week
 * @returns {{id: string, title: string, employeeId: string, start: string, end: string}[]}
 *          in date order
 */
export const generateSlots = ({
    selectedDate,
    selectedEndDate,
    title,
    employee,
    days = [],
    noOfWeeks = 0,
}) => {
    const problem = validateSlotWindow(selectedDate, selectedEndDate);
    if (problem) throw new Error(problem);

    const duration = selectedEndDate.getTime() - selectedDate.getTime();
    const selected = new Set(effectiveDays(days, selectedDate));
    const weeks = Math.max(0, Math.floor(Number(noOfWeeks) || 0));

    // Monday of the start's week, at the start's time of day. The start is
    // never a Sunday (validated above), so getDay() is 1–6 here.
    const monday = addDaysToDate(selectedDate, 1 - selectedDate.getDay());

    const slots = [];
    for (let week = 0; week <= weeks; week++) {
        WEEKDAYS.forEach((dayName, offset) => {
            if (!selected.has(dayName)) return;
            const start = addDaysToDate(monday, week * 7 + offset);
            if (start < selectedDate) return;

            slots.push({
                title,
                employeeId: employee.id,
                id: uuidv4(),
                // Date#toString matches what existing slots already store, and
                // writeEventData re-parses it to pick each slot's month bucket.
                start: start.toString(),
                end: new Date(start.getTime() + duration).toString(),
            });
        });
    }
    return slots;
};

/** Calendar-day index, so DST days (23h / 25h) don't skew the maths. */
const dayIndex = (date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY;

/**
 * Groups generated slots for the confirm dialog: week 0 is the start's week,
 * then 1, 2, … Empty weeks are omitted.
 */
export const groupSlotsByWeek = (slots, startDate) => {
    const mondayIndex = dayIndex(addDaysToDate(startDate, 1 - startDate.getDay()));
    const groups = [];

    for (const slot of slots) {
        const week = Math.floor((dayIndex(new Date(slot.start)) - mondayIndex) / 7);
        const last = groups[groups.length - 1];
        if (last && last.week === week) last.slots.push(slot);
        else groups.push({ week, slots: [slot] });
    }
    return groups;
};

/**
 * Default start for the form: the next quarter hour, with seconds cleared.
 * A raw `new Date()` carried the current seconds (e.g. 12:10:37) onto every
 * slot generated from it.
 */
export const nextQuarterHour = (now) => {
    const d = new Date(now.getTime());
    const onQuarter = d.getMinutes() % 15 === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;
    d.setSeconds(0, 0);
    if (!onQuarter) d.setMinutes(Math.floor(d.getMinutes() / 15) * 15 + 15);
    return d;
};
