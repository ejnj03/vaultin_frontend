import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";

const API_URL = import.meta.env.VITE_AUTH_LAMBDA

function isUsername(input) {
  if (input.startsWith("@")) {
    return [true, input.slice(1)]
  }
  return [false, null]
}

export default function Requests() {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [isPending, setisPending] = useState(false)
  const [isSuccess, setisSuccess] = useState(false)
  const [error, setError] = useState(null)
  const { isConnected } = useAccount();

  async function handleRequest() {
    if (!to || !amount) return;
    const [is_username, username] = isUsername(to)
    const req_body = {"amount": amount}
    if (is_username) {
      req_body["recipientUsername"] = username
    } else {
      req_body["recipientAddress"] = to
    }
    setError(null)
    setisPending(true) 
    const res = await fetch(`${API_URL}/request-payment`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify(req_body),
    })
    setisPending(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Request Failed")
      //throw new Error(data.error || "Request failed")
    } else {
      setisSuccess(true)
    }
  }

  if (!isConnected) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Request USDC</h1>
        <p>Connect your wallet to request payments.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Request USDC</h1>

      <div className="mb-4">
        <label className="block text-sm mb-2">Address or Handle to send request to</label>
        <input
          type="text"
          placeholder="0x... or @...."
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm mb-2">Amount</label>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

      <button
        onClick={handleRequest}
        disabled={isPending || !to || !amount}
        className="btn btn-primary w-full"
      >
        {isPending ? "Creating Request..." : "Send Request"}
      </button>

      {isSuccess && (
        <div className="alert alert-success mt-4">
          <p>Request Sent!</p>
        </div>
      )}
      {error && (
        <div className="alert alert-error mt-4">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}