import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { updateStatus } from "../../utils/transactions";
import { useApi } from '../../hooks/useApi';
export default function TransactionsTable({ direction }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const publicClient = usePublicClient();
    const { apiCall } = useApi();

    useEffect(() => {
        apiCall(`txns-${direction}`, { service: 'payments' })
            .then((result) => {
                setData(result.txns);
                setLoading(false);
            });
    }, []);

    // Poll on-chain status for "submitted" transactions
    useEffect(() => {
        if (!publicClient || data.length === 0) return;

        const interval = setInterval(() => {
            data.forEach((tx) => {
                if (tx.status !== "submitted") return;

                publicClient.getTransactionReceipt({ hash: tx.txnHash })
                    .then((receipt) => {
                        const newStatus = receipt.status === "success" ? "confirmed" : "failed";
                        updateStatus(apiCall, tx.txnHash, newStatus)
                        setData((prev) =>
                            prev.map((row) =>
                                row.txnHash === tx.txnHash
                                    ? { ...row, status: newStatus }
                                    : row
                            )
                        );
                    })
                    .catch(() => {
                        // Transaction still pending — no receipt yet
                    });
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [data, publicClient]);
    return (
        <div>
            {loading ? (
                <span>Loading...</span>
            ) : data.length === 0 ? (
                <span>No transactions found</span>
            ) : (
                <table className="table table-zebra">
                    <thead>
                    <tr>
                        <th>Title</th>
                        <th>Sender<span className="px-5">→</span>Recipient</th>
                        <th>Sent<span className="px-5">→</span>Recieved</th>
                        <th>Network</th>
                        <th>Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map((row) => (
                        <tr key={row.txnHash}>
                        <td>{row.title}</td>
                        <td>{row.fromUser}<span className="px-5">→</span>{row.toUser}</td>
                        <td>
                            {row.toToken == row.fromToken ? row.toAmount : _}<span className="px-1"></span>{row.fromToken}
                            <span className="px-5">→</span>
                            {row.toAmount}<span className="px-1"></span>{row.toToken}
                        </td>
                        <td>{row.fromNetwork}<span className="px-5">→</span>{row.toNetwork}</td>
                        <td>{row.status}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}