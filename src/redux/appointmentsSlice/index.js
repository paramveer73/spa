// 1. Export the named actions
export { addServiceForAppointment, removeServiceForAppointment, resetAppointment } from './appointmentsSlice';

// 2. Grab the DEFAULT export from the slice and rename it to appointmentsReducer
export { default as appointmentsReducer } from './appointmentsSlice';