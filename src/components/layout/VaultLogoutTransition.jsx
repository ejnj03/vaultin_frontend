import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AmbientBackground from "../common/AmbientBackground";

const RING_EASE = [0.2, 0, 0, 1];

/**
 * Logout transition overlay.
 * Shows "Disconnecting..." then rings contract inward and overlay fades to home page.
 *
 * Props:
 *  - address: wallet address string
 *  - onDone: () => void — called when transition completes
 */
export default function VaultLogoutTransition({ address, onDone }) {
  const [phase, setPhase] = useState("holding"); // "holding" | "closing" | "fading" | "done"

  const truncated = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  useEffect(() => {
    // Hold briefly with "Disconnecting..." visible
    const t1 = setTimeout(() => setPhase("closing"), 400);

    // Rings contract + fade (longer hold so "See you soon" is readable)
    const t2 = setTimeout(() => setPhase("fading"), 1100);

    // Signal done
    const t3 = setTimeout(() => {
      setPhase("done");
      onDone?.();
    }, 1700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  const isClosing = phase === "closing" || phase === "fading" || phase === "done";
  const isFading = phase === "fading" || phase === "done";
  const isDone = phase === "done";

  if (isDone) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-base-100 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: isFading ? 0 : 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <AmbientBackground />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Wordmark */}
        <motion.div
          className="flex items-baseline mb-13"
          animate={isClosing ? { opacity: 0, y: -10 } : {}}
          transition={{ duration: 0.25 }}
        >
          <span className="text-[28px] font-extrabold tracking-tight leading-none text-primary">V</span>
          <span className="text-[28px] font-extrabold tracking-tight leading-none text-base-content">ault.io</span>
        </motion.div>

        {/* Spinner area */}
        <div className="relative w-20 h-20 mb-9 flex items-center justify-center">
          {/* Glow */}
          <motion.div
            className="absolute inset-4 rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(64% 0.155 152 / 0.12) 0%, transparent 70%)",
              animation: !isClosing ? "auth-glow-pulse 2s ease-in-out infinite" : undefined,
            }}
            animate={isClosing ? { opacity: 0, scale: 0.5 } : {}}
            transition={{ duration: 0.3 }}
          />

          {/* Outer ring — contracts inward on "closing" */}
          <motion.div
            className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-primary/20"
            style={{
              animation: !isClosing ? "auth-spin-cw 8s linear infinite" : undefined,
            }}
            animate={isClosing ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={isClosing ? { duration: 0.4, ease: RING_EASE } : {}}
          >
            <motion.div
              className="absolute -inset-[1.5px] rounded-full border-[1.5px] border-transparent border-t-primary"
              style={{
                animation: !isClosing
                  ? "auth-spin-cw 1.8s cubic-bezier(0.6, 0, 0.4, 1) infinite"
                  : undefined,
              }}
            />
          </motion.div>

          {/* Inner ring — contracts inward on "closing" */}
          <motion.div
            className="absolute inset-3 rounded-full border border-primary/[0.08]"
            style={{
              animation: !isClosing ? "auth-spin-ccw 4s linear infinite" : undefined,
            }}
            animate={isClosing ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={isClosing ? { duration: 0.4, ease: RING_EASE } : {}}
          >
            <motion.div
              className="absolute -inset-px rounded-full border border-transparent border-b-primary/40"
              style={{
                animation: !isClosing
                  ? "auth-spin-ccw 2.4s cubic-bezier(0.6, 0, 0.4, 1) infinite"
                  : undefined,
              }}
            />
          </motion.div>

          {/* Center V — shrinks with rings */}
          <motion.span
            className="relative z-10 text-lg font-extrabold tracking-tight text-primary"
            animate={isClosing ? { opacity: 0, scale: 0.7 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeIn" }}
          >
            V
          </motion.span>
        </div>

        {/* Status text */}
        <div className="flex flex-col items-center gap-2.5">
          <AnimatePresence mode="wait">
            <motion.div
              key={isClosing ? "goodbye" : "disconnecting"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium text-base-content/40 tracking-wide h-5 flex items-center gap-1.5"
            >
              {isClosing ? "See you soon" : "Disconnecting"}
              {!isClosing && (
                <span className="loading loading-dots loading-xs text-base-content/40" />
              )}
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="font-mono text-[11px] text-base-content/20 tracking-wider bg-primary/[0.03] border border-base-content/10 rounded-full px-2.5 py-1"
            animate={isClosing ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {truncated}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
