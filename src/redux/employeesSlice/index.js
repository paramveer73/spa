// Export action creators for components and hooks to dispatch
export {
    setEmployees,
    setLoading,
    setError,
    selectEmployees
} from './employeesSlice';

// Export the reducer as default or named for store configuration
export { default as employeeReducer } from './employeesSlice';