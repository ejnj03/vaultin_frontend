import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";

const API_URL = import.meta.env.VITE_AUTH_LAMBDA;
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
];

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function StatusBadge({ status }) {
  const styles = {
    pending: "badge-warning",
    approved: "badge-success",
    rejected: "badge-error",
    canceled: "badge-ghost",
    completed: "badge-info",
  };
  return (
    <span className={`badge badge-sm ${styles[status] || "badge-ghost"}`}>
      {status}
    </span>
  );
}

function ActionButtons({ reqId, onAction }) {
  const [loading, setLoading] = useState(null);

  async function handle(action) {
    setLoading(action);
    try {
      await respondRequest(reqId, action);
      onAction(reqId, action);
    } catch (err) {
      console.error("Action failed:", err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-1">
      <button
        className="btn btn-success btn-outline btn-xs"
        disabled={!!loading}
        onClick={() => handle("approve")}
      >
        {loading === "approve" ? <span className="loading loading-spinner loading-xs" /> : "Approve"}
      </button>
      <button
        className="btn btn-error btn-outline btn-xs"
        disabled={!!loading}
        onClick={() => handle("reject")}
      >
        {loading === "reject" ? <span className="loading loading-spinner loading-xs" /> : "Deny"}
      </button>
    </div>
  );
}

function CancelButton({ reqId, onCancel }) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      await cancelRequest(reqId);
      onCancel(reqId);
    } catch (err) {
      console.error("Cancel failed:", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="btn btn-error btn-outline btn-xs"
      disabled={loading}
      onClick={handle}
    >
      {loading ? <span className="loading loading-spinner loading-xs" /> : "Cancel"}
    </button>
  );
}

const PENDING_TX_KEY = "vaultin_pending_txs";

function getPendingTxs() {
  try { return JSON.parse(localStorage.getItem(PENDING_TX_KEY) || "{}"); }
  catch { return {}; }
}

function savePendingTx(reqId, hash) {
  const txs = getPendingTxs();
  txs[reqId] = hash;
  localStorage.setItem(PENDING_TX_KEY, JSON.stringify(txs));
}

function removePendingTx(reqId) {
  const txs = getPendingTxs();
  delete txs[reqId];
  localStorage.setItem(PENDING_TX_KEY, JSON.stringify(txs));
}

function CompleteButton({ req, onComplete }) {
  // check if there's a pending tx from a previous session
  const savedHash = getPendingTxs()[req.requestId];

  const { writeContract, data: writeHash, error, isPending } = useWriteContract();
  const hash = writeHash || savedHash;
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: hash || undefined });

  // save hash to localStorage as soon as we get it from the wallet
  useEffect(() => {
    if (writeHash) {
      savePendingTx(req.requestId, writeHash);
    }
  }, [writeHash]);

  // once tx confirms, call the backend and update UI
  useEffect(() => {
    if (isSuccess && hash) {
      completedRequest(req.requestId)
        .then(() => {
          removePendingTx(req.requestId);
          onComplete(req.requestId, hash);
        })
        .catch((err) => console.error("Complete API failed:", err.message));
    }
  }, [isSuccess, hash]);

  function handlePay() {
    writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [req.requesterAddress, parseUnits(req.amount, 6)],
    });
  }

  if (isSuccess) {
    return <span className="btn btn-success btn-xs btn-disabled">Paid</span>;
  }

  // resuming from a saved hash or waiting for current tx
  if (isConfirming || savedHash) {
    return (
      <button className="btn btn-info btn-outline btn-xs" disabled>
        <span className="loading loading-spinner loading-xs" /> Confirming...
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        className="btn btn-primary btn-outline btn-xs"
        disabled={isPending}
        onClick={handlePay}
      >
        {isPending ? <><span className="loading loading-spinner loading-xs" /> Confirm in wallet...</> : "Pay"}
      </button>
      {error && <span className="text-error text-xs truncate max-w-[150px]" title={error.message}>Failed</span>}
    </div>
  );
}

function RequestTable({ requests, emptyMessage, userColumn, onAction, onCancel, onComplete }) {
  if (!requests.length) {
    return (
      <div className="text-center py-8 text-base-content/40 text-sm">
        {emptyMessage}
      </div>
    );
  }

  const hasActions = onAction || onCancel || onComplete;

  return (
    <div className="overflow-x-auto">
      <table className="table table-sm">
        <thead>
          <tr className="text-base-content/50">
            <th>{userColumn.label}</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Time</th>
            {hasActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.requestId} className="hover">
              <td className="font-medium">@{req[userColumn.key]}</td>
              <td className="font-mono">{req.amount} {req.currency}</td>
              <td><StatusBadge status={req.status} /></td>
              <td className="text-base-content/50 text-xs">{timeAgo(req.timestamp)}</td>
              {onAction && (
                <td><ActionButtons reqId={req.requestId} onAction={onAction} /></td>
              )}
              {onCancel && (
                <td><CancelButton reqId={req.requestId} onCancel={onCancel} /></td>
              )}
              {onComplete && (
                <td><CompleteButton req={req} onComplete={onComplete} /></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompletedTable({ requests, emptyMessage, userColumn }) {
  if (!requests.length) {
    return (
      <div className="text-center py-8 text-base-content/40 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-sm">
        <thead>
          <tr className="text-base-content/50">
            <th>{userColumn.label}</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Time</th>
            <th>Transaction</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.requestId} className="hover">
              <td className="font-medium">@{req[userColumn.key]}</td>
              <td className="font-mono">{req.amount} {req.currency}</td>
              <td><StatusBadge status={req.status} /></td>
              <td className="text-base-content/50 text-xs">{timeAgo(req.timestamp)}</td>
              <td>
                {req.txHash ? (
                  <a
                    href={`https://etherscan.io/tx/${req.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-info btn-outline btn-xs"
                  >
                    View Txn
                  </a>
                ) : (
                  <span className="text-base-content/30 text-xs">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusSection({ title, requests, userColumn, badge, onAction, onCancel, onComplete, completed }) {
  return (
    <div className="bg-base-200 rounded-xl">
      <div className="px-5 pt-4 pb-3 border-b border-base-content/5 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        {badge}
      </div>
      <div className="pb-2">
        {completed ? (
          <CompletedTable
            requests={requests}
            emptyMessage={`No ${title.toLowerCase()}.`}
            userColumn={userColumn}
          />
        ) : (
          <RequestTable
            requests={requests}
            emptyMessage={`No ${title.toLowerCase()}.`}
            userColumn={userColumn}
            onAction={onAction}
            onCancel={onCancel}
            onComplete={onComplete}
          />
        )}
      </div>
    </div>
  );
}

//---- functions for actions -----//
async function respondRequest(reqId, action) {
    const res = await fetch(`${API_URL}/respond-request`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({"requestId": reqId, "action": action}),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || "Request failed")
    }
}

async function cancelRequest(reqId) {
    const res = await fetch(`${API_URL}/cancel-request`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({"requestId": reqId}),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || "Request failed")
    }
}

async function completedRequest(reqId) {
    const res = await fetch(`${API_URL}/completed-request`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({"requestId": reqId}),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || "Request failed")
    }
}

export default function Dashboard() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loadingIn, setLoadingIn] = useState(true);
  const [loadingOut, setLoadingOut] = useState(true);
  const [tab, setTab] = useState("incoming");

  useEffect(() => {
    async function fetchIncoming() {
      try {
        const res = await fetch(`${API_URL}/to-user-requests`, { credentials: "include" });
        const data = await res.json();
        setIncoming(data.requests || []);
      } catch (err) {
        console.warn("Failed to fetch incoming requests:", err);
      } finally {
        setLoadingIn(false);
      }
    }

    async function fetchOutgoing() {
      try {
        const res = await fetch(`${API_URL}/from-user-requests`, { credentials: "include" });
        const data = await res.json();
        setOutgoing(data.requests || []);
      } catch (err) {
        console.warn("Failed to fetch outgoing requests:", err);
      } finally {
        setLoadingOut(false);
      }
    }

    fetchIncoming();
    fetchOutgoing();
  }, []);

  const loading = tab === "incoming" ? loadingIn : loadingOut;
  const requests = tab === "incoming" ? incoming : outgoing;
  const userCol = tab === "incoming"
    ? { key: "requesterUsername", label: "From" }
    : { key: "recipientUsername", label: "To" };

  const pendingReqs = requests.filter((r) => r.status === "pending");
  const approvedReqs = requests.filter((r) => r.status === "approved");
  const rejectedReqs = requests.filter((r) => r.status === "rejected");
  const canceledReqs = requests.filter((r) => r.status === "canceled");
  const completedReqs = requests.filter((r) => r.status === "completed");

  const pendingIncoming = incoming.filter((r) => r.status === "pending").length;
  const pendingOutgoing = outgoing.filter((r) => r.status === "pending").length;

  // update a request's status in the incoming state after approve/deny
  function handleIncomingAction(reqId, action) {
    setIncoming((prev) =>
      prev.map((r) =>
        r.requestId === reqId ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r
      )
    );
  }

  // update a request's status in the outgoing state after cancel
  function handleOutgoingCancel(reqId) {
    setOutgoing((prev) =>
      prev.map((r) =>
        r.requestId === reqId ? { ...r, status: "canceled" } : r
      )
    );
  }

  // update a request's status to completed with tx hash
  function handleComplete(reqId, txHash) {
    setIncoming((prev) =>
      prev.map((r) =>
        r.requestId === reqId ? { ...r, status: "completed", txHash } : r
      )
    );
  }

  function CountBadge({ count }) {
    if (!count) return null;
    return <span className="badge badge-sm badge-primary">{count}</span>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat bg-base-200 rounded-xl p-4">
          <div className="stat-title text-xs">Incoming</div>
          <div className="stat-value text-2xl">{incoming.length}</div>
        </div>
        <div className="stat bg-base-200 rounded-xl p-4">
          <div className="stat-title text-xs">Pending Incoming</div>
          <div className="stat-value text-2xl text-warning">{pendingIncoming}</div>
        </div>
        <div className="stat bg-base-200 rounded-xl p-4">
          <div className="stat-title text-xs">Sent</div>
          <div className="stat-value text-2xl">{outgoing.length}</div>
        </div>
        <div className="stat bg-base-200 rounded-xl p-4">
          <div className="stat-title text-xs">Pending Sent</div>
          <div className="stat-value text-2xl text-warning">{pendingOutgoing}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200 mb-6 w-fit">
        <button
          className={`tab ${tab === "incoming" ? "tab-active" : ""}`}
          onClick={() => setTab("incoming")}
        >
          Incoming Requests
          {pendingIncoming > 0 && <span className="badge badge-sm badge-warning ml-2">{pendingIncoming}</span>}
        </button>
        <button
          className={`tab ${tab === "outgoing" ? "tab-active" : ""}`}
          onClick={() => setTab("outgoing")}
        >
          Requests Made
          {pendingOutgoing > 0 && <span className="badge badge-sm badge-warning ml-2">{pendingOutgoing}</span>}
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : (
        <div className="space-y-6">
          <StatusSection
            title="Pending"
            requests={pendingReqs}
            userColumn={userCol}
            badge={<CountBadge count={pendingReqs.length} />}
            onAction={tab === "incoming" ? handleIncomingAction : undefined}
            onCancel={tab === "outgoing" ? handleOutgoingCancel : undefined}
          />
          <StatusSection
            title="Approved"
            requests={approvedReqs}
            userColumn={userCol}
            badge={<CountBadge count={approvedReqs.length} />}
            onComplete={tab === "incoming" ? handleComplete : undefined}
          />
          <StatusSection
            title="Completed"
            requests={completedReqs}
            userColumn={userCol}
            badge={<CountBadge count={completedReqs.length} />}
            completed
          />
          <StatusSection
            title="Rejected"
            requests={rejectedReqs}
            userColumn={userCol}
            badge={<CountBadge count={rejectedReqs.length} />}
          />
          {tab === "outgoing" && (
            <StatusSection
              title="Canceled"
              requests={canceledReqs}
              userColumn={userCol}
              badge={<CountBadge count={canceledReqs.length} />}
            />
          )}
        </div>
      )}
    </div>
  );
}
