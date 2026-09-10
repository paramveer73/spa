/**
 * Original stylised portrait, authored as vector art and inlined as a data
 * URI — no network request, no CORS negotiation, and nothing to taint the
 * WebGL canvas.
 *
 * Drawn in bold flat planes rather than soft photographic gradients on
 * purpose: the fog only ever uncovers a small disc at a time, and broad
 * shapes with hard value breaks stay legible through a ~20% viewport window
 * where fine detail would just read as blur.
 *
 * Palette is tied to the studio's browns so the reveal sits inside the
 * brand rather than fighting it.
 */
const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1400" viewBox="0 0 1100 1400">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#241A13"/>
      <stop offset="0.55" stop-color="#3E2C1F"/>
      <stop offset="1" stop-color="#170F0A"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0.3">
      <stop offset="0" stop-color="#C99A6E" stop-opacity="0"/>
      <stop offset="1" stop-color="#E9C39A" stop-opacity="0.55"/>
    </linearGradient>
    <linearGradient id="skin" x1="0.15" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#F0D3B4"/>
      <stop offset="0.5" stop-color="#E2BC97"/>
      <stop offset="1" stop-color="#B98B63"/>
    </linearGradient>
    <linearGradient id="shadow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8E6544" stop-opacity="0.65"/>
      <stop offset="1" stop-color="#8E6544" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="hair" x1="0.2" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#241611"/>
      <stop offset="0.6" stop-color="#3B2419"/>
      <stop offset="1" stop-color="#140D09"/>
    </linearGradient>
    <linearGradient id="lip" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#A65A4E"/>
      <stop offset="1" stop-color="#C97A68"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="#E9C39A" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#E9C39A" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1100" height="1400" fill="url(#bg)"/>
  <ellipse cx="550" cy="600" rx="430" ry="520" fill="url(#glow)"/>

  <!-- hair, back mass -->
  <path d="M182 700 C168 380 330 168 552 168 C774 168 936 380 922 700
           C914 878 892 1006 858 1130 L742 1130 C806 966 826 812 812 690
           C742 742 640 770 552 770 C464 770 362 742 292 690
           C278 812 298 966 362 1130 L246 1130 C212 1006 190 878 182 700 Z"
        fill="url(#hair)"/>

  <!-- neck and shoulders -->
  <path d="M446 760 L654 760 L654 902 C654 946 690 968 748 986
           C858 1020 934 1078 960 1170 L1000 1400 L100 1400 L140 1170
           C166 1078 242 1020 352 986 C410 968 446 946 446 902 Z"
        fill="url(#skin)"/>
  <path d="M446 760 L654 760 L654 880 C600 936 500 936 446 880 Z"
        fill="#A87A55" opacity="0.55"/>

  <!-- face -->
  <path d="M552 262 C700 262 796 372 796 540 C796 636 776 720 738 786
           C700 852 632 900 552 900 C472 900 404 852 366 786
           C328 720 308 636 308 540 C308 372 404 262 552 262 Z"
        fill="url(#skin)"/>
  <path d="M308 540 C308 372 404 262 552 262 L552 900
           C472 900 404 852 366 786 C328 720 308 636 308 540 Z"
        fill="url(#shadow)"/>

  <!-- brows -->
  <path d="M392 486 C438 456 508 452 552 474 C512 470 444 480 396 506 Z" fill="#2C1B12"/>
  <path d="M712 486 C666 456 596 452 552 474 C592 470 660 480 708 506 Z" fill="#2C1B12"/>

  <!-- eyes -->
  <path d="M396 566 C428 528 486 524 520 560 C486 596 428 600 396 566 Z" fill="#FBF3EA"/>
  <path d="M708 566 C676 528 618 524 584 560 C618 596 676 600 708 566 Z" fill="#FBF3EA"/>
  <circle cx="458" cy="562" r="27" fill="#4A2E1C"/>
  <circle cx="646" cy="562" r="27" fill="#4A2E1C"/>
  <circle cx="458" cy="562" r="12" fill="#140C07"/>
  <circle cx="646" cy="562" r="12" fill="#140C07"/>
  <circle cx="468" cy="552" r="7" fill="#FFFFFF" opacity="0.9"/>
  <circle cx="656" cy="552" r="7" fill="#FFFFFF" opacity="0.9"/>
  <!-- lash lines -->
  <path d="M392 562 C426 522 490 518 524 556 L516 562 C484 532 428 536 400 568 Z" fill="#1C110A"/>
  <path d="M712 562 C678 522 614 518 580 556 L588 562 C620 532 676 536 704 568 Z" fill="#1C110A"/>

  <!-- nose -->
  <path d="M552 596 L552 686 C552 700 540 708 524 706" stroke="#A87A55"
        stroke-width="9" fill="none" stroke-linecap="round" opacity="0.75"/>

  <!-- lips -->
  <path d="M486 762 C512 742 534 750 552 758 C570 750 592 742 618 762
           C592 796 570 806 552 806 C534 806 512 796 486 762 Z" fill="url(#lip)"/>
  <path d="M486 762 C520 754 584 754 618 762 C584 770 520 770 486 762 Z"
        fill="#7E4238" opacity="0.65"/>

  <!-- cheek warmth -->
  <ellipse cx="418" cy="668" rx="52" ry="34" fill="#C97A68" opacity="0.22"/>
  <ellipse cx="686" cy="668" rx="52" ry="34" fill="#C97A68" opacity="0.22"/>

  <!-- hair, front framing locks over the face edges -->
  <path d="M552 168 C740 168 906 322 922 574 C902 452 838 366 742 330
           C700 400 636 436 552 440 C468 436 404 400 362 330
           C266 366 202 452 182 574 C198 322 364 168 552 168 Z"
        fill="url(#hair)"/>
  <path d="M300 300 C250 420 232 560 246 700 C214 560 226 410 300 300 Z"
        fill="#160E09" opacity="0.8"/>
  <path d="M804 300 C854 420 872 560 858 700 C890 560 878 410 804 300 Z"
        fill="#160E09" opacity="0.8"/>

  <!-- rim light down the left edge -->
  <path d="M182 700 C168 380 330 168 552 168 L552 236 C372 236 240 402 250 700 Z"
        fill="url(#rim)"/>
</svg>
`.trim();

/** Data URI — same-origin by definition, so the texture upload is safe. */
export const PORTRAIT_ART = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`;

export default PORTRAIT_ART;
