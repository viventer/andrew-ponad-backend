const rateLimit = require("express-rate-limit");

const loginAttemptsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5000,
  message: "Za dużo prób logowania! Spróbuj ponownie za minutę.",
  statusCode: 429,
});

const allRequestsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 1000,
  message: "Wysyłasz za dużo zapytań do serwera! Spróbuj ponownie za minutę.",
  statusCode: 429,
});

const reportErrorRequestsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3000,
  message: "Zgłaszasz błędy zbyt szybko! Spróbuj ponownie za minutę.",
  statusCode: 429,
});

const addPostViewLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  statusCode: 204,
});

module.exports = {
  loginAttemptsLimiter,
  allRequestsLimiter,
  reportErrorRequestsLimiter,
  addPostViewLimiter,
};
