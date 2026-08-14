import { openDB } from "idb";
import { alchemyInstances } from './alchemy';
import { mergeTransfers } from './transferProcessing';

const NETWORKS = Object.keys(alchemyInstances);

const DB_VERSION = 3;
const db = await openDB("txn_history", DB_VERSION, {
    upgrade(db, oldVersion) {
        if (oldVersion < 3) {
            // Wipe old stores and recreate with composite key
            if (db.objectStoreNames.contains("transfers")) db.deleteObjectStore("transfers");
            if (db.objectStoreNames.contains("meta")) db.deleteObjectStore("meta");

            const store = db.createObjectStore("transfers", {
                keyPath: ["network", "hash"],
            });
            store.createIndex("by-owner", "ownerAddress");
            db.createObjectStore("meta");
        }
    },
});

// Alchemy supports the 'internal' category on Ethereum, Polygon and Base.
// Arbitrum and Optimism still reject it ("The 'internal' category is not
// supported for this network"), verified 2026-08-14.
//
// This matters beyond completeness: a swap that pays out native ETH delivers it
// as an internal transfer. Without that leg, mergeTransfers only sees the sent
// side and labels the swap as a plain send to the router, so it renders as
// "External" plus a contract address instead of as a swap.
const INTERNAL_SUPPORTED = new Set(['ethereum', 'polygon', 'base']);

// Fetch transfers for a single network
async function fetchNetworkTransfers(networkId, address, fromBlock) {
    const alchemy = alchemyInstances[networkId];
    const categories = INTERNAL_SUPPORTED.has(networkId)
        ? ["erc20", "external", "internal"]
        : ["erc20", "external"];
    const fetchOpts = {
        category: categories,
        order: "desc",
        withMetadata: true,
        ...(fromBlock && { fromBlock }),
    };

    const [sentAlchemy, receivedAlchemy] = await Promise.all([
        alchemy.core.getAssetTransfers({ ...fetchOpts, fromAddress: address }),
        alchemy.core.getAssetTransfers({ ...fetchOpts, toAddress: address }),
    ]);
    console.log("transfers: ", sentAlchemy, receivedAlchemy)
    return { sentAlchemy, receivedAlchemy, networkId };
}

// txns/get-completed returns what was recorded when a transfer was sent.
//
// Two response shapes are accepted. Historically the endpoint returned
// { hash: title } as a bare string; it now returns an object per hash carrying
// the counterparty as well. Both are handled so the frontend can ship ahead of
// the backend, and so entries already cached under the old shape are upgraded
// in place rather than requiring the IDB to be cleared.
//
// The counterparty matters because same-chain cross-token transfers route
// through Uniswap: on-chain the router is the counterparty for both parties, so
// the only record of who was actually paid is the one written at send time.
//
// Returns only the fields that are missing and available, so callers can spread
// it and an empty object means nothing to update.
function sidecarFields(record, existing) {
    if (!record) return {};
    const { title, fromUser, toUser } =
        typeof record === 'string' ? { title: record } : record;

    const fields = {};
    if (title && !existing.title) fields.title = title;
    if (fromUser && !existing.fromUser) fields.fromUser = fromUser;
    if (toUser && !existing.toUser) fields.toUser = toUser;
    return fields;
}

export async function get_transfers(apiCall, address, onUpdate) {
    // 1. Read all cached from IDB
    const readTx = db.transaction("transfers");
    const index = readTx.store.index("by-owner");
    const cached = await index.getAll(address);

    if (cached.length > 0) {
        cached.sort((a, b) => new Date(b.metadata.blockTimestamp) - new Date(a.metadata.blockTimestamp));
        onUpdate(cached);
    }

    // 2. Fetch from all networks in parallel
    const networkFetches = await Promise.all(
        NETWORKS.map(async (networkId) => {
            const metaKey = `lastBlock:${address}:${networkId}`;
            const lastBlock = await db.get("meta", metaKey);
            const fromBlock = lastBlock ? `0x${(lastBlock + 1).toString(16)}` : undefined;
            try {
                return await fetchNetworkTransfers(networkId, address, fromBlock);
            } catch (err) {
                console.warn(`Failed to fetch ${networkId} transfers:`, err);
                return null;
            }
        })
    );

    // 3. Merge transfers per network, tag with network field
    let allNewTransfers = [];
    const allSentAlchemy = [];
    const allReceivedAlchemy = [];

    for (const result of networkFetches) {
        if (!result) continue;
        const { sentAlchemy, receivedAlchemy, networkId } = result;
        allSentAlchemy.push(...sentAlchemy.transfers);
        allReceivedAlchemy.push(...receivedAlchemy.transfers);
        const networkTransfers = mergeTransfers(sentAlchemy, receivedAlchemy, networkId);
        allNewTransfers.push(...networkTransfers);
    }

    // 4. Fetch per-transaction metadata recorded when the transfer was sent
    const db_titles = await apiCall("txns/get-completed", { service: 'payments' });

    // 5. Write new transfers to IDB with per-network block checkpoints
    const writeTx = db.transaction(["transfers", "meta"], "readwrite");
    const highestBlocks = {};

    for (const transfer of allNewTransfers) {
        const updated = { ...transfer, ownerAddress: address, ...sidecarFields(db_titles[transfer.hash], transfer) };
        await writeTx.objectStore("transfers").put(updated);

        const blockNum = parseInt(transfer.blockNum, 16);
        const net = transfer.network;
        if (!highestBlocks[net] || blockNum > highestBlocks[net]) {
            highestBlocks[net] = blockNum;
        }
    }

    // Backfill cached entries. Also covers entries cached before counterparty
    // identity was recorded, and entries whose title was written under the old
    // response shape, so an existing IDB does not need clearing.
    for (const entry of cached) {
        const fields = sidecarFields(db_titles[entry.hash], entry);
        if (Object.keys(fields).length > 0) {
            await writeTx.objectStore("transfers").put({ ...entry, ...fields });
        }
    }

    // Save per-network block checkpoints
    for (const [networkId, blockNum] of Object.entries(highestBlocks)) {
        const metaKey = `lastBlock:${address}:${networkId}`;
        const prev = await writeTx.objectStore("meta").get(metaKey);
        if (blockNum > (prev || 0)) {
            await writeTx.objectStore("meta").put(blockNum, metaKey);
        }
    }
    await writeTx.done;

    // 6. Return full merged list (cached + new, deduplicated by network+hash)
    const allByKey = new Map();
    for (const t of cached) allByKey.set(`${t.network}:${t.hash}`, t);
    for (const t of allNewTransfers) allByKey.set(`${t.network}:${t.hash}`, { ...t, ownerAddress: address });
    for (const [, t] of allByKey) {
        if (!t.title && t.hash in db_titles) {
            t.title = db_titles[t.hash];
        }
    }
    const merged = [...allByKey.values()];
    merged.sort((a, b) => new Date(b.metadata.blockTimestamp) - new Date(a.metadata.blockTimestamp));

    onUpdate(merged);

    return { merged, sentAlchemy: { transfers: allSentAlchemy }, receivedAlchemy: { transfers: allReceivedAlchemy } };
}

export async function get_transfer(network, hash) {
    return db.get("transfers", [network, hash]);
}

export async function update_gas_fees(fees) {
    const tx = db.transaction("transfers", "readwrite");
    for (const [key, gasFee] of Object.entries(fees)) {
        // key format: "network:hash"
        const [network, hash] = key.split(":", 2);
        const transfer = await tx.store.get([network, hash]);
        if (transfer) await tx.store.put({ ...transfer, gasFee });
    }
    await tx.done;
}
