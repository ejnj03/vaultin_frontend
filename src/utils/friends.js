import { openDB } from "idb";

const db = await openDB("friends", 2, {
    upgrade(db, oldVersion) {
        if (oldVersion < 1) {
            const store = db.createObjectStore("requests", {
                keyPath: ["requesterUsername", "recieverUsername"],
            });
            store.createIndex("by-requester", "requesterUsername")
            store.createIndex("by-reciever", "recieverUsername")
        }
        if (oldVersion < 2) {
            const contacts = db.createObjectStore("contacts", {
                keyPath: ["user", "friendUser"],
            });
            contacts.createIndex("by-user", "user")
        }
    },
});

export async function get_friend_usernames(username) {
    const tx = db.transaction("contacts")
    const index = tx.store.index("by-user")
    const contacts = await index.getAll(username)
    return contacts.map(c => c.friendUser)
}

export async function get_sent_requests(apiCall, username, onUpdate) {
    const tx = db.transaction("requests")
    const index = tx.store.index("by-requester")
    const cached = await index.getAll(username)

    if (cached.length > 0) {
        onUpdate(cached)
    }

    const res = await apiCall('friends/get-sent', { service: 'payments' })

    if (!("error" in res)) {
        const writeTx = db.transaction("requests", "readwrite")
        const oldSent = await writeTx.store.index("by-requester").getAll(username)
        for (const old of oldSent) await writeTx.store.delete([old.requesterUsername, old.recieverUsername])
        for (const req of res) await writeTx.store.put(req)
        await writeTx.done
        onUpdate(res)
    }

    return
}

export async function get_received_requests(apiCall, username, onUpdate) {
    const tx = db.transaction("requests")
    const index = tx.store.index("by-reciever")
    const cached = await index.getAll(username)

    if (cached.length > 0) {
        onUpdate(cached)
    }

    const res = await apiCall('friends/get-recieved', { service: 'payments' })

    if (!("error" in res)) {
        const writeTx = db.transaction("requests", "readwrite")
        const oldRecv = await writeTx.store.index("by-reciever").getAll(username)
        for (const old of oldRecv) await writeTx.store.delete([old.requesterUsername, old.recieverUsername])
        for (const req of res) await writeTx.store.put(req)
        await writeTx.done
        onUpdate(res)
    }

    return
}

export async function accept_request(apiCall, request, username) {
    // 1. Optimistically update request status in IDB
    await db.put("requests", { ...request, status: "accepted" })

    // 2. Create contact entries both ways in IDB
    const friendUser = request.requesterUsername
    const contactsTx = db.transaction("contacts", "readwrite")
    await contactsTx.store.put({ user: username, friendUser })
    await contactsTx.store.put({ user: friendUser, friendUser: username })
    await contactsTx.done

    // 3. API call to accept on the backend
    const res = await apiCall('friends/accept-friend-request', { method: 'POST', body: { friend_username: friendUser }, ret_error: true, service: 'payments' })

    // 4. Background refresh requests to sync IDB with backend
    get_received_requests(apiCall, username, () => {})

    return res
}

export async function decline_request(apiCall, request, username) {
    // 1. Optimistically update request status in IDB
    await db.put("requests", { ...request, status: "rejected" })

    // 2. API call to reject on the backend
    const friendUser = request.requesterUsername
    const res = await apiCall('friends/reject-friend-request', { method: 'POST', body: { friend_username: friendUser }, ret_error: true, service: 'payments' })

    // 3. Background refresh requests to sync IDB with backend
    get_received_requests(apiCall, username, () => {})

    return res
}

export async function cancel_request(apiCall, request, username) {
    // 1. Optimistically update request status in IDB
    await db.put("requests", { ...request, status: "canceled" })

    // 2. API call to cancel on the backend
    const friendUser = request.recieverUsername
    const res = await apiCall('friends/friend-request/cancel', { method: 'POST', body: { friend_username: friendUser }, ret_error: true, service: 'payments' })

    // 3. Background refresh requests to sync IDB with backend
    get_sent_requests(apiCall, username, () => {})

    return res
}


export async function get_friends(apiCall, username, onUpdate) {
    const tx = db.transaction("contacts")
    const index = tx.store.index("by-user")
    const cached = await index.getAll(username)

    if (cached.length > 0) {
        onUpdate(cached)
    }

    const res = await apiCall('friends/user-friends', { service: 'payments' })

    if (!("error" in res)) {
        const mapped = res.map(f => ({
            user: f.username,
            friendUser: f.friendUsername,
            createdAt: f.createdAt
        }))
        const writeTx = db.transaction("contacts", "readwrite")
        const oldContacts = await writeTx.store.index("by-user").getAll(username)
        for (const old of oldContacts) await writeTx.store.delete([old.user, old.friendUser])
        for (const contact of mapped) await writeTx.store.put(contact)
        await writeTx.done
        onUpdate(mapped)
    }

    return
}
