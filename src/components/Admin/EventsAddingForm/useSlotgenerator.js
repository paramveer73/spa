import { v4 as uuidv4 } from "uuid";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Safely shifts a date by a given number of days, avoiding timezone and DST drift.
 */
export const addDaysToDate = (baseDate, days) => {
    const copy = new Date(baseDate.getTime());
    copy.setDate(copy.getDate() + days);
    return copy;
};

/**
 * Core pure function to generate appointment slots based on user criteria.
 * * @param {Date} selectedDate - The start date/time of the base slot
 * @param {Date} selectedEndDate - The end date/time of the base slot
 * @param {string} title - Slot title
 * @param {object} employee - { name, color }
 * @param {object} particularDays - { Monday: boolean, ... }
 * @param {boolean} isEveryDayInWeek - "Every day in Week" checkbox status
 * @param {number} noOfWeeks - Multi-week repeat count
 * @returns {Array} List of generated slot objects
 */
export const generateSlots = ({
    selectedDate,
    selectedEndDate,
    title,
    employee,
    particularDays,
    isEveryDayInWeek,
    noOfWeeks,
}) => {
    const eventTemplate = {
        title,
        employeeId: employee.id,
    };

    // Base slot
    let generatedEvents = [
        {
            ...eventTemplate,
            id: uuidv4(),
            start: selectedDate.toString(),
            end: selectedEndDate.toString(),
        },
    ];

    const baseStart = selectedDate.getTime();
    const baseEnd = selectedEndDate.getTime();
    const duration = baseEnd - baseStart;

    const hasSelectedParticularDays = Object.values(particularDays).some((val) => val);

    // SCENARIO 1: Particular Weekdays selected, Single Week
    if (hasSelectedParticularDays && noOfWeeks === 0) {
        const todayIndex = selectedDate.getDay() - 1; // Mon = 0, Tue = 1, etc.

        DAYS_OF_WEEK.forEach((dayName, idx) => {
            if (particularDays[dayName] && idx !== todayIndex) {
                const shiftDays = idx - todayIndex;
                const startShifted = addDaysToDate(selectedDate, shiftDays);
                const endShifted = new Date(startShifted.getTime() + duration);

                generatedEvents.push({
                    ...eventTemplate,
                    id: uuidv4(),
                    start: startShifted.toString(),
                    end: endShifted.toString(),
                });
            }
        });
    }

    // SCENARIO 2: Specific days NOT selected, Multi-week repeat of just this single slot
    if (!isEveryDayInWeek && !hasSelectedParticularDays && noOfWeeks > 0) {
        for (let week = 1; week <= noOfWeeks; week++) {
            const startShifted = addDaysToDate(selectedDate, week * 7);
            const endShifted = new Date(startShifted.getTime() + duration);

            generatedEvents.push({
                ...eventTemplate,
                id: uuidv4(),
                start: startShifted.toString(),
                end: endShifted.toString(),
            });
        }
    }

    // SCENARIO 3: "Every day in Week" checked, Single Week
    if (isEveryDayInWeek && noOfWeeks === 0) {
        const currentDayOfWeek = selectedDate.getDay(); // Sun = 0, Mon = 1, etc.
        for (let day = currentDayOfWeek + 1; day < 7; day++) {
            const shiftDays = day - currentDayOfWeek;
            const startShifted = addDaysToDate(selectedDate, shiftDays);
            const endShifted = new Date(startShifted.getTime() + duration);

            generatedEvents.push({
                ...eventTemplate,
                id: uuidv4(),
                start: startShifted.toString(),
                end: endShifted.toString(),
            });
        }
    }

    // SCENARIO 4: "Every day in Week" checked, Multi-week
    if (isEveryDayInWeek && noOfWeeks > 0) {
        let relativeDayCounter = 1;
        for (let week = 0; week < noOfWeeks; week++) {
            const startDayIndex = week === 0 ? selectedDate.getDay() : 0;
            for (let day = startDayIndex + 1; day < 7; day++) {
                const startShifted = addDaysToDate(selectedDate, relativeDayCounter);
                const endShifted = new Date(startShifted.getTime() + duration);

                generatedEvents.push({
                    ...eventTemplate,
                    id: uuidv4(),
                    start: startShifted.toString(),
                    end: endShifted.toString(),
                });
                relativeDayCounter++;
            }
            relativeDayCounter++; // Skip Sundays
        }
    }

    return generatedEvents;
};