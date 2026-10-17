const crypto = require('crypto');

/**
 * Generates a unique, commercial-grade order number
 * Format: EK-YYYYMMDD-XXXX (e.g. EK-20261017-8F2A)
 */
function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `EK-${year}${month}${day}-${randomHex}`;
}

module.exports = { generateOrderNumber };
