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

const runBackup = async () => {
  try {
    await connectDB();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(process.cwd(), 'backups', `backup-${timestamp}`);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

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

    logger.info(`Starting JSON database backup to: ${backupDir}`);

    const metadata = {
      backupDate: new Date().toISOString(),
      counts: {}
    };

    for (const col of collections) {
      const docs = await col.model.find({}).lean();
      const filePath = path.join(backupDir, `${col.name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
      metadata.counts[col.name] = docs.length;
      logger.info(`Backed up ${docs.length} records for ${col.name}`);
    }

    fs.writeFileSync(path.join(backupDir, 'meta.json'), JSON.stringify(metadata, null, 2));

    logger.info('Database backup completed successfully!');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    logger.error(`Backup failed: ${err.message}`, err);
    process.exit(1);
  }
};

runBackup();
