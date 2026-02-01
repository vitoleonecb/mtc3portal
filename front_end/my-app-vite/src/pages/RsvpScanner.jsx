import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';

export function RsvpScanner() {
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken');

  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const lastTokenRef = useRef(null);
  const lastTimeRef = useRef(0);

  const ensureAdminSession = () => {
    if (!accessToken) {
      setError('Admin login required to scan RSVPs.');
      return false;
    }
    return true;
  };

  const parseTokenFromScan = (value) => {
    if (!value) return null;
    const text = typeof value === 'string' ? value : value[0]?.rawValue;
    if (!text) return null;

    try {
      if (text.startsWith('http://') || text.startsWith('https://')) {
        const url = new URL(text);
        const segments = url.pathname.split('/').filter(Boolean);
        const tokenIndex = segments.findIndex((seg, idx) => seg === 'rsvp' && segments[idx + 1] === 'checkin');
        if (tokenIndex >= 0 && segments[tokenIndex + 2]) {
          return segments[tokenIndex + 2];
        }
        return segments[segments.length - 1] || null;
      }
    } catch {
      // fall through to raw text
    }

    return text;
  };

  const handleDecode = useCallback(
    async (value) => {
      if (busy) return;
      if (!ensureAdminSession()) return;

      const token = parseTokenFromScan(value);
      if (!token) return;

      const now = Date.now();
      if (lastTokenRef.current === token && now - lastTimeRef.current < 2000) {
        return;
      }
      lastTokenRef.current = token;
      lastTimeRef.current = now;

      try {
        setBusy(true);
        setError(null);
        setStatus('Checking in attendee...');

        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/workshops/rsvp/checkin/${encodeURIComponent(token)}`,
          null,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        const data = res.data;
        const attendee = data.attendee;
        const workshop = data.workshop;

        const name = attendee
          ? `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim() || attendee.username
          : 'Attendee';
        const workshopName = workshop?.name || 'Workshop';

        if (data.alreadyCheckedIn) {
          setStatus(`${name} was already checked in for ${workshopName}.`);
        } else {
          setStatus(`Checked in ${name} for ${workshopName}.`);
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Admin login required to scan RSVPs.');
        } else if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('Unable to check in attendee.');
        }
      } finally {
        setBusy(false);
      }
    },
    [accessToken, busy],
  );

  const handleError = useCallback((err) => {
    console.error('QR scanner error:', err);
    setError('Camera error while scanning.');
  }, []);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="EdgeBox" style={{ maxWidth: '640px' }}>
      <h1 className="workshopCardName" style={{ marginBottom: '0.75rem' }}>
        RSVP Scanner
      </h1>

      <p className="RSVPDetailText" style={{ marginBottom: '0.75rem' }}>
        Hold a participant's RSVP QR code in front of the camera to check them in.
      </p>

      {!accessToken && (
        <button
          type="button"
          className="logInButton"
          onClick={handleGoToLogin}
          style={{ marginBottom: '0.75rem' }}
        >
          Admin login
        </button>
      )}

      <div style={{ width: '100%', maxWidth: 480, aspectRatio: '3 / 4', marginBottom: '0.75rem' }}>
        <Scanner
          onScan={handleDecode}
          onError={handleError}
          constraints={{ facingMode: 'environment' }}
          scanDelay={300}
          styles={{
            container: { width: '100%', height: '100%' },
            video: { width: '100%', height: '100%', borderRadius: '12px' },
          }}
        />
      </div>

      {status && (
        <p className="RSVPDetailText" style={{ marginBottom: '0.5rem' }}>
          {status}
        </p>
      )}

      {error && (
        <p style={{ color: 'var(--accent-red, #b00020)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
