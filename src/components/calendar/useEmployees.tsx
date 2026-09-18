import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useFirebase } from "@/firebase";
import { setEmployees } from "@/redux";

/**
 * Keeps the team list in the store in step with the database.
 *
 * Cleanup calls the unsubscribe `onEmployeesUpdate` returns, rather than the
 * `offEmployeesUpdate()` helper: that one runs `off(employeesRef)`, which drops
 * *every* listener on the path — so two screens subscribing at once would
 * silently kill each other's updates.
 */
export default function useEmployees() {
  const firebase = useFirebase();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!firebase) return undefined;
    return firebase.onEmployeesUpdate((employeesArray) => {
      dispatch(setEmployees(employeesArray));
    });
  }, [firebase, dispatch]);
}
