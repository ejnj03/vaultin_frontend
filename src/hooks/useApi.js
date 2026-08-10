import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { get_res } from '../utils/api_utils';

export function useApi() {
  const { accessToken, getaccessToken, refreshing, login, checking } = useAuth();

  const apiCall = useCallback(async (path, options = {}) => {
    const data = await get_res(path, { ...options, accessToken, ret_error: true });
    //console.log(data)
    if (
      !("error_code" in data)
      || (
        data["error_code"] !== "ExpiredSignatureError"
        && (
          //logged in but temporarily no access token due to refreshing state
          data["error_code"] !== "No access token in auth header"
          &&
          sessionStorage.getItem("siwe_logged_in")
        )
      )
    ) {
      //if "error" in data throw
      console.log("response is valid: ", data)
      return data;
    }
    console.log("signature expired")
    // Token expired — try to refresh or re-login
    let newToken = null;
    if (options.service === 'payments') {
      if (!refreshing) {
        const res = await getaccessToken();
        if (!res) {
          // refresh token also expired, full re-login
          newToken = await login();
        } else {
          newToken = res;
        }
      }
    } else {
      if (!checking) {
        newToken = await login();
      }
    }

    if (!newToken) return data;
    const updated = await get_res(path, { ...options, accessToken: newToken, ret_error: true });
    console.log("with updated token: ", updated)
    return updated
  }, [accessToken, getaccessToken, refreshing, login, checking]);

  return { apiCall };
}
