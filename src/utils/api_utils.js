const AUTH_API_URL = import.meta.env.VITE_AUTH_LAMBDA
const PAYMENTS_API_URL = import.meta.env.VITE_PAYMENTS_LAMBDA

export async function get_res(path, { method = 'GET', params = null, body = {}, credentials = 'include', service = 'auth', ret_error = false, accessToken = null } = {}) {
    const api_url = service === 'payments' ? PAYMENTS_API_URL : AUTH_API_URL
    let api_path = `${api_url}/${path}`

    const headers = {}
    if (accessToken) headers['authorization'] = `Bearer ${accessToken}`

    if (method === 'GET') {
        if (params) api_path += `/${params}`
        const res = await fetch(api_path, { method, credentials, headers })
        if (!res.ok && !ret_error) {
            throw new Error(`${path} api error: ${res.status}`)
        }
        return await res.json()
    }

    if (method === 'POST') {
        headers['Content-Type'] = 'application/json'
        const res = await fetch(api_path, {
            method,
            credentials,
            headers,
            body: JSON.stringify(body)
        })
        if (!res.ok && !ret_error) {
            throw new Error(`${path} api error: ${res.status}`)
        }
        return await res.json()
    }
}
