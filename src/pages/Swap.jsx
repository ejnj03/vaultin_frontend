import { useState } from "react";
import { SUPPORTED_TOKENS } from "../utils/constants";

export default function Swap() {
  const [toAmount, settoAmount] = useState('1.00');
  const [fromNetwork, setfromNetwork] = useState('');
  const [fromToken, setfromToken] = useState('');
  const [toNetwork, settoNetwork] = useState('');
  const [toToken, settoToken] = useState('');

  const handleSubmit = (e) => {
    //prevent page reload
    e.preventDefault()
    if (toAmount == '' || toNetwork == '' || toToken == '' || fromNetwork == '' || fromToken == '') {
      console.log("invalid submission")
      return
    }
    console.log(toAmount, fromNetwork, fromToken, toNetwork, toToken)
  };
  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Swap</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* From section */}
        <div className="bg-base-200 rounded-xl p-4 space-y-3">
          <label className="text-sm font-medium text-base-content/60">From</label>
          <div className="flex gap-2">
            <select
              className="select select-bordered flex-1"
              value={fromNetwork}
              onChange={(e) => {
                setfromNetwork(e.target.value);
                setfromToken('');
              }}
            >
              <option value="" disabled>Network</option>
              {Object.keys(SUPPORTED_TOKENS).map((opt) => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
            <select
              className="select select-bordered flex-1"
              value={fromToken}
              onChange={(e) => setfromToken(e.target.value)}
            >
              <option value="" disabled>Token</option>
              {(SUPPORTED_TOKENS[fromNetwork] || []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap direction arrow */}
        <div className="flex justify-center">
          <div className="bg-base-200 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-base-content/50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
            </svg>
          </div>
        </div>

        {/* To section */}
        <div className="bg-base-200 rounded-xl p-4 space-y-3">
          <label className="text-sm font-medium text-base-content/60">To</label>
          <div className="mb-3">
            <input
              type="number"
              placeholder="0.00"
              value={toAmount}
              onChange={(e) => settoAmount(e.target.value)}
              className="input input-bordered w-full text-lg"
              step="any"
              min="0"
            />
          </div>
          <div className="flex gap-2">
            <select
              className="select select-bordered flex-1"
              value={toNetwork}
              onChange={(e) => {
                settoNetwork(e.target.value);
                settoToken('');
              }}
            >
              <option value="" disabled>Network</option>
              {Object.keys(SUPPORTED_TOKENS).map((opt) => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
            <select
              className="select select-bordered flex-1"
              value={toToken}
              onChange={(e) => settoToken(e.target.value)}
            >
              <option value="" disabled>Token</option>
              {(SUPPORTED_TOKENS[toNetwork] || []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={!toAmount || !fromNetwork || !fromToken || !toNetwork || !toToken}
        >
          Swap
        </button>
      </form>
    </div>
  );
}
