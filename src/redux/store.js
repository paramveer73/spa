import { configureStore } from "@reduxjs/toolkit";

import appointmentsReducer from "./appointmentsSlice";

// configureStore replaces the old createStore + manual
// window.__REDUX_DEVTOOLS_EXTENSION__ wiring: Redux DevTools support (and
// redux-thunk, and dev-only checks for accidental state mutation /
// non-serializable values) all come built in.
const store = configureStore({
  reducer: {
    appointments: appointmentsReducer,
  },
});

export default store;
