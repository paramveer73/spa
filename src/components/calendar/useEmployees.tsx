import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useFirebase } from "@/firebase";
import { setEmployees } from "@/redux";

export default function useEmployees() {
    const firebase = useFirebase();
    const dispatch = useDispatch();

    useEffect(() => {
        if (!firebase) return;

        const value = firebase.onEmployeesUpdate((employeesArray) => {
            dispatch(setEmployees(employeesArray));
        });

        // 3. Keep the return statement INSIDE the useEffect block for cleanup
        return () => {
            // Clean up the active websocket listener using your firebase.js utility
            firebase.offEmployeesUpdate(value)
        };
    }, [firebase, dispatch]);

}