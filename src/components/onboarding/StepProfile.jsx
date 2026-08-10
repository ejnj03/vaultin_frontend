import { useState, useRef } from "react";
import { SLIDE_FWD, SLIDE_BACK, FwdIcon } from "./constants";
import { get_res } from "../../utils/api_utils";
function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M4.5 6V4a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function classifyUsername(val) {
  if (!val || val.length === 0) return null;
  if (val.length < 3)           return "too_short";
  if (val.startsWith("_") || val.endsWith("_")) return "leading_underscore";
  if (val.includes("__"))       return "double_underscore";
  return "valid";
}

function ConstraintPill({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10.5px] font-mono transition-colors duration-200
      ${ok ? "text-primary/60" : "text-base-content/40"}`}>
      <span className={`w-[5px] h-[5px] rounded-full shrink-0 transition-colors duration-200
        ${ok ? "bg-primary/60" : "bg-base-content/35"}`} />
      {label}
    </span>
  );
}

export default function StepProfile({ data, setData, onNext, dir }) {
  const fileRef = useRef(null);
  const [preview, setPreview]   = useState(data.photoPreview || null);
  const [errors,  setErrors]    = useState({});
  const [hasTyped, setHasTyped] = useState(!!data.username);

  const username = data.username || "";
  const usernameClass = classifyUsername(username);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setData((d) => ({ ...d, photo: file, photoPreview: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleUsernameChange = (e) => {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setData((d) => ({ ...d, username: raw }));
    setHasTyped(true);
    setErrors((err) => ({ ...err, username: null }));
  };

  const handleNext = async () => {
    const e = {};
    if (!username || username.length < 3)  e.username = "At least 3 characters";
    else if (usernameClass !== "valid")     e.username = "Check format below";
    else {
      const exists = await get_res("auth/validate-username", {params:username, method:"GET", ret_error:true})
      if ("error" in exists) {
        e.username = "Username is already taken"
      } 
    }
    if (!data.name || !data.name.trim())   e.name = "Display name is required";
    if (Object.keys(e).length) { setErrors(e); return; }
    onNext();
  };

  const showConstraints = hasTyped && username.length > 0;
  const showPermanentNotice = usernameClass === "valid" && username.length >= 3;

  const lenOk    = username.length >= 3 && username.length <= 20;
  const noLeadUn = username.length > 0 && !username.startsWith("_") && !username.endsWith("_");
  const noDblUn  = username.length > 0 && !username.includes("__");

  return (
    <div className={dir >= 0 ? SLIDE_FWD : SLIDE_BACK}>
      <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-base-content/40 mb-2.5">
        Step 1 of 4
      </div>
      <div className="text-[19px] font-bold tracking-tight text-base-content leading-tight mb-6">
        Set up your identity.
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6 gap-2">
        <div
          onClick={() => fileRef.current.click()}
          className={`w-[76px] h-[76px] rounded-full cursor-pointer overflow-hidden flex items-center justify-center transition-all duration-200
            ${preview
              ? "border-2 border-solid border-primary shadow-[0_0_20px_oklch(64%_0.155_152_/_0.12)]"
              : "border-2 border-dashed border-base-content/20 hover:border-base-content/30 bg-base-100"
            }`}
        >
          {preview ? (
            <img src={preview} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" className="text-base-content/30">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          )}
        </div>
        <span
          onClick={() => fileRef.current.click()}
          className="text-[11.5px] text-base-content/40 cursor-pointer hover:text-base-content/55 transition-colors"
        >
          {preview ? "Change photo" : "Add profile photo · optional"}
        </span>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
      </div>

      {/* Username */}
      <div className="mb-1.5">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-base-content/40 mb-1.5">
          Username
        </label>
        <div className={`flex items-center rounded-lg overflow-hidden transition-colors duration-200 bg-base-100
          ${errors.username
            ? "border-[1.5px] border-error"
            : username && usernameClass === "valid"
              ? "border-[1.5px] border-base-content/15"
              : "border-[1.5px] border-base-content/10"
          } focus-within:border-base-content/20`}
        >
          <span className="px-3 font-mono font-bold text-[15px] text-base-content/30 select-none border-r border-base-content/10 self-stretch flex items-center">
            @
          </span>
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            placeholder="yourhandle"
            maxLength={20}
            className="bg-transparent border-none outline-none text-sm font-mono text-base-content px-3.5 py-3 w-full placeholder:text-base-content/25 placeholder:font-sans"
          />
          {hasTyped && username.length > 0 && (
            <span className={`pr-3 font-mono text-[11px] shrink-0 tabular-nums
              ${username.length > 17 ? "text-warning/70" : "text-base-content/30"}`}>
              {username.length}/20
            </span>
          )}
        </div>

        {errors.username && (
          <div className="text-[11px] text-error mt-1.5 flex items-center gap-1">
            <span>{"⚠"}</span> {errors.username}
          </div>
        )}

        {showConstraints && usernameClass !== "valid" && !errors.username && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <ConstraintPill ok={lenOk}    label="3–20 chars" />
            <ConstraintPill ok={noLeadUn} label="no leading/trailing _" />
            <ConstraintPill ok={noDblUn}  label="no double __" />
          </div>
        )}

        {showPermanentNotice && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-base-content/40">
            <LockIcon />
            <span>Usernames can't be changed after setup</span>
          </div>
        )}
      </div>

      {/* Display name */}
      <div className="mt-4 mb-6">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-base-content/40 mb-1.5">
          Display name
        </label>
        <input
          type="text"
          value={data.name || ""}
          onChange={(e) => {
            setData((d) => ({ ...d, name: e.target.value }));
            setErrors((err) => ({ ...err, name: null }));
          }}
          placeholder="How others will see you"
          className={`w-full bg-base-100 rounded-lg text-sm text-base-content px-3.5 py-3 outline-none transition-colors duration-200
            placeholder:text-base-content/25
            ${errors.name
              ? "border-[1.5px] border-error"
              : data.name
                ? "border-[1.5px] border-base-content/15"
                : "border-[1.5px] border-base-content/10"
            } focus:border-base-content/20`}
        />
        {errors.name && (
          <div className="text-[11px] text-error mt-1.5">{"⚠"} {errors.name}</div>
        )}
      </div>

      <button
        onClick={handleNext}
        className="btn btn-primary w-full rounded-xl text-sm font-bold shadow-[0_0_28px_oklch(64%_0.155_152_/_0.2)] hover:shadow-[0_0_38px_oklch(64%_0.155_152_/_0.3)] flex items-center justify-center gap-1.5"
      >
        Continue <FwdIcon />
      </button>
    </div>
  );
}
