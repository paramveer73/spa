import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AuroraMeshHero, DepthTunnelHero, FlowpathHero, ParticleFieldHero, WaveMeshHero } from "./index";

/**
 * Side-by-side harness for comparing hero treatments. Not part of the site —
 * mount it, pick one, then lift the winner into the real page.
 */
const VARIANTS = [
  {
    id: "aurora",
    label: "Aurora Mesh",
    tech: "WebGL shader · cursor wipe + ScrollTrigger fog burn-off",
    render: () => (
      <AuroraMeshHero
        eyebrow="Clovis, California"
        title={"Effortless\nBeauty"}
        subtitle="Photo run through a cel-shading pass — flat bands, gradient-mapped palette, inked contours. Wipe with the cursor or scroll."
        palette={["#0B0A12", "#B08968", "#EFE3D6"]}
        portrait="https://static.wixstatic.com/media/e9e8e3_aa1c474a6b3f47b68ae3125ef5e26b6d~mv2.jpg/v1/fill/w_1100,h_1400,al_c,q_90/file.jpg"
        portraitFocus={[0.5, 0.30]}
        stylize={1}
        scrollReveal
      />
    ),
  },
  {
    id: "flowpath",
    label: "Flowpath",
    tech: "Video background · Tailwind + Lucide · liquid-glass nav",
    render: () => <FlowpathHero />,
  },
  {
    id: "tunnel",
    label: "Depth Tunnel",
    tech: "CSS 3D · recycled planes on translateZ",
    render: () => (
      <DepthTunnelHero
        eyebrow="Clovis, California"
        title={"Effortless\nBeauty"}
        subtitle="An endless corridor from fourteen planes that wrap as they pass the lens."
      />
    ),
  },
  {
    id: "wave",
    label: "Wave Mesh",
    tech: "Canvas 2D · summed-sine surface, painter's algorithm",
    render: () => (
      <WaveMeshHero
        eyebrow="Clovis, California"
        title={"Effortless\nBeauty"}
        subtitle="A wireframe surface displaced by three sine waves, pitched under a hand-rolled camera."
      />
    ),
  },
] as const;

export default function HeroLab() {
  const [active, setActive] = useState(0);
  const current = VARIANTS[active];

  return (
    <Box sx={{ position: "relative", bgcolor: "#000" }}>
      {current.render()}

      {/* Floating picker */}
      <Box
        sx={{
          position: "fixed",
          bottom: { xs: 12, md: 22 },
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          p: 0.75,
          borderRadius: 999,
          bgcolor: "rgba(12,11,15,.72)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,.14)",
          maxWidth: "calc(100vw - 24px)",
          overflowX: "auto",
        }}
      >
        {VARIANTS.map((variant, i) => (
          <Box
            key={variant.id}
            component="button"
            onClick={() => setActive(i)}
            sx={{
              flexShrink: 0,
              px: { xs: 1.6, md: 2.4 },
              py: { xs: 0.9, md: 1.2 },
              borderRadius: 999,
              border: 0,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: { xs: 11, md: 13 },
              fontWeight: 700,
              letterSpacing: "0.02em",
              transition: "background-color .25s ease, color .25s ease",
              bgcolor: i === active ? "#fff" : "transparent",
              color: i === active ? "#000" : "rgba(255,255,255,.72)",
              "&:hover": { bgcolor: i === active ? "#fff" : "rgba(255,255,255,.12)" },
            }}
          >
            {i + 1}. {variant.label}
          </Box>
        ))}
      </Box>

      <Typography
        sx={{
          position: "fixed",
          bottom: { xs: 62, md: 76 },
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200,
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,.5)",
          textAlign: "center",
          px: 2,
          pointerEvents: "none",
        }}
      >
        {current.tech}
      </Typography>
    </Box>
  );
}
