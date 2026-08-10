import { get_res } from "../utils/api_utils";

async function upload_photo(selectedFile) {
    //upload photo to s3 through getting authorized link -> upload to link -> set profile to link
    const file_type = selectedFile.type.split('/')[1];
    const { link: uploadLink } = await get_res('profile/upload-url', { params: file_type });
    const upload_res = await fetch(uploadLink, { method: 'PUT', body: selectedFile });
    if (!upload_res.ok) throw new Error(`S3 upload failed: ${upload_res.status}`);
    await get_res('profile/update-photo', { method: 'POST', body: { type: file_type } });
}

export async function register_profile(data, setRegistering, setRegistered) {
    console.log("registering profile: ", data)
    setRegistering(true)
    //upload photo if specified 
    if ("photo" in data) {
        await upload_photo(data.photo)
    }

    //construct call body
    const body = {}
    body.username = data.username
    body.name = data.name
    body.configs = {"approvals": data.approvals, "confirmations": data.confirmations}
    if ("receiveNetwork" in data) {
        body.recieveNetwork = data.recieveNetwork
    }
    if ("receiveToken" in data) {
        body.receiveToken = data.receiveToken
    }

    const res = await get_res("auth/register/register-user", {"method": "POST", body})
    
    setRegistering(false)
    setRegistered(true)
    console.log("registered profile")
}

