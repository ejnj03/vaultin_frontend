/**
 * Shared ambient background (radial glow + grid).
 * Used by VaultAuthLoading, VaultLogoutTransition, and Onboarding.
 */
export default function AmbientBackground() {
  return (
    <>
      {/* Radial glow */}
      <div
        className="fixed top-[-140px] left-1/2 -translate-x-1/2 w-[860px] h-[540px] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, oklch(64% 0.155 152 / 0.07) 0%, oklch(64% 0.155 152 / 0.02) 38%, transparent 70%)",
        }}
      />

      {/* Grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(oklch(64% 0.155 152 / 0.02) 1px, transparent 1px), linear-gradient(90deg, oklch(64% 0.155 152 / 0.02) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 70% 55% at 50% 0%, black 0%, transparent 100%)",
        }}
      />
    </>
  );
}
