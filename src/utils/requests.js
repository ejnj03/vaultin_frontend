import { openDB } from "idb";

const db = await openDB("payment_requests", 2, {
    upgrade(db, oldVersion) {
        if (oldVersion >= 1) {
            db.deleteObjectStore("requests");
        }
        const store = db.createObjectStore("requests", {
            keyPath: "requestId",
        });
        store.createIndex("by-requester", "requesterUsername");
        store.createIndex("by-recipient", "recipientUsername");
    },
});

export async function create_request(apiCall, { title, recipientUsername, amount, network, token }) {
    const res = await apiCall("payment-requests/create-request", {
        method: "POST",
        body: { title, recipientUsername, amount, network, token },
        service: 'payments',
    });
    console.log("res: ", res)
    if (!("error" in res)) {
        const reqRow = res.requestRow
        await db.put("requests", reqRow);
        return reqRow
    }

    return res;
}

export async function get_sent_requests(apiCall, username, onUpdate) {
    const cached = await db.getAllFromIndex("requests", "by-requester", username);
    if (cached.length > 0) {
        cached.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        onUpdate(cached);
    }

    const res = await apiCall("payment-requests/sent", { service: 'payments' });
    const reqs = Array.isArray(res) ? res : res?.requests;
    if (Array.isArray(reqs)) {
        const writeTx = db.transaction("requests", "readwrite");
        for (const req of reqs) await writeTx.store.put(req);
        await writeTx.done;
        onUpdate(reqs);
    }
}

export async function get_received_requests(apiCall, username, onUpdate) {
    const cached = await db.getAllFromIndex("requests", "by-recipient", username);
    if (cached.length > 0) {
        cached.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        onUpdate(cached);
    }

    const res = await apiCall("payment-requests/received", { service: 'payments' });
    const reqs = Array.isArray(res) ? res : res?.requests;
    if (Array.isArray(reqs)) {
        const writeTx = db.transaction("requests", "readwrite");
        for (const req of reqs) await writeTx.store.put(req);
        await writeTx.done;
        onUpdate(reqs);
    }
}
