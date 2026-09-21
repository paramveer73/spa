import { useState } from "react";
import { useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIosNew";
import BookingMenu, { cartTotals } from "@/components/BookingMenu";
import { Calendar, useEmployees, type BookingDataSource, type Employee, type Slot } from "@/components/calendar";
import { FEATURE_FLAGS } from "@/constants/featureFlags";
import { useFirebase } from "@/firebase";
import { selectCart } from "@/redux";
import BookingConfirmed, { type BookingSummary } from "./BookingConfirmed";
import ConfirmStep from "./ConfirmStep";
import {
  BOOKING_STEP,
  BOOKING_STEP_LABELS,
  BOOKING_STEP_ORDER,
  previousStep,
  type BookingStep,
} from "./bookingSteps";

/**
 * The three steps of booking, in memory: pick services, pick a time, confirm
 * (card on file, retainer agreed and charged) — then the confirmation.
 *
 * Only the cart lives in Redux — it's read by the navbar badge, so it has to
 * outlive this page. Which step you're on and which slot you clicked are
 * nobody else's business, so they stay here and reset on a fresh visit.
 */
export interface BookingFlowProps {
  /** The sign-in page, set to return here — for the menu's sign-in prompts. */
  signInPath: string;
}

export default function BookingFlow({ signInPath }: BookingFlowProps) {
  const [step, setStep] = useState<BookingStep>(BOOKING_STEP.SERVICES);
  const [slot, setSlot] = useState<Slot | null>(null);
  // Set once booked. The cart is cleared at that moment, so this is what the
  // confirmation shows — and what keeps the flow from falling back to the menu.
  const [booked, setBooked] = useState<BookingSummary | null>(null);

  const firebase = useFirebase() as BookingDataSource | null;
  // The calendar colours slots by who owns them, so the team list has to be live.
  useEmployees();
  const employees: Employee[] = useSelector((state: { employees: { list: Employee[] } }) => state.employees.list);
  const cart = useSelector(selectCart);
  // 0 turns the calendar's length filter off: every open slot is offered.
  const requiredMinutes = FEATURE_FLAGS.CONTINUOUS_TIME_FILTER ? cartTotals(cart).duration : 0;

  const handleSlotClicked = (picked: Slot) => {
    setSlot(picked);
    setStep(BOOKING_STEP.CONFIRMATION);
  };

  const handlePickAnotherTime = () => {
    setSlot(null);
    setStep(BOOKING_STEP.CALENDAR);
  };

  const handleBookAnother = () => {
    setBooked(null);
    setSlot(null);
    setStep(BOOKING_STEP.SERVICES);
  };

  // An empty cart means there's nothing to schedule — back to the menu.
  const activeStep = cart.length === 0 ? BOOKING_STEP.SERVICES : step;

  return (
    <Box>
      {/* 1. Where you are */}
      <Stepper
        // Past the last step once booked, so every step shows as done.
        activeStep={booked ? BOOKING_STEP_ORDER.length : BOOKING_STEP_ORDER.indexOf(activeStep)}
        alternativeLabel
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        {BOOKING_STEP_ORDER.map((id) => (
          <Step key={id}>
            <StepLabel>{BOOKING_STEP_LABELS[id]}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {booked && <BookingConfirmed summary={booked} onBookAnother={handleBookAnother} />}

      {/* 2. Back out of a step without losing the cart */}
      {!booked && activeStep !== BOOKING_STEP.SERVICES && (
        <Button
          onClick={() => setStep(previousStep(activeStep))}
          startIcon={<ArrowBackIcon sx={{ fontSize: 12 }} />}
          sx={{ mb: 2, color: "text.secondary" }}
        >
          {BOOKING_STEP_LABELS[previousStep(activeStep)]}
        </Button>
      )}

      {/* 3. The step itself */}
      {!booked && activeStep === BOOKING_STEP.SERVICES && (
        <BookingMenu onContinue={() => setStep(BOOKING_STEP.CALENDAR)} signInPath={signInPath} />
      )}

      {!booked && activeStep === BOOKING_STEP.CALENDAR && firebase && (
        <Calendar
          firebase={firebase}
          employees={employees}
          onSlotClicked={handleSlotClicked}
          requiredMinutes={requiredMinutes}
        />
      )}

      {!booked && activeStep === BOOKING_STEP.CONFIRMATION && (
        <ConfirmStep slot={slot} employees={employees} onBooked={setBooked} onPickAnotherTime={handlePickAnotherTime} />
      )}
    </Box>
  );
}
