import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    list: [],
    loading: false,
    error: null,
};

const employeeSlice = createSlice({
    name: 'employees',
    initialState,
    reducers: {
        // This action will be called by your Firebase callback
        setEmployees: (state, action) => {
            state.list = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

// Redux Toolkit automatically generates action creators for each reducer function
export const { setEmployees, setLoading, setError } = employeeSlice.actions;

// The live team list, as kept current by useEmployees. One selector, so the
// state shape is known here and not at every useSelector call.
export const selectEmployees = (state) => state.employees.list;

// Export the reducer to be registered in your store
export default employeeSlice.reducer;