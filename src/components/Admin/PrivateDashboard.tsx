import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useFirebase } from '@/app_state';
import EventsAddingForm from './EventsAddingForm';
import { useSelector } from 'react-redux';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { DeleteEventsDashboard } from './DeleteEventsDashboard/DeleteEventDashboard';
import ProfessionalFilterBar from './ProfessionalFilterBar'
import EmployeeCrudManager from './EmployeeCrudManager';

const localizer = momentLocalizer(moment);
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
            extra: ev.extra || { employee: 'ALL EMPLOYEES' },
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
  const filteredEvents = useMemo(() => {
    if (!activeEmployee) return eventsToDisplay;
    return eventsToDisplay.filter(
      (event) => event.extra?.employee === activeEmployee.name
    );
  }, [eventsToDisplay, activeEmployee]);

  // 4. Extracted Clean Event Styling Prop Getter
  const handleEventPropGetter = (eventObject: any) => {
    let backgroundColor = '#3174ad'; // Default fallback Calendar Blue

    if (eventObject.extra?.status === 'booked') {
      backgroundColor = 'red';
    } else if (eventObject.extra?.employeeColor) {
      backgroundColor = eventObject.extra.employeeColor;
    }

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
    <Box sx={{ p: 3 }}>
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
      <EmployeeCrudManager employeesList={employeesList} />
    </Box>

  );
}