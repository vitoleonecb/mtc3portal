// Centralized error classification for the overlay error module.
//
// This is intentionally simple and focused on mapping common axios
// failures to a small set of user-facing messages. Callers can pass a
// `hint` in the second argument to bias which definition is used.

export const ERROR_DEFINITIONS = {
  WORKSHOP_CREATE_FAILED: {
    title: "We couldn't create that workshop",
    body: "Check the details and try again.",
  },
  PROMPTS_SAVE_FAILED: {
    title: "Saving prompts failed",
    body: "Your new prompts weren't saved. Try again in a moment.",
  },
  NETWORK: {
    title: "Connection problem",
    body: "We couldn't reach the server. Please check your connection and try again.",
  },
  AUTH: {
    title: "Permission issue",
    body: "You may need to log in again or check your account permissions.",
  },
  SERVER: {
    title: "Server error",
    body: "The server ran into a problem. Try again shortly.",
  },
  VALIDATION: {
    title: "Something about that doesn't look right",
    body: "Please review the fields and try again.",
  },
  UNKNOWN: {
    title: "Something went wrong",
    body: "We hit an unexpected error.",
  },
};

export function classifyError(error, options = {}) {
  const status = error?.response?.status;
  const serverMsg = error?.response?.data?.message;
  const serverCode = error?.response?.data?.code;
  const network = !error?.response && !!error?.request;

  let key = options.hint || null;

  if (!key) {
    if (network) key = "NETWORK";
    else if (status === 401 || status === 403) key = "AUTH";
    else if (status === 400 || status === 422) key = "VALIDATION";
    else if (typeof status === "number" && status >= 500) key = "SERVER";
    else key = "UNKNOWN";
  }

  return {
    key,
    status,
    serverMsg,
    serverCode,
    network,
    raw: error,
    ...options,
  };
}
