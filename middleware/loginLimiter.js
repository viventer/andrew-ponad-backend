const rateLimit = require("express-rate-limit");
const logEvents = require("./logEvents");

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5, // Limit each IP to 5 login requests per `window` per minute
  message: {
    message:
      "Zbyt dużo prób logowania z tego IP, prosimy spróbować ponownie po 60 sekundach",
  },
  handler: (req, res, next, options) => {
    logEvents(
      `Too Many Requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
      "errLog.log"
    );
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = loginLimiter;
