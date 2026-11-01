'use strict';
// Throw these from services/controllers; middleware/errorHandler.js turns them into
// the standard JSON error response:
//   { "error": { "code", "message", "details"?, "requestId" } }

class HttpError extends Error {
  constructor(statusCode, message, { code = 'ERROR', details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

class BadRequestError extends HttpError {
  constructor(message = 'Bad request', options = {}) {
    super(400, message, { code: 'BAD_REQUEST', ...options });
  }
}

// details: [{ field: 'email', message: 'That email is already registered' }]
// One entry per invalid field, so the UI can show each message beside its field (FR#3, FR#63).
class ValidationError extends HttpError {
  constructor(message = 'Please correct the highlighted fields', details = []) {
    super(400, message, { code: 'VALIDATION_ERROR', details });
  }
}

class UnauthorizedError extends HttpError {
  constructor(message = 'Authentication required', options = {}) {
    super(401, message, { code: 'UNAUTHORIZED', ...options });
  }
}

// Default text matches FR#10 ("access denied").
class ForbiddenError extends HttpError {
  constructor(message = 'Access denied', options = {}) {
    super(403, message, { code: 'FORBIDDEN', ...options });
  }
}

class NotFoundError extends HttpError {
  constructor(message = 'Not found', options = {}) {
    super(404, message, { code: 'NOT_FOUND', ...options });
  }
}

class ConflictError extends HttpError {
  constructor(message = 'Conflict', options = {}) {
    super(409, message, { code: 'CONFLICT', ...options });
  }
}

class PayloadTooLargeError extends HttpError {
  constructor(message = 'Request is too large', options = {}) {
    super(413, message, { code: 'PAYLOAD_TOO_LARGE', ...options });
  }
}

// retryAfterSeconds becomes the Retry-After header (login lockout FR#6, rate limits SC#6).
class TooManyRequestsError extends HttpError {
  constructor(
    message = 'Too many requests. Please try again later.',
    { retryAfterSeconds, ...options } = {}
  ) {
    super(429, message, { code: 'TOO_MANY_REQUESTS', ...options });
    if (retryAfterSeconds !== undefined) this.retryAfterSeconds = retryAfterSeconds;
  }
}

// Shown instead of technical errors when the database is down (CP#3).
class ServiceUnavailableError extends HttpError {
  constructor(
    message = 'The service is temporarily unavailable. Please try again later.',
    options = {}
  ) {
    super(503, message, { code: 'SERVICE_UNAVAILABLE', ...options });
  }
}

module.exports = {
  HttpError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PayloadTooLargeError,
  TooManyRequestsError,
  ServiceUnavailableError,
};
