import { createSlice } from '@reduxjs/toolkit';

const servicesSlice = createSlice({
    name: 'services',
    initialState: [],
    reducers: {
        addService: (state, action) => {
            return state.concat(action.payload);
        },

        removeService: (state, action) => {
            return state.filter((s) => s.name !== action.payload.name);
        },
    },
});

export const { addService, removeService } = servicesSlice.actions;

export default servicesSlice.reducer;
