import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useFirebase } from '@/firebase';
import EventsAddingForm from './EventsAddingForm';
import { useSelector } from 'react-redux';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { DeleteEventsDashboard } from './DeleteEventsDashboard/DeleteEventDashboard';
import ProfessionalFilterBar from './ProfessionalFilterBar'
import { slotColor, slotsForEmployee } from '@/utils/employees';

const localizer = momentLocalizer(moment);
/** react-big-calendar's own blue, for slots with no owner (or an unknown one). */
const UNASSIGNED_SLOT_COLOR = '#3174ad';
const today = new Date();

export default function PrivateDashboard() {
  const firebase = useFirebase();
  const employeesList = useSelector((state: any) => state.employees.list);

  const [eventsToDisplay, setEventsToDisplay] = useState<any[]>([]);
  const [activeEmployee, setActiveEmployee] = useState<any>(null);
  const [deleteEventsArray, setDeleteEvents] = useState<any[]>([]);

  // 1. Simplified Array Picker
  // Uses .some() for immediate, highly readable array detection
  const addEventToDeletionArray = (oldArray: any[], event: any) => {
    if (event.extra?.status === 'booked') return oldArray; // Booked slots cannot be deleted

    const alreadySelected = oldArray.some((item) => item.eventKey === event.eventKey);
    if (alreadySelected) {
      window.alert('Already Selected');
      return oldArray;
    }
    return [...oldArray, event];
  };

  const handleUserTimeSlotClick = (timeSlotObject: any) => {
    setDeleteEvents((prev) => addEventToDeletionArray(prev, timeSlotObject));
  };

  // 2. Real-time Firebase Listener
  useEffect(() => {
    if (!firebase) return;
    const freeAppsRef = firebase.freeAppointments();

    firebase.doOnValue(freeAppsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setEventsToDisplay([]);
        return;
      }

      const totalEvents: any[] = [];
      Object.keys(data).forEach((monthKey) => {
        const monthData = data[monthKey];
        Object.keys(monthData).forEach((eventKey) => {
          const ev = monthData[eventKey];
          totalEvents.push({
            id: ev.id || eventKey,
            eventKey: ev.eventKey || `appointments/freeAppointments/${monthKey}/${eventKey}`, // CRITICAL: Save this so deletion API works!
            title: ev.title || 'Available Slot',
            start: new Date(ev.start),
            end: new Date(ev.end),
            allDay: ev.allDay || false,
            // employeeId is the only record of who owns a slot — name and colour
            // are looked up from the live employee list. This mapping used to
            // drop it, so the id is carried through explicitly. A slot without
            // one is unassigned; `extra` now only carries booking status.
            employeeId: ev.employeeId,
            extra: ev.extra || {},
          });
        });
      });
      setEventsToDisplay(totalEvents);
    });

    return () => {
      firebase.doOff(freeAppsRef);
    };
  }, [firebase]);

  // 3. Simplified, Safe Event Filtering
  // Memoized so we don't run filter on every unrelated render cycle.
  // If no employee card is clicked, it shows all events.
  // Matched by id, so a renamed professional keeps their slots.
  const filteredEvents = useMemo(
    () => slotsForEmployee(eventsToDisplay, activeEmployee),
    [eventsToDisplay, activeEmployee]
  );

  // 4. Extracted Clean Event Styling Prop Getter
  // Colour comes from the owner's live record, never from the slot, so
  // changing a professional's colour recolours all of their slots at once.
  const handleEventPropGetter = (eventObject: any) => {
    const backgroundColor =
      eventObject.extra?.status === 'booked'
        ? 'red'
        : slotColor(eventObject, employeesList, UNASSIGNED_SLOT_COLOR);

    return { style: { backgroundColor } };
  };

  // 5. Handlers
  const deleteEventsForSure = () => {
    firebase
      .deleteEventsForSure(deleteEventsArray)
      .then(() => {
        setDeleteEvents([]);
        window.alert('Delete Confirmed');
      })
      .catch((err: any) => {
        console.error(err);
        window.alert('Something went wrong, let Paramveer know about this.');
      });
  };

  const handleActiveEmployeeToggle = (selectedEmployee: any) => {
    // If the user clicks the same card twice, clear the filter to show everyone
    setActiveEmployee((prev: any) =>
      prev?.id === selectedEmployee.id ? null : selectedEmployee
    );
  };

  return (
    // No padding of its own: AdminShell pads every screen the same way.
    <Box>
      {/* Top Employee Selector Bar */}


      <EventsAddingForm />


      <ProfessionalFilterBar
        employeesList={employeesList}
        activeEmployee={activeEmployee}
        setActiveEmployee={setActiveEmployee}

      />

      <Calendar
        localizer={localizer}
        startAccessor="start"
        endAccessor="end"
        events={filteredEvents}
        defaultView="week"
        views={['month', 'week', 'day']}
        eventPropGetter={handleEventPropGetter}
        onSelectEvent={handleUserTimeSlotClick}
        step={30}
        min={new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8)}
        max={new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18)}
        style={{ height: '80vh', marginTop: '2rem' }}
      />
      <DeleteEventsDashboard
        clearDeleteEventsArray={() => setDeleteEvents([])}
        deleteEventsForSure={deleteEventsForSure}
        events={deleteEventsArray}
      />
      {/* Team management moved to its own tab (ROUTES.ADMIN_TEAM). */}
    </Box>

  );
}