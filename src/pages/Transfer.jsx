import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseUnits } from "viem";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const API_URL = import.meta.env.VITE_AUTH_LAMBDA

async function resolveRecipient(input) {
  if (input.startsWith("@")) {
    //use without the @
    const username = input.slice(1)
    const res = await fetch(`${API_URL}/find-addr/${username}`, {credentials: "include"})
    if (!res.ok) throw new Error("Username not found");
    const data = await res.json()
    console.log("fetched: ", data)
    return data.address
  }
  //already a wallet address
  return input
}

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

export default function Transfer() {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  const { isConnected } = useAccount();
  //get these results (i.e., if resp = usewritecon.., then writeContract = resp.writeContract, resp.error,... etc)
  // uses data: hash -> = hash = resp.data
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function handleSend() {
    if (!to || !amount) return;
    const addr = await resolveRecipient(to)
    writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [addr, parseUnits(amount, 6)],
    });
  }

  if (!isConnected) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Send USDC</h1>
        <p>Connect your wallet to send payments.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Send USDC</h1>

      <div className="mb-4">
        <label className="block text-sm mb-2">Recipient Address or Handle</label>
        <input
          type="text"
          placeholder="0x... or @...."
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm mb-2">Amount (USDC)</label>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

      <button
        onClick={handleSend}
        disabled={isPending || isConfirming || !to || !amount}
        className="btn btn-primary w-full"
      >
        {isPending ? "Confirm in wallet..." : isConfirming ? "Confirming..." : "Send USDC"}
      </button>

      {isSuccess && (
        <div className="alert alert-success mt-4">
          <p>Payment sent!</p>
          
          <a href={`https://etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Etherscan
          </a>
        </div>
      )}

      {error && (
        <div className="alert alert-error mt-4">
          <p>{error.message}</p>
        </div>
      )}
    </div>
  );
}