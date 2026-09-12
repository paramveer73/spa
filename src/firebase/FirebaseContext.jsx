import { createContext, useContext } from "react";

/**
 * Typed explicitly: in a JS file `createContext(null)` infers the context as
 * `null`, so the Provider couldn't accept the instance and every useFirebase()
 * caller saw `null` (or `never` after a guard). App always provides the
 * instance, so null here only ever means "rendered outside the provider".
 * @type {import("react").Context<import("./firebase").default | null>}
 */
const FirebaseContext = createContext(null);

// Modern replacement for the old withFirebase(Component) HOC/render-prop
// pattern — call this inside whichever component actually needs the
// Firebase instance (e.g. CalenderHolder), then pass it down as a plain
// prop to any presentational child that needs it. Keeps app-specific
// context wiring out of standalone/portable components like Calender.jsx.
export function useFirebase() {
  return useContext(FirebaseContext);
}

export default FirebaseContext;


