import { createSlice } from "@reduxjs/toolkit";

/**
 * The one piece of client state the booking flow actually needs: the list
 * of services the customer has picked for their appointment. Read by
 * SelectableServiceItem (is this item selected?), Fab_Continue (how many /
 * what's the total?), and Confirmation (what's being booked, and clearing
 * it out on a successful submit).
 *
 * This replaces the old hand-rolled combineReducers + action-type-constants
 * setup in reducer.js/actions.js — createSlice generates the action types
 * and action creators for us, and configureStore (in store.js) wires up
 * Redux DevTools automatically instead of the manual
 * `window.__REDUX_DEVTOOLS_EXTENSION__` dance.
 *
 * Note: the reducers below directly return a new array rather than
 * mutating `state` — createSlice wraps reducers in Immer, and Immer treats
 * a returned value as a full replacement for the draft, so this is the
 * correct way to "swap out the whole array" (as opposed to mutating
 * `state.push(...)`, which is how you'd handle it if state were an object).
 */
const appointmentsSlice = createSlice({
  name: "appointments",
  initialState: [],
  reducers: {
    // Adds one or more services, replacing any existing entries with the
    // same id (so re-adding an already-selected item updates it in place
    // instead of duplicating it).
    addServiceForAppointment(state, action) {
      const incomingIds = action.payload.map((item) => item.id);
      return state.filter((appointment) => !incomingIds.includes(appointment.id)).concat(action.payload);
    },
    removeServiceForAppointment(state, action) {
      return state.filter((appointment) => appointment.id !== action.payload.id);
    },
    resetAppointment() {
      return [];
    },
  },
});

export const { addServiceForAppointment, removeServiceForAppointment, resetAppointment } =
  appointmentsSlice.actions;

// The picked services are the cart. One selector each, so the state shape is
// known here rather than at every useSelector call.
export const selectCart = (state) => state.appointments;
export const selectCartCount = (state) => state.appointments.length;

export default appointmentsSlice.reducer;
