import { SiweMessage } from "siwe";

const API_URL = "https://9djqt1k5r5.execute-api.us-east-1.amazonaws.com"

//get requests shouldnt modify anything, so logout is fetch
//allow credentials allows server-side to modify cookies and client side to send cookies
export async function login(address, signMessageAsync) {
    //runs whenever an account is connected
    //request the backend for a nonce
    console.log("running login")
    const res = await fetch(`${API_URL}/nonce`, {credentials: "include"})
    const nonceData = await res.json()
    //console.log("nonce response:", nonceData)
    const { nonce } = nonceData
    //generate a msg with the nonce
    const message = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: "Sign in to Vaultin.app",
        uri: window.location.origin,
        version: "1",
        chainId: 1,
        nonce: nonce
    })
    
    //popup for signing the message
    //turns siwe msg into human readable string that gets shown in the wallet signing popup
    const signature = await signMessageAsync({
        message: message.prepareMessage(),
    });

    const verifyRes = await fetch(`${API_URL}/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
            message: message.prepareMessage(),
            signature: signature,
        }),
    })

    const data = await verifyRes.json()

    console.log("Login Successful. Wallet Address", data.address)
    //console.log(data)
    return data
}

export async function logout() {
    //runs clearing cookie (jws token) access
    try {
        await fetch(`${API_URL}/logout`, {
            method: "POST",
            credentials: "include",
        });
        console.log("Successfully revoked access token")
    } catch (err) {
        console.warn("Logout request failed:", err);
    }
}