import { openDB } from "idb"
import blockies from 'ethereum-blockies-base64'

const db = await openDB("users", 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 2) {
      if (db.objectStoreNames.contains("profiles")) {
        db.deleteObjectStore("profiles")
      }
      const store = db.createObjectStore("profiles", {
        keyPath: "username",
      });
      store.createIndex("by-address", "address")
    }
  },
});

export async function profile_from_address(apiCall, address, onUpdate) {
    const profiles = db.transaction("profiles")
    const by_addr = profiles.store.index("by-address")
    const cached = await by_addr.get(address);

    if (cached !== undefined) {
        onUpdate(cached);
    }

    const res = await apiCall('users/by-address', { params: address, service: 'payments' });

    if (!("error" in res)) {
        await db.put("profiles", res);
        onUpdate(res);
    }

    return;
}

export async function search_profiles(query, onUpdate) {
    const q = query.toLowerCase()
    const all = await db.getAll("profiles")
    const matches = all.filter(p =>
        p.username.toLowerCase().includes(q) ||
        (p.address && p.address.toLowerCase().includes(q))
    )
    if (matches.length > 0) onUpdate(matches)
}

function withAvatar(profile) {
    profile.avatar = (profile.profile_photo && profile.profile_photo !== '')
        ? profile.profile_photo
        : profile.address
            ? blockies(profile.address)
            : null;
    return profile;
}

// Build address→profile map for a list of friend usernames.
// Resolves uncached profiles via API in the background.
// Every profile includes an `avatar` field (profile_photo or blockies fallback).
export async function get_contact_profiles(apiCall, friendUsernames) {
    const map = {};
    const uncached = [];

    for (const uname of friendUsernames) {
        const profile = await db.get("profiles", uname);
        if (profile?.address) {
            map[profile.address.toLowerCase()] = withAvatar(profile);
        } else {
            uncached.push(uname);
        }
    }

    // Fetch uncached profiles in parallel
    if (uncached.length > 0) {
        await Promise.all(uncached.map(async (uname) => {
            try {
                const res = await apiCall("users/by-username", { params: uname, service: 'payments' });
                if (!("error" in res)) {
                    await db.put("profiles", res);
                    if (res.address) map[res.address.toLowerCase()] = withAvatar(res);
                }
            } catch { /* skip */ }
        }));
    }

    return map;
}

export async function profile_from_username(apiCall, username, onUpdate) {
    const cached = await db.get("profiles", username);

    if (cached !== undefined) {
        onUpdate(cached); // immediately provide cached data
    }

    const res = await apiCall("users/by-username", { params: username, service: 'payments' });

    if (!("error" in res)) {
        await db.put("profiles", res);
        onUpdate(res); // later provide fresh data
    }

    return;
}
