// Kept here rather than imported from the site's src/data/seed.json since
// this function has no shared build step with the React app — update both if
// the business details change.
const BUSINESS_INFO = {
  businessName: "KTLN Studio",
  // The site's wordmark, set wide in the email header the same way.
  wordmarkPrimary: "KTLN",
  wordmarkSecondary: "Studio",
  locationLine: "Clovis, California",
  businessPhone: "(559) 466-8233",
  businessPhoneHref: "tel:+15594668233",
  businessSmsHref: "sms:+15594668233",
  businessEmail: "ktlnstudio@gmail.com",
  businessAddress: "2196 Shaw Ave, Suite 05, Clovis, CA 93611",
  directionsUrl: "https://maps.app.goo.gl/tWtcwAu3DDk4yZ118",
  websiteUrl: "https://www.ktlnstudio.com",
  instagramUrl: "https://www.instagram.com/ktlnstudio/",
  tiktokUrl: "https://www.tiktok.com/@ktlnstudio",
  facebookUrl: "https://www.facebook.com/people/KTLN-Studio/61551028865481/",
};

// Times in emails are the studio's local time, whatever timezone the
// function runs in (UTC) or the client reads it from.
const STUDIO_TIME_ZONE = "America/Los_Angeles";

module.exports = { BUSINESS_INFO, STUDIO_TIME_ZONE };
