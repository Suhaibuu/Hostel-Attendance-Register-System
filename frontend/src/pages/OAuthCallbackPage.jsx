import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Cloud, Loader2, XCircle } from 'lucide-react';
import { handleOAuthCallback } from '../api/backup';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handledRef = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const authError = searchParams.get('error');

    if (authError) {
      setError(authError);
      setTimeout(() => {
        navigate(`/admin?oauth=error&msg=${encodeURIComponent(authError)}`, { replace: true });
      }, 3000);
      return;
    }

    if (!code) {
      setError('No authorization code found in URL.');
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 3000);
      return;
    }

    if (handledRef.current) return;
    handledRef.current = true;

    const processOAuth = async () => {
      try {
        const origin = window.location.origin;
        const redirectUri = `${origin}/admin/oauth/callback`;
        
        await handleOAuthCallback(code, redirectUri);
        
        // Success: Redirect to admin panel with success flag
        navigate('/admin?oauth=success', { replace: true });
      } catch (err) {
        console.error('OAuth Callback Error:', err);
        setError(err.message || 'Failed to authenticate with Google');
        setTimeout(() => {
          navigate(`/admin?oauth=error&msg=${encodeURIComponent(err.message || 'Authentication failed')}`, { replace: true });
        }, 3000);
      }
    };

    processOAuth();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-premium text-center">
        {!error ? (
          <div className="space-y-6">
            <div className="relative mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
              <Cloud className="w-10 h-10 text-blue-500" />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-800">Connecting Google Drive</h2>
              <p className="text-sm text-slate-500 font-medium">
                Finalizing authentication... Please wait while we securely connect your account.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black text-red-700">Connection Failed</h2>
              <p className="text-sm text-red-600 font-medium">
                {error}
              </p>
              <p className="text-xs text-slate-500 mt-4">
                Redirecting back to settings...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
