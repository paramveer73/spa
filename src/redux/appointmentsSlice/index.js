// 1. Export the named actions
export { addServiceForAppointment, removeServiceForAppointment, resetAppointment, selectCart, selectCartCount } from './appointmentsSlice';

// 2. Grab the DEFAULT export from the slice and rename it to appointmentsReducer
export { default as appointmentsReducer } from './appointmentsSlice';