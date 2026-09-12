// 1. Export the named actions
export { addEvent, removeEvent } from './eventsSlice';

// 2. Grab the DEFAULT export from the slice and rename it to appointmentsReducer
export { default as eventsReducer } from './eventsSlice';