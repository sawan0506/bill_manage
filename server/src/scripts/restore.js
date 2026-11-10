import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Bill } from '../models/Bill.js';
import { Payment } from '../models/Payment.js';
import { CreditNote } from '../models/CreditNote.js';
import { StockMovement } from '../models/StockMovement.js';
import { AuditLog } from '../models/AuditLog.js';
import { Settings } from '../models/Settings.js';
import { Counter } from '../models/Counter.js';
import { logger } from '../config/logger.js';

const runRestore = async () => {
  try {
    const backupDirArg = process.argv[2];
    if (!backupDirArg) {
      logger.error('Usage: node src/scripts/restore.js <path-to-backup-dir>');
      process.exit(1);
    }

    const backupDir = path.resolve(process.cwd(), backupDirArg);
    if (!fs.existsSync(backupDir)) {
      logger.error(`Backup folder not found at: ${backupDir}`);
      process.exit(1);
    }

    await connectDB();
    logger.info(`Restoring database from: ${backupDir}`);

    const collections = [
      { name: 'users', model: User },
      { name: 'products', model: Product },
      { name: 'customers', model: Customer },
      { name: 'bills', model: Bill },
      { name: 'payments', model: Payment },
      { name: 'credit_notes', model: CreditNote },
      { name: 'stock_movements', model: StockMovement },
      { name: 'audit_logs', model: AuditLog },
      { name: 'settings', model: Settings },
      { name: 'counters', model: Counter }
    ];

    for (const col of collections) {
      const filePath = path.join(backupDir, `${col.name}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const docs = JSON.parse(raw);
        await col.model.deleteMany({});
        if (docs.length > 0) {
          await col.model.insertMany(docs);
        }
        logger.info(`Restored ${docs.length} records for ${col.name}`);
      }
    }

    logger.info('Database restored successfully!');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    logger.error(`Restore failed: ${err.message}`, err);
    process.exit(1);
  }
};

runRestore();
