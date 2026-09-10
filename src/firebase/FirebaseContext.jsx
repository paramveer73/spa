import { createContext, useContext } from "react";

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


