export class FrameworkError extends Error {
  /**
   * @param {string} module - The module name (e.g., 'DOM', 'EVENT', etc.)
   * @param {string} code - A short error code (e.g., 'INVALID_NODE')
   * @param {string} message - A human-readable error message
   * @param {Object} [meta={}] - Optional metadata for debugging
   */
  constructor(module, code, message, meta = {}) {
    super(`[${module}] ${code}: ${message}`);
    this.name = "FrameworkError";
    this.module = module;
    this.code = code;
    this.meta = meta;
  }
}
