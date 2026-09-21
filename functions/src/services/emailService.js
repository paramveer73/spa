const fs = require("fs");
const path = require("path");

const Handlebars = require("handlebars");
const nodemailer = require("nodemailer");
const logger = require("firebase-functions/logger");

const { GMAIL_USER, GMAIL_APP_PASSWORD, NOTIFY_EMAIL } = require("../config/env");
const { VIEWS_DIR } = require("../config/paths");
const { BUSINESS_INFO } = require("../constants/business");
const { formatDate, formatTime, parsePrice, formatPrice, formatDuration } = require("../utils/formatters");

// Compiled once per cold start rather than once per request.
const renderConfirmationEmail = Handlebars.compile(
  fs.readFileSync(path.join(VIEWS_DIR, "bookingConfirmation.handlebars"), "utf8")
);

let cachedTransport = null;
function getTransport() {
  if (cachedTransport) return cachedTransport;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error(
      "Missing GMAIL_USER / GMAIL_APP_PASSWORD. Add them to functions/.env — see functions/.env.example."
    );
  }

  cachedTransport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  return cachedTransport;
}

/**
 * The confirmation for one booking, as subject + HTML + plain text. Pure —
 * sendConfirmationEmail sends it, and it can be rendered on its own to
 * preview the design.
 *
 * `booking`:
 *   to, customerName, start, end   ISO strings or anything Date parses
 *   professionalName               optional
 *   services                       [{ name, price, durationMinutes, description? }]
 *                                  price as a number or a legacy "$99" string
 *   retainer                       optional { amount, refundable, cardLabel } —
 *                                  shown when a retainer was charged
 */
function buildConfirmationEmail(booking) {
  const services = booking.services.map((service) => ({
    name: service.name,
    description: service.description || "",
    // Formatted here, not in the template: prices arrive as numbers now (and
    // as "$99" strings from old records), and the template prints what it's given.
    priceLabel: formatPrice(parsePrice(service.price)),
    durationLabel: formatDuration(service.durationMinutes || 0),
  }));
  const totalPrice = booking.services.reduce((sum, service) => sum + parsePrice(service.price), 0);
  const totalDuration = booking.services.reduce((sum, service) => sum + (service.durationMinutes || 0), 0);

  const retainerAmount = booking.retainer ? parsePrice(booking.retainer.amount) : 0;
  const retainer =
    retainerAmount > 0
      ? {
          amountLabel: formatPrice(retainerAmount),
          balanceLabel: formatPrice(Math.max(0, totalPrice - retainerAmount)),
          cardLabel: booking.retainer.cardLabel || "your card",
          refundable: booking.retainer.refundable === true,
        }
      : null;

  const firstName = String(booking.customerName || "").trim().split(/\s+/)[0] || "there";
  const dateLabel = formatDate(booking.start);
  const startLabel = formatTime(booking.start);
  const professionalName = booking.professionalName || `the ${BUSINESS_INFO.businessName} team`;

  const html = renderConfirmationEmail(
    Object.assign({}, BUSINESS_INFO, {
      previewText: `${dateLabel} at ${startLabel} with ${professionalName}.`,
      customerFirstName: firstName,
      appointmentDateLabel: dateLabel,
      appointmentTimeLabel: `${startLabel} – ${formatTime(booking.end)}`,
      professionalName,
      totalDurationLabel: formatDuration(totalDuration),
      totalPriceLabel: formatPrice(totalPrice),
      services,
      retainer,
    })
  );

  const text = [
    `Hi ${firstName}, your appointment at ${BUSINESS_INFO.businessName} is confirmed.`,
    "",
    `${dateLabel}, ${startLabel} – ${formatTime(booking.end)}, with ${professionalName}.`,
    ...services.map((service) => `- ${service.name} (${service.durationLabel}): ${service.priceLabel}`),
    `Total: ${formatPrice(totalPrice)}`,
    retainer ? `Retainer paid (${retainer.cardLabel}): ${retainer.amountLabel}. Due at your appointment: ${retainer.balanceLabel}.` : "",
    "",
    `${BUSINESS_INFO.businessAddress} · ${BUSINESS_INFO.businessPhone}`,
    `Directions: ${BUSINESS_INFO.directionsUrl}`,
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n");

  return {
    subject: `You're booked: ${dateLabel} at ${startLabel} — ${BUSINESS_INFO.businessName}`,
    html,
    text,
  };
}

async function sendConfirmationEmail(booking) {
  const email = buildConfirmationEmail(booking);
  const mailOptions = {
    from: `${BUSINESS_INFO.businessName} <${GMAIL_USER}>`,
    to: booking.to,
    // The studio's copy goes blind, and replies go to the studio — not to
    // whichever mailbox happens to do the sending.
    bcc: NOTIFY_EMAIL && NOTIFY_EMAIL !== booking.to ? NOTIFY_EMAIL : undefined,
    replyTo: BUSINESS_INFO.businessEmail,
    subject: email.subject,
    text: email.text,
    html: email.html,
  };

  const result = await getTransport().sendMail(mailOptions);
  // Counts only — the log shouldn't collect clients' email addresses.
  logger.log("Confirmation email accepted", { recipients: result.accepted ? result.accepted.length : 0 });
  return result;
}

module.exports = { buildConfirmationEmail, sendConfirmationEmail };
