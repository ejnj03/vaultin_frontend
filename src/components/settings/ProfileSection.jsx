import { useRef, useState, useEffect, useCallback } from "react";
import { useAccount, useDisconnect } from 'wagmi';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { NETWORKS, TOKENS, CONFIRMATION_OPTIONS, APPROVAL_OPTIONS, SETTINGS_LABELS, SETTINGS_DEFAULTS } from '../onboarding/constants';

const SECTION_LABEL = "text-[10px] font-mono font-bold uppercase tracking-widest text-base-content/20 mb-2.5";

function CopyIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
  );
}

function LogOutIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}

function PillToggle({ value, onChange, options }) {
  return (
    <div className="flex rounded-full bg-base-content/[0.04] p-0.5">
      {options.map((opt) => (
        <div key={opt.value} className="relative group">
          <button
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
              value === opt.value
                ? "bg-primary text-primary-content shadow-sm"
                : "text-base-content/30 hover:text-base-content/50"
            }`}
          >
            {opt.label}
          </button>
          {opt.desc && (
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-bottom z-50">
              <div className="relative px-3 py-2 rounded-xl bg-base-300 border border-base-content/10 shadow-[0_8px_24px_rgba(0,0,0,0.4)] max-w-[220px] w-max">
                <p className="text-[11px] leading-snug text-base-content/60 text-center">{opt.desc}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2.5 h-2.5 rotate-45 bg-base-300 border-r border-b border-base-content/10" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ProfileSection() {
  const { apiCall } = useApi();
  const { logout } = useAuth();
  const { disconnect } = useDisconnect();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const { userData, profileAvatar } = useUser();
  const [photoPreview, setPhotoPreview] = useState(null);
  const { address } = useAccount();
  console.log(userData)
  const [prefs, setPrefs] = useState(userData?.configs ?? {});

  const setPref = (key, value) => setPrefs(p => ({ ...p, [key]: value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setSelectedFile(file);
  };

  useEffect(() => {
    if (!selectedFile) return;
    const uploadPhoto = async () => {
      setUploading(true);
      try {
        const file_type = selectedFile.type.split('/')[1];
        const { link: uploadLink } = await apiCall('profile/upload-url', { params: file_type });
        const upload_res = await fetch(uploadLink, { method: 'PUT', body: selectedFile });
        if (!upload_res.ok) throw new Error(`S3 upload failed: ${upload_res.status}`);
        await apiCall('profile/update-photo', { method: 'POST', body: { type: file_type } });
      } catch (err) {
        console.error('Photo upload failed:', err);
      } finally {
        setUploading(false);
        setSelectedFile(null);
      }
    };
    uploadPhoto();
  }, [selectedFile]);

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const copyAddress = useCallback(() => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 1500);
  }, [address]);

  const copyUsername = useCallback(() => {
    navigator.clipboard.writeText(`@${userData?.username}`);
    setCopiedUser(true);
    setTimeout(() => setCopiedUser(false), 1500);
  }, [userData?.username]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setShowDisconnectConfirm(false);
  }, [disconnect]);

  return (
    <div className="space-y-5">
      {/* ── Identity Card ── */}
      <div className="bg-base-200 rounded-2xl border border-base-content/5 overflow-hidden">
        {/* Banner */}
        <div className="h-24 relative overflow-hidden">
          {/* Layer 1: diagonal gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d2818] via-[#091a10] to-[#061009]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-black/10" />
          {/* Layer 2: fractal noise */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
              backgroundSize: '128px 128px',
            }}
          />
          {/* Layer 3: scanlines */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
            }}
          />
          {/* Green radial glow — bottom-left */}
          <div
            className="absolute -bottom-6 -left-6 w-48 h-32 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, oklch(64% 0.155 152 / 0.08), transparent 70%)' }}
          />
        </div>

        {/* Avatar + name */}
        <div className="px-6 pb-5">
          <div className="flex items-end gap-4 -mt-9 mb-3">
            <div className="relative group shrink-0">
              <div className="w-[76px] h-[76px] rounded-full border-[3px] border-base-100 shadow-[0_0_0_1px] shadow-base-content/10 overflow-hidden bg-base-300">
                {(photoPreview || profileAvatar) ? (
                  <img src={photoPreview || profileAvatar} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-base-content/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-9 h-9">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
              </button>
              <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
            </div>
            <div className="pb-1 min-w-0">
              <h2 className="text-base font-bold leading-tight text-base-content truncate">{userData?.name || "Anonymous"}</h2>
              <p className="text-xs font-mono text-base-content/30 mt-0.5">@{userData?.username}</p>
              {uploading && <p className="text-[11px] text-primary mt-0.5">Uploading...</p>}
            </div>
          </div>

          {/* Wallet row */}
          <div className="flex items-center justify-between py-3 border-t border-base-content/5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-base-content/20">Wallet</span>
            <button
              type="button"
              onClick={copyAddress}
              className="flex items-center gap-1.5 text-sm font-mono text-base-content/50 hover:text-base-content transition-colors"
            >
              {truncatedAddress}
              {copiedAddr ? (
                <span className="text-[11px] text-primary font-sans">Copied!</span>
              ) : (
                <CopyIcon className="w-3.5 h-3.5 opacity-40" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Share Profile ── */}
      <div className="bg-base-200 rounded-2xl border border-base-content/5 p-5">
        <h3 className="text-sm font-semibold text-base-content/60 mb-1">Share Profile</h3>
        <p className="text-xs text-base-content/25 mb-3">Friends can add you by your username</p>
        <button
          type="button"
          onClick={copyUsername}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary/80 hover:text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-full transition-colors"
        >
          @{userData?.username}
          {copiedUser ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-success">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          ) : (
            <CopyIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ── Transaction Preferences ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <p className={SECTION_LABEL.replace('mb-2.5', '')}>Transaction preferences</p>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-base-content/20">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="bg-base-200 rounded-2xl border border-base-content/5 divide-y divide-base-content/5 opacity-50 pointer-events-none">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-base-content/50">{SETTINGS_LABELS.confirmations}</span>
            <PillToggle
              value={prefs.confirmations}
              onChange={(v) => setPref("confirmations", v)}
              options={CONFIRMATION_OPTIONS.map(o => ({ value: o.id, label: o.label, desc: o.desc }))}
            />
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-base-content/50">{SETTINGS_LABELS.approvals}</span>
            <PillToggle
              value={prefs.approvals}
              onChange={(v) => setPref("approvals", v)}
              options={APPROVAL_OPTIONS.map(o => ({ value: o.id, label: o.label, desc: o.desc }))}
            />
          </div>
        </div>
      </div>

      {/* ── Receive Defaults ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <p className={SECTION_LABEL.replace('mb-2.5', '')}>Receive defaults</p>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-base-content/20">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="bg-base-200 rounded-2xl border border-base-content/5 divide-y divide-base-content/5 opacity-50 pointer-events-none">
          {/* Network chips */}
          <div className="flex items-center justify-between px-5 py-4 gap-3">
            <span className="text-sm text-base-content/50 shrink-0">{SETTINGS_LABELS.receiveNetwork}</span>
            <div className="flex flex-wrap justify-end gap-1.5">
              {NETWORKS.map((net) => {
                const active = prefs.receiveNetwork === net.id;
                return (
                  <button
                    key={net.id}
                    type="button"
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                      active
                        ? "text-white shadow-sm"
                        : "bg-base-content/[0.04] text-base-content/25"
                    }`}
                    style={active ? { backgroundColor: net.color } : undefined}
                  >
                    {net.label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Token chips */}
          <div className="flex items-center justify-between px-5 py-4 gap-3">
            <span className="text-sm text-base-content/50 shrink-0">{SETTINGS_LABELS.receiveToken}</span>
            <div className="flex flex-wrap justify-end gap-1.5">
              {TOKENS.map((tok) => {
                const active = prefs.receiveToken === tok.id;
                return (
                  <button
                    key={tok.id}
                    type="button"
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                      active
                        ? "bg-primary text-primary-content shadow-sm"
                        : "bg-base-content/[0.04] text-base-content/25"
                    }`}
                  >
                    {tok.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Disconnect ── */}
      <div className="border-t border-base-content/5 pt-4">
        <button
          type="button"
          onClick={() => setShowDisconnectConfirm(true)}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/10 px-3 py-2 -mx-3 rounded-lg transition-colors"
        >
          <LogOutIcon className="w-3.5 h-3.5" />
          Disconnect Wallet
        </button>
      </div>

      {/* Disconnect confirmation modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDisconnectConfirm(false)} />
          <div className="relative bg-base-200 border border-base-content/10 rounded-2xl p-6 w-full max-w-xs text-center" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            <div className="w-10 h-10 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-3">
              <LogOutIcon className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-base-content mb-1">Disconnect Wallet</h3>
            <p className="text-xs text-base-content/40 mb-5">Are you sure you want to disconnect your wallet?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDisconnectConfirm(false)}
                className="flex-1 text-sm font-medium py-2 rounded-xl bg-base-content/5 hover:bg-base-content/10 text-base-content transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex-1 text-sm font-medium py-2 rounded-xl bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/30 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
