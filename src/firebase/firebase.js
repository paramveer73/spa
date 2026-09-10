import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getDatabase,
  ref,
  query,
  orderByKey,
  startAt,
  limitToFirst,
  onValue,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAOwLWRlBri5hOlvGec4BSlFJ8oYZIU-BY",
  authDomain: "orchid11medspa-6e432.firebaseapp.com",
  databaseURL: "https://orchid11medspa-6e432-default-rtdb.firebaseio.com",
  projectId: "orchid11medspa-6e432",
  storageBucket: "orchid11medspa-6e432.appspot.com",
  messagingSenderId: "711778663448",
  appId: "1:711778663448:web:c5455bbf732bbdcdb4176d",
  measurementId: "G-EJ5VSCZD9F",
};

class Firebase {
  constructor() {
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);
    this.db = getDatabase(app);
  }

  /** REALTIME DATABASE API */

  formatterHelperFunction = (year, month) => {
    if (month < 10) {
      const newYear = year * 10;
      return `${newYear}${month}`;
    }
    return `${year}${month}`;
  };

  /**
   * Subscribes to the free-appointments bucket starting at the given
   * year/month key, for `monthFetchingOffset` month buckets.
   * Returns an unsubscribe function (call it on cleanup).
   */
  subscribeToFreeAppointments = (year, month, monthFetchingOffset, callback) => {
    const startKey = this.formatterHelperFunction(year, month);
    const freeAppointmentsRef = ref(this.db, "appointments/freeAppointments");
    const appointmentsQuery = query(
      freeAppointmentsRef,
      orderByKey(),
      startAt(startKey),
      limitToFirst(monthFetchingOffset)
    );
    return onValue(appointmentsQuery, callback);
  };

  /** AUTH API */

  onAuthStateChanged = (callback) => onAuthStateChanged(this.auth, callback);
}

export default Firebase;
