import { useMemo, useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import { useSelector } from 'react-redux';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventsAddingForm from './EventsAddingForm';
import { DeleteEventsDashboard } from './DeleteEventsDashboard/DeleteEventDashboard';
import ProfessionalFilterBar from './ProfessionalFilterBar'
import FreeSlotsTable, { useFreeSlots, type OpenSlot } from './FreeSlots';
import NoticeSnackbar, { type Notice } from './NoticeSnackbar';
import { selectEmployees } from '@/redux';
import { slotColor, slotsForEmployee } from '@/utils/employees';

const localizer = momentLocalizer(moment);
/** react-big-calendar's own blue, for slots with no owner (or an unknown one). */
const UNASSIGNED_SLOT_COLOR = '#3174ad';
const BOOKED_SLOT_COLOR = 'red';
const today = new Date();

type ScheduleView = 'calendar' | 'table';

/**
 * The studio's published time, two ways.
 *
 * Both views read one subscription (useFreeSlots): the calendar draws
 * everything including slots a booking marked in place, the table lists only
 * what's still bookable. The table used to be its own tab — same rows, second
 * place to keep in step — so it lives here behind a toggle instead.
 */
export default function PrivateDashboard() {
  const employeesList = useSelector(selectEmployees);
  const { slots, openSlots, loading, deleteSlots } = useFreeSlots();

  const [view, setView] = useState<ScheduleView>('calendar');
  const [activeEmployee, setActiveEmployee] = useState<any>(null);
  const [deleteEventsArray, setDeleteEvents] = useState<OpenSlot[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);

  // 1. Calendar events. `title` is whatever the slot was published as, so a
  // booked-in-place slot keeps saying so.
  const events = useMemo(
    () =>
      slots.map((slot) => ({
        ...slot,
        title: slot.title || (slot.booked ? 'Appointment Booked' : 'Appointment Available'),
        allDay: false,
      })),
    [slots]
  );

  // Matched by id, so a renamed professional keeps their slots.
  const filteredEvents = useMemo(
    () => slotsForEmployee(events, activeEmployee),
    [events, activeEmployee]
  );

  // 2. Click-to-select on the calendar builds the deletion list. A booked slot
  // isn't the studio's to delete from here — the booking has to be cancelled.
  const handleUserTimeSlotClick = (slot: OpenSlot) => {
    if (slot.booked) {
      setNotice({ severity: 'info', message: 'That time is booked. Cancel it from Bookings first.' });
      return;
    }
    setDeleteEvents((previous) =>
      previous.some((item) => item.eventKey === slot.eventKey) ? previous : [...previous, slot]
    );
  };

  // 3. Colour comes from the owner's live record, never from the slot, so
  // changing a professional's colour recolours all of their slots at once.
  const handleEventPropGetter = (event: OpenSlot) => ({
    style: {
      backgroundColor: event.booked
        ? BOOKED_SLOT_COLOR
        : slotColor(event, employeesList, UNASSIGNED_SLOT_COLOR),
    },
  });

  const handleDeleteSelected = async () => {
    try {
      await deleteSlots(deleteEventsArray);
      setNotice({ severity: 'success', message: `Deleted ${deleteEventsArray.length} slot${deleteEventsArray.length === 1 ? '' : 's'}.` });
      setDeleteEvents([]);
    } catch (error) {
      setNotice({ severity: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    // No padding of its own: AdminShell pads every screen the same way.
    <Box>
      <EventsAddingForm />

      <ProfessionalFilterBar
        employeesList={employeesList}
        activeEmployee={activeEmployee}
        setActiveEmployee={setActiveEmployee}
      />

      {/* 4. Same slots, calendar or table */}
      <ToggleButtonGroup
        exclusive
        size="small"
        value={view}
        onChange={(_, next: ScheduleView | null) => next && setView(next)}
        aria-label="Schedule view"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="calendar" sx={{ gap: 1, px: 2, textTransform: 'none', fontWeight: 600 }}>
          <CalendarMonthOutlinedIcon fontSize="small" /> Calendar
        </ToggleButton>
        <ToggleButton value="table" sx={{ gap: 1, px: 2, textTransform: 'none', fontWeight: 600 }}>
          <TableRowsOutlinedIcon fontSize="small" /> Table
        </ToggleButton>
      </ToggleButtonGroup>

      {view === 'calendar' ? (
        <>
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
            style={{ height: '80vh' }}
          />
          <DeleteEventsDashboard
            clearDeleteEventsArray={() => setDeleteEvents([])}
            deleteEventsForSure={handleDeleteSelected}
            events={deleteEventsArray}
          />
        </>
      ) : (
        <FreeSlotsTable
          slots={openSlots}
          employees={employeesList}
          loading={loading}
          onDeleteSlots={deleteSlots}
        />
      )}

      <NoticeSnackbar notice={notice} onClose={() => setNotice(null)} />
    </Box>
  );
}
