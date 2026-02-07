INSERT OR IGNORE INTO Settings (id, key, value, type, 'group', createdAt, updatedAt) VALUES 
  (hex(randomblob(16)), 'transfer_enabled', 'true', 'string', 'transfer', datetime('now'), datetime('now')),
  (hex(randomblob(16)), 'bank_name', '', 'string', 'transfer', datetime('now'), datetime('now')),
  (hex(randomblob(16)), 'bank_holder', '', 'string', 'transfer', datetime('now'), datetime('now')),
  (hex(randomblob(16)), 'bank_clabe', '', 'string', 'transfer', datetime('now'), datetime('now')),
  (hex(randomblob(16)), 'bank_card', '', 'string', 'transfer', datetime('now'), datetime('now')),
  (hex(randomblob(16)), 'bank_email', '', 'string', 'transfer', datetime('now'), datetime('now')),
  (hex(randomblob(16)), 'bank_instructions', 'Una vez realizada la transferencia, sube tu comprobante en Mi Cuenta para agilizar la confirmación.', 'string', 'transfer', datetime('now'), datetime('now'));
