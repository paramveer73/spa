import { configureStore } from "@reduxjs/toolkit";

import { appointmentsReducer } from "./appointmentsSlice";
import { employeeReducer } from "./employeesSlice";
import { eventsReducer } from "./eventsSlice";
import { servicesReducer } from "./servicesSlice";

// configureStore replaces the old createStore + manual
// window.__REDUX_DEVTOOLS_EXTENSION__ wiring: Redux DevTools support (and
// redux-thunk, and dev-only checks for accidental state mutation /
// non-serializable values) all come built in.
//
// Keys match the arthalaw app_state these slices were ported from, so
// components carried over from it find their state where they expect it.
const store = configureStore({
  reducer: {
    appointments: appointmentsReducer,
    events: eventsReducer,
    services: servicesReducer,
    employees: employeeReducer,
  },
});

export default store;
