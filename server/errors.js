// One error type for everything that can go wrong on the server.
// `code` is machine readable, `message` is plain words the UI can show as is.

export const MESSAGES = {
  BAD_INPUT: "Please check what you typed.",
  TIMEOUT: "The AI took too long to answer.",
  PROVIDER_ERROR: "We couldn't reach the AI service.",
  RATE_LIMITED: "The AI service is busy. Wait a moment and try again.",
  EMPTY_OUTPUT: "The AI sent back an empty reply.",
  INVALID_OUTPUT: "The AI's reply didn't pass our checks.",
};

const STATUS = {
  BAD_INPUT: 400,
  TIMEOUT: 504,
  PROVIDER_ERROR: 502,
  RATE_LIMITED: 429,
  EMPTY_OUTPUT: 502,
  INVALID_OUTPUT: 502,
};

export class ApiError extends Error {
  constructor(code, message = MESSAGES[code], retryable = code !== "BAD_INPUT") {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.status = STATUS[code] || 500;
  }
}

export function toEnvelope(error) {
  const known = error instanceof ApiError;
  return {
    status: known ? error.status : 500,
    body: {
      ok: false,
      error: {
        code: known ? error.code : "PROVIDER_ERROR",
        message: known ? error.message : "Something went wrong on our side.",
        retryable: known ? error.retryable : true,
      },
    },
  };
}
