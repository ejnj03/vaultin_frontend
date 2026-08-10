import { useState, useEffect } from "react";

import AmbientBackground from "../components/common/AmbientBackground";
import Logo from "../components/layout/Logo";
import StepTrack from "../components/onboarding/StepTrack";
import StepProfile from "../components/onboarding/StepProfile";
import StepConfirmations from "../components/onboarding/StepConfirmations";
import StepApprovals from "../components/onboarding/StepApprovals";
import StepReceive from "../components/onboarding/StepReceive";
import DoneScreen from "../components/onboarding/DoneScreen";

import { register_profile } from "../utils/register_user";
import { useUser } from "../contexts/UserContext";
import { Navigate } from "react-router-dom";

export default function Onboarding() {
  const { userData } = useUser();
  if (userData?.username) return <Navigate to="/dashboard" replace />;
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState({});
  const [done, setDone] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false)
  const go = (n) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    console.log(data)
  };

  useEffect(() => {
    if (done) {
      register_profile(data, setRegistering, setRegistered)
    }
  }, [done])

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-base-100 relative overflow-hidden">
      <AmbientBackground />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-9 animate-[ob-drop_0.45s_ease_both]">
          <Logo size="lg" />
        </div>

        {!(done && registered) ? (
          <>
            <StepTrack current={step} />
            <div className="w-full bg-base-200 border border-base-content/10 rounded-[22px] p-7 relative overflow-hidden shadow-[0_28px_70px_rgba(0,0,0,0.55),0_0_0_1px_oklch(64%_0.155_152_/_0.025)] animate-[ob-scale_0.28s_ease_both]">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

              {step === 0 && <StepProfile data={data} setData={setData} onNext={() => go(1)} dir={dir} />}
              {step === 1 && <StepConfirmations data={data} setData={setData} onNext={() => go(2)} onBack={() => go(0)} dir={dir} />}
              {step === 2 && <StepApprovals data={data} setData={setData} onNext={() => go(3)} onBack={() => go(1)} dir={dir} />}
              {step === 3 && <StepReceive data={data} setData={setData} onFinish={() => setDone(true)} onBack={() => go(2)} dir={dir} registering={registering} />}
            </div>
          </>
        ) : (
          <DoneScreen data={data} />
        )}
      </div>
    </div>
  );
}
