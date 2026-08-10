import { SiweMessage } from "siwe";
import { get_res } from './api_utils';

//get requests shouldnt modify anything, so logout is fetch
//allow credentials allows server-side to modify cookies and client side to send cookies
export async function login(address, signMessageAsync) {
    //runs whenever an account is connected
    //request the backend for a nonce
    console.log("running login")
    const nonceData = await get_res('auth/nonce')
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

    const data = await get_res('auth/verify', {
        method: 'POST',
        body: {
            message: message.prepareMessage(),
            signature: signature,
        }
    })

    console.log("Login Successful. Wallet Address", data.address)
    //should include the access token
    return data
}

export async function logout() {
    //runs clearing cookie (jws token) access
    try {
        await get_res('auth/logout', { method: 'POST' })
        console.log("Successfully revoked access token")
    } catch (err) {
        console.warn("Logout request failed:", err);
    }
}

export async function check_registered() {
    try {
        //const data = await get_res('auth/utils/find-username')
        const res = await get_res('auth/utils/lookup-userData')
        const data = res.data
        console.log("Successfully fetched registeration status: ", data)
        return data
    } catch (err) {
        console.warn("Check registered request failed:", err);
    }
}