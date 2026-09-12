import { createSlice } from '@reduxjs/toolkit';

const eventsSlice = createSlice({
  name: 'events',
  initialState: [],
  reducers: {
    addEvent: (state, action) => state.concat(action.payload),
    removeEvent: (state, action) => state.filter(e => e.id !== action.payload.id),
  },
});



export const { addEvent, removeEvent } = eventsSlice.actions;
export default eventsSlice.reducer

