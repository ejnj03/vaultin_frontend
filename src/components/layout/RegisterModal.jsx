import { useState } from 'react';
import { useApi } from '../../hooks/useApi';

export default function RegisterModal({ onRegistered }) {
  const { apiCall } = useApi();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiCall('auth/register/register-user', {
        method: 'POST',
        body: { username: input.trim() },
        ret_error: true
      });

      if (data.error) {
        setError(data.error || 'Registration failed');
        return;
      }

      setRegisteredName(data.username);
      setRegistered(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 rounded-xl p-8 shadow-xl w-full max-w-md mx-4">
        {registered ? (
          <>
            <h2 className="text-xl font-bold text-center mb-2">Welcome to Vaultin!</h2>
            <p className="text-base-content/60 text-center text-sm mb-6">
              You're all set, @{registeredName}.
            </p>
            <button
              className="btn btn-primary w-full"
              onClick={() => onRegistered(registeredName)}
            >
              Close
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-center mb-2">Welcome to Vaultin!</h2>
            <p className="text-base-content/60 text-center text-sm mb-6">
              Please choose a username to get started.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="join w-full mb-3">
                <span className="join-item flex items-center px-3 bg-base-200 border border-base-content/20 border-r-0 rounded-l-lg text-base-content/50 select-none">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="input input-bordered join-item w-full"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-error text-sm mb-3">{error}</p>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading || !input.trim()}
              >
                {loading ? <span className="loading loading-spinner loading-sm" /> : 'Register'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
