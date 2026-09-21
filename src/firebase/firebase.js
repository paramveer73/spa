import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getDatabase, ref, query, orderByKey, startAt, limitToFirst, onValue, push, update, off
} from "firebase/database";
import { initializeAnalytics, isSupported, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDtn0BFdmGabvVAQGy-xeoSqOCc7WwmM40",
  authDomain: "ktlnstudio-3430f.firebaseapp.com",
  databaseURL: "https://ktlnstudio-3430f-default-rtdb.firebaseio.com",
  projectId: "ktlnstudio-3430f",
  storageBucket: "ktlnstudio-3430f.firebasestorage.app",
  messagingSenderId: "492476642650",
  appId: "1:492476642650:web:9a77e2d2ae42c50a75af63",
  measurementId: "G-TKBT6RK5FM"
};


class Firebase {
  constructor() {
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);
    this.db = getDatabase(app);
    // A promise, not the instance: getAnalytics throws where GA can't run
    // (IndexedDB blocked in private windows, some in-app browsers), and a
    // throw here would take the whole site down. The automatic first
    // page_view is off because PageViewTracker logs every route itself —
    // leaving it on would count the landing page twice.
    this.analytics = isSupported()
      .then((ok) => (ok ? initializeAnalytics(app, { config: { send_page_view: false } }) : null))
      .catch(() => null);
  }


  /** ANALYTICS API */

  /** Fire-and-forget: queues behind the analytics promise, and does nothing where GA is unsupported. */
  logAnalyticsEvent = (name, params) => {
    this.analytics.then((analytics) => analytics && logEvent(analytics, name, params));
  };

  /**
   * One page view per route. `pageName` is the page's ROUTES key — the
   * document title never changes in this SPA, so GA's page-title reports
   * would otherwise lump every page together.
   */
  logPageView = (pageName, path) =>
    this.logAnalyticsEvent("page_view", {
      page_title: pageName,
      page_path: path,
      page_location: window.location.href,
    });

  /** `location` names the button that was clicked ("navbar", "contact"…); `params` adds context such as the service. */
  logBookNowClick = (location, params = {}) =>
    this.logAnalyticsEvent("book_now_click", { cta_location: location, ...params });


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

  // Add this line inside your Firebase class
  doOff = (reference) => off(reference);

  // Add this helper inside your Firebase class
  doOnValue = (reference, callback) => onValue(reference, callback);

  doSignInWithEmailAndPassword = (email, password) => signInWithEmailAndPassword(this.auth, email, password);

  doSignOut = () => signOut(this.auth);

  /**
   * The signed-in user's ID token, for the functions API, or null when no
   * one is signed in. Firebase refreshes it before it expires, so each call
   * gets a valid one.
   */
  getIdToken = () => (this.auth.currentUser ? this.auth.currentUser.getIdToken() : Promise.resolve(null));

  /**
   * A popup rather than signInWithRedirect: the redirect flow depends on
   * third-party storage for the auth domain, which Safari and Chrome now
   * partition, so on phones it returns with no user. `select_account` shows
   * the account chooser even when one Google account is already signed in —
   * booking from a shared or family device shouldn't silently use theirs.
   */
  doSignInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return signInWithPopup(this.auth, provider);
  };

  /** Emails a one-time sign-in link that opens `returnUrl` (must be on an authorised domain). */
  doSendSignInLinkToEmail = (email, returnUrl) =>
    sendSignInLinkToEmail(this.auth, email, { url: returnUrl, handleCodeInApp: true });

  isSignInWithEmailLink = (link) => isSignInWithEmailLink(this.auth, link);

  doSignInWithEmailLink = (email, link) => signInWithEmailLink(this.auth, email, link);

  currentUser = () => ref(this.db, 'appointments');

  freeAppointments = () => ref(this.db, 'appointments/freeAppointments');

  bookedAppointments = () => ref(this.db, 'appointments/bookedAppointments');

  formatterHelperFunction = (year, month) => {
    return month < 10 ? `${year * 10}${month}` : `${year}${month}`;
  };

  writeEventData = (events) => {
    const updates = {};
    for (const event of events) {
      const thisDate = new Date(event.start);
      const value = this.formatterHelperFunction(thisDate.getFullYear(), thisDate.getMonth());
      const listRef = ref(this.db, `appointments/freeAppointments/${value}`);
      const newPostKey = push(listRef).key;
      if (newPostKey) {
        const fullPath = `appointments/freeAppointments/${value}/${newPostKey}`;
        updates[fullPath] = { ...event, eventKey: fullPath };
      }
    }
    return update(ref(this.db), updates);
  };

  deleteEventsForSure = (events) => {
    const updates = {};
    for (const e of events) {
      updates[e.eventKey] = null;
    }
    return update(ref(this.db), updates);
  };

  deleteBookedAppointment = (userdata) => {
    const updates = {};
    updates[userdata.eventKey] = null;
    updates[userdata.bookedAppointmentKey] = null;
    return update(ref(this.db), updates);
  };


  /** CATALOG API — the bookable menu (shape in src/data/catalog.ts) */

  /** Live `catalog` node, raw. Returns the unsubscribe. */
  onCatalogUpdate = (callback) => onValue(ref(this.db, "catalog"), (snapshot) => callback(snapshot.val()));

  /** Writes a new service under a push key, so ids never collide with existing ones. */
  addCatalogService = (service) => {
    const key = push(ref(this.db, "catalog/services")).key;
    if (!key) return Promise.reject(new Error("Could not generate a key for the new service."));
    return update(ref(this.db), { [`catalog/services/${key}`]: service });
  };

  /**
   * Updates only the fields given, so anything the form doesn't edit
   * survives. A null field is removed (clearing a note, un-marking an add-on).
   */
  updateCatalogService = (id, fields) => update(ref(this.db, `catalog/services/${id}`), fields);

  deleteCatalogService = (id) => update(ref(this.db), { [`catalog/services/${id}`]: null });

  // Reference helper pointing to the root-level employees node
  employeesRef = () => ref(this.db, 'employees');

  // Real-time listener: fetches employees, formats them into an array,
  // and fires the callback whenever data changes
  onEmployeesUpdate = (callback) => {
    const dbRef = this.employeesRef();

    return this.doOnValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      const employeesArray = [];

      if (data) {
        Object.keys(data).forEach((key) => {
          employeesArray.push({
            id: key, // Keep the Firebase node key as the unique ID
            ...data[key]
          });
        });
      }

      callback(employeesArray);
    });

  };

  offEmployeesUpdate = () => {
    this.doOff(this.employeesRef())
  }


  //  All this method needes is an array of object containing eventkey
  deleteEventsForSure = (events) => {
    var updates = {}
    for (var i = 0; i < events.length; i++) {
      updates[events[i].eventKey] = null
    }
    return update(ref(this.db), updates)

  }

  deleteBookedAppointment = (userdata) => {
    var updates = {}
    updates[userdata.eventKey] = null
    updates[userdata.bookedAppointmentKey] = null
    return update(ref(this.db), updates)
  }

  addEmployee = (employee) => {
    const employeesRef = ref(this.db, 'employees');
    const newEmployeeKey = push(employeesRef).key;

    if (newEmployeeKey) {
      const updates = {};
      updates[`employees/${newEmployeeKey}`] = {
        name: employee.name,
        color: employee.color,
        role: employee.role || 'Professional'
      };
      return update(ref(this.db), updates);
    }
    return Promise.reject("Could not generate a unique key for the new employee.");
  };

  /**
   * Update: Edits an existing employee's details at their specific node path
   */
  updateEmployee = (id, updatedData) => {
    const updates = {};
    updates[`employees/${id}`] = {
      name: updatedData.name,
      color: updatedData.color,
      role: updatedData.role || 'Professional'
    };
    return update(ref(this.db), updates);
  };

  /**
   * Delete: Removes an employee by setting their key's value to null
   */
  deleteEmployee = (id) => {
    const updates = {};
    updates[`employees/${id}`] = null;
    return update(ref(this.db), updates);
  };



}
const firebase = new Firebase();

export default firebase;
