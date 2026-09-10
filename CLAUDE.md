# KTLN Studio — Project Conventions

House style is derived from the booking/admin codebase in `src/components/Admin/`,
`src/components/calendar/`, `src/hooks/`, `src/utils/` and `src/redux+firebase/`.
**All new components follow these patterns.**

## Layout

```
src/
  components/<Feature>/          # PascalCase feature folder
    <Feature>.tsx                # the component
    index.js                     # barrel: export { default } from './<Feature>'
    <SubView>.tsx                # sub-views live beside their parent
    use<Thing>.js                # feature-local hooks/pure logic
  components/calendar/           # self-contained portable library (see below)
  hooks/                         # cross-feature reusable hooks
  utils/                         # pure, framework-free helpers
  redux+firebase/                # store, slices, Firebase class + context
```

Every feature folder gets an `index.js` barrel so imports stay
`./EventsAddingForm`, not `./EventsAddingForm/EventsAddingForm`.

## Component shape

- **Always** `export default function Name({ a, b }: NameProps) {` — default
  export, named function, props destructured in the signature.
- Declare `interface NameProps` directly above the component.
- Module-scope constants in `SCREAMING_SNAKE`, hoisted out of the component:
  `const DAYS = [...]`, `DURATION_PRESETS`, `NO_OPENING_TOOLTIP`.
- Guard clauses first: `if (!events || events.length === 0) return null;`
- Event handlers are `handleXxx`: `handlePublishSlots`, `handleActiveEmployeeToggle`.
- A small sub-component used only by one parent lives in that same file
  (`DeleteEventCard` inside `DeleteEventDashboard.tsx`).
- Number the major JSX regions with comments: `{/* 1. Profile Color Circle */}`.

## Logic / presentation split

Data fetching, paging, filtering and selection go in a hook; the component
renders what the hook returns and nothing more. `useBookingAvailability.ts`
owns all of it and `Calendar.tsx` is pure presentation — follow that split
whenever a component grows past simple rendering.

Pure, testable transforms get their own module and are imported by the
component that needs them (`generateSlots` in `useSlotgenerator.js`).

## Portable library folders

`components/calendar/` is copy-pasteable into another project: it has its own
`types.ts`, its own `format.ts` (**deliberately duplicated** from `utils/format.js`
rather than imported), a barrel `index.ts` exporting component + hook + types,
and it depends only on npm packages — never on this app's content, routing or
store. It takes a `BookingDataSource` interface rather than the Firebase SDK
directly. Keep new shared widgets to that standard.

## Comments

This codebase comments the **why**, not the what — rejected alternatives,
tradeoffs, and non-obvious constraints. `imageCache.js` explains why Cache
Storage over localStorage; `appointmentsSlice.js` explains Immer's
return-vs-mutate semantics; `FirebaseContext.jsx` explains what pattern it
replaced. Match that density on anything non-obvious. Leave a `//` note when a
line exists to work around something.

## Styling

MUI `sx` prop only — no CSS modules, no styled-components, no stylesheet per
component. Theme tokens (`primary.main`, `text.secondary`, `background.paper`)
in preference to hex literals.

Marketing-site components (Header/Footer/Home) are the exception: they use
`src/index.css` with CSS custom properties.

## State

- Redux Toolkit `createSlice` — never hand-rolled action constants.
- `configureStore` — never `createStore`.
- Firebase reached via `useFirebase()`, never imported as a global singleton.
- `useEffect` subscriptions **always** return their unsubscribe in cleanup.

## TypeScript

`.tsx` for components, `.ts` for logic and types, `.js` acceptable for pure
utils and older hooks. Pragmatic `any` is tolerated at boundaries; domain
shapes get real `interface`s.
