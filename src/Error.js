class EcoError extends Error {
  constructor(message) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = 'EcoError';
    this.message = message;
  }
}

module.exports = EcoError;
