import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AmbientBackground from "../common/AmbientBackground";

const STEPS = [
  { key: "wallet", label: "Wallet Connected" },
  { key: "loading", label: "Loading Your Data" },
  { key: "registry", label: "Checking Registry" },
];

const RING_EASE = [0.2, 0, 0, 1];

/**
 * Auth loading overlay with "vault opens" exit transition.
 *
 * Props:
 *  - authStep: "wallet" | "loading" | "registry" | null
 *  - address: wallet address string
 *  - username: string | null (determines welcome text)
 *  - onTransitionDone: () => void — called when exit animation completes
 */
export default function VaultAuthLoading({ authStep, address, username, onTransitionDone }) {
  const [phase, setPhase] = useState("loading"); // "loading" | "completing" | "opening" | "done"
  const currentIndex = STEPS.findIndex((s) => s.key === authStep);

  const truncated = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  // When authStep becomes null, start the exit sequence
  const startedRef = useRef(false);
  useEffect(() => {
    if (authStep !== null || startedRef.current) return;
    startedRef.current = true;

    // Beat 1: mark all steps done, swap status text
    setPhase("completing");

    // Beat 2: expand rings outward (longer hold so "Welcome back" is readable)
    const t1 = setTimeout(() => setPhase("opening"), 600);

    // Done: signal parent to unmount us
    const t2 = setTimeout(() => {
      setPhase("done");
      onTransitionDone?.();
    }, 1350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [authStep, onTransitionDone]);

  const isCompleting = phase === "completing" || phase === "opening" || phase === "done";
  const isOpening = phase === "opening" || phase === "done";
  const isDone = phase === "done";

  const statusText =
    isCompleting
      ? (username ? "Welcome back" : "Let's get you set up")
      : authStep === "wallet" ? "Connecting wallet"
      : authStep === "loading" ? "Loading your data"
      : authStep === "registry" ? "Checking registry"
      : "";

  if (isDone) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-base-100 flex items-center justify-center overflow-hidden"
      animate={{ opacity: isOpening ? 0 : 1 }}
      transition={{ duration: 0.35, delay: isOpening ? 0.35 : 0, ease: "easeInOut" }}
    >
      <AmbientBackground />

      {/* Scan beam */}
      {!isCompleting && (
        <div
          className="fixed left-0 right-0 h-px pointer-events-none z-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, oklch(64% 0.155 152 / 0) 20%, oklch(64% 0.155 152 / 0.25) 50%, oklch(64% 0.155 152 / 0) 80%, transparent 100%)",
            animation: "auth-scan 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s",
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Wordmark */}
        <motion.div
          className="flex items-baseline mb-13"
          animate={isOpening ? { opacity: 0, y: -10 } : {}}
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
              animation: !isCompleting ? "auth-glow-pulse 2s ease-in-out infinite" : undefined,
            }}
            animate={isOpening ? { opacity: 0, scale: 1.5 } : {}}
            transition={{ duration: 0.3 }}
          />

          {/* Outer ring — expands outward on "opening" */}
          <motion.div
            className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-primary/20"
            style={{
              animation: !isOpening ? "auth-spin-cw 8s linear infinite" : undefined,
            }}
            animate={isOpening ? { scale: 8, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={isOpening ? { duration: 0.5, ease: RING_EASE } : {}}
          >
            <motion.div
              className="absolute -inset-[1.5px] rounded-full border-[1.5px] border-transparent border-t-primary"
              style={{
                animation: !isOpening
                  ? "auth-spin-cw 1.8s cubic-bezier(0.6, 0, 0.4, 1) infinite"
                  : undefined,
              }}
            />
          </motion.div>

          {/* Inner ring — expands outward on "opening" */}
          <motion.div
            className="absolute inset-3 rounded-full border border-primary/[0.08]"
            style={{
              animation: !isOpening ? "auth-spin-ccw 4s linear infinite" : undefined,
            }}
            animate={isOpening ? { scale: 5, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={isOpening ? { duration: 0.5, ease: RING_EASE } : {}}
          >
            <motion.div
              className="absolute -inset-px rounded-full border border-transparent border-b-primary/40"
              style={{
                animation: !isOpening
                  ? "auth-spin-ccw 2.4s cubic-bezier(0.6, 0, 0.4, 1) infinite"
                  : undefined,
              }}
            />
          </motion.div>

          {/* Center V — fades out with rings during opening */}
          <motion.span
            className="relative z-10 text-lg font-extrabold tracking-tight text-primary"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isOpening ? { opacity: 0, scale: 1.15 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            V
          </motion.span>
        </div>

        {/* Status text — cross-fades on completion */}
        <div className="flex flex-col items-center gap-2.5">
          <AnimatePresence mode="wait">
            <motion.div
              key={isCompleting ? "complete" : "loading"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium text-base-content/40 tracking-wide h-5 flex items-center gap-1.5"
            >
              {statusText}
              {!isCompleting && (
                <span className="loading loading-dots loading-xs text-base-content/40" />
              )}
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="font-mono text-[11px] text-base-content/20 tracking-wider bg-primary/[0.03] border border-base-content/10 rounded-full px-2.5 py-1"
            animate={isCompleting ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {truncated}
          </motion.div>
        </div>

        {/* Step indicators — fade out downward with stagger on completion */}
        <div className="flex flex-col gap-2 mt-10 w-[220px]">
          {STEPS.map((step, i) => {
            const allDone = isCompleting;
            const stepDone = allDone || i < currentIndex;
            const isActive = !allDone && i === currentIndex;

            return (
              <motion.div
                key={step.key}
                animate={isCompleting ? { opacity: 0, y: 12 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: isCompleting ? i * 0.06 : 0 }}
                className={`flex items-center gap-2.5 px-3 py-[7px] rounded-lg transition-colors duration-300 ${
                  isActive ? "bg-primary/[0.04]" : ""
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-400 ${
                    stepDone
                      ? "bg-primary"
                      : isActive
                        ? "bg-primary shadow-[0_0_6px] shadow-primary"
                        : "bg-base-content/10"
                  }`}
                  style={isActive ? { animation: "auth-pip-pulse 1.2s ease-in-out infinite" } : undefined}
                />
                <span
                  className={`text-xs font-mono tracking-wide transition-colors duration-300 ${
                    stepDone
                      ? "text-base-content/20"
                      : isActive
                        ? "text-base-content/40"
                        : "text-base-content/10"
                  }`}
                >
                  {step.label}
                </span>
                <span
                  className={`ml-auto text-[11px] text-primary transition-all duration-300 ${
                    stepDone ? "opacity-70 scale-100" : "opacity-0 scale-50"
                  }`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                >
                  ✓
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
