import jwt from 'jsonwebtoken';

export function createGuestWorkshopToken(secret, { userId, email, workshopId }) {
  return jwt.sign({ purpose: 'guest_workshop', userId: Number(userId), email: email.toLowerCase(), workshopId: Number(workshopId) }, secret, { expiresIn: '7d' });
}

export function verifyGuestWorkshopToken(token, secret) {
  try {
    const payload = jwt.verify(token, secret);
    if (payload.purpose !== 'guest_workshop' || !Number.isInteger(payload.userId) || payload.userId <= 0
      || !Number.isInteger(payload.workshopId) || payload.workshopId <= 0 || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}

export function guestWorkshopContinueUrl(appBaseUrl, workshopId, token) {
  const id = Number(workshopId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('A valid workshop ID is required for the guest continue link.');
  }

  const url = new URL(appBaseUrl);
  url.pathname = '/';
  url.search = '';
  url.searchParams.set('workshopId', String(id));
  if (token) url.searchParams.set('guestToken', token);
  url.hash = 'workshop-preview';
  return url.toString();
}

export function guestWorkshopRegistrationUrl(appBaseUrl, { workshopId, token }) {
  const url = new URL(appBaseUrl);
  url.pathname = '/register';
  url.search = '';
  if (token) url.searchParams.set('guestToken', token);
  if (Number.isInteger(Number(workshopId)) && Number(workshopId) > 0) {
    url.searchParams.set('previewWorkshopId', String(workshopId));
  }
  url.hash = '';
  return url.toString();
}
