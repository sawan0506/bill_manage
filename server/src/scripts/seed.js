import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Settings } from '../models/Settings.js';
import { StockMovement } from '../models/StockMovement.js';
import { Counter } from '../models/Counter.js';
import { logger } from '../config/logger.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    logger.info('Starting database seeding...');

    // 1. Reset collections
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Settings.deleteMany({}),
      StockMovement.deleteMany({}),
      Counter.deleteMany({})
    ]);

    // 2. Create Users
    const salt = await bcrypt.genSalt(12);
    const adminPasswordHash = await bcrypt.hash('Admin@12345', salt);
    const staffPasswordHash = await bcrypt.hash('Staff@12345', salt);

    const admin = await User.create({
      name: 'Ramesh Kumar (Owner)',
      username: 'admin',
      phone: '9876543210',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isActive: true
    });

    const staff = await User.create({
      name: 'Suresh (Counter Staff)',
      username: 'staff',
      phone: '9876543211',
      passwordHash: staffPasswordHash,
      role: 'staff',
      isActive: true
    });

    logger.info('Created Admin and Staff users:');
    logger.info('  Admin: username: "admin" or phone: "9876543210", password: "Admin@12345"');
    logger.info('  Staff: username: "staff" or phone: "9876543211", password: "Staff@12345"');

    // 3. Create Settings
    await Settings.create({
      shopName: 'Kisan Hardware & Sanitary Mart',
      tagline: 'Complete Range of Pipes, Motors, Submersibles & Fittings',
      address: 'Shop No. 12-14, Main Mandi Road, Near Gandhi Chowk, Delhi - 110006',
      phone: '9876543210',
      email: 'sales@kisantraders.in',
      gstin: '07AAAAA0000A1Z5',
      state: 'Delhi',
      stateCode: '07',
      invoicePrefix: 'INV',
      enableGst: true,
      defaultGstRate: 18,
      termsAndConditions: '1. Goods once sold will be replaced within 7 days with valid bill.\n2. Motor/pump warranty is provided by company service center directly.\n3. Goods sold on credit must be paid within 30 days.',
      bankName: 'State Bank of India',
      bankAccountNumber: '38920194821',
      ifscCode: 'SBIN0001234',
      upiId: 'kisantraders@sbi',
      currencySymbol: '₹'
    });

    // 4. Sample Products across Hardware categories
    const sampleProducts = [
      // PIPES
      {
        name: 'Finolex PVC Rigid Pipe 1 inch (6 Meter)',
        category: 'Pipe',
        brand: 'Finolex',
        sizeModel: '1 inch / 6m Class 3',
        unit: 'piece',
        purchasePrice: 280,
        sellingPrice: 350,
        gstRate: 18,
        hsnCode: '3917',
        stockQuantity: 120,
        lowStockLevel: 20,
        itemCode: 'PIP-01'
      },
      {
        name: 'Finolex PVC Rigid Pipe 2 inch (6 Meter)',
        category: 'Pipe',
        brand: 'Finolex',
        sizeModel: '2 inch / 6m Class 2',
        unit: 'piece',
        purchasePrice: 520,
        sellingPrice: 650,
        gstRate: 18,
        hsnCode: '3917',
        stockQuantity: 80,
        lowStockLevel: 15,
        itemCode: 'PIP-02'
      },
      {
        name: 'Supreme CPVC Pipe 0.75 inch SDR 11',
        category: 'Pipe',
        brand: 'Supreme',
        sizeModel: '3/4 inch / 3 Meter',
        unit: 'piece',
        purchasePrice: 190,
        sellingPrice: 245,
        gstRate: 18,
        hsnCode: '3917',
        stockQuantity: 150,
        lowStockLevel: 25,
        itemCode: 'PIP-03'
      },
      {
        name: 'Jindal GI Pipe Medium 1.5 inch',
        category: 'Pipe',
        brand: 'Jindal',
        sizeModel: '1.5 inch (B-Class)',
        unit: 'meter',
        purchasePrice: 340,
        sellingPrice: 420,
        gstRate: 18,
        hsnCode: '7306',
        stockQuantity: 200,
        lowStockLevel: 30,
        itemCode: 'PIP-04'
      },
      {
        name: 'Heavy Braided Garden Water Hose 0.75 inch (30m Roll)',
        category: 'Pipe',
        brand: 'Kisan Gold',
        sizeModel: '3/4 inch x 30m',
        unit: 'bundle',
        purchasePrice: 650,
        sellingPrice: 850,
        gstRate: 18,
        hsnCode: '3917',
        stockQuantity: 25,
        lowStockLevel: 5,
        itemCode: 'PIP-05'
      },

      // HAND PUMPS
      {
        name: 'Heavy Maya Cast Iron Hand Pump Complete Set No. 6',
        category: 'Hand Pump',
        brand: 'Maya Standard',
        sizeModel: 'No. 6 Heavy Body',
        unit: 'set',
        purchasePrice: 1850,
        sellingPrice: 2400,
        gstRate: 12,
        hsnCode: '8413',
        stockQuantity: 18,
        lowStockLevel: 4,
        itemCode: 'HP-01'
      },
      {
        name: 'Deep Well Hand Pump Brass Cylinder 3 inch',
        category: 'Hand Pump',
        brand: 'SuperFlow',
        sizeModel: '3 inch x 18 inch',
        unit: 'piece',
        purchasePrice: 1200,
        sellingPrice: 1600,
        gstRate: 12,
        hsnCode: '8413',
        stockQuantity: 12,
        lowStockLevel: 3,
        itemCode: 'HP-02'
      },
      {
        name: 'Hand Pump Leather Bucket Washer 3.5 inch',
        category: 'Hand Pump',
        brand: 'Standard',
        sizeModel: '3.5 inch Genuine Leather',
        unit: 'piece',
        purchasePrice: 35,
        sellingPrice: 60,
        gstRate: 18,
        hsnCode: '4205',
        stockQuantity: 150,
        lowStockLevel: 30,
        itemCode: 'HP-03'
      },
      {
        name: 'Brass Foot Valve for Hand Pump 1.25 inch',
        category: 'Hand Pump',
        brand: 'Leader',
        sizeModel: '1-1/4 inch Threaded',
        unit: 'piece',
        purchasePrice: 240,
        sellingPrice: 330,
        gstRate: 18,
        hsnCode: '8481',
        stockQuantity: 40,
        lowStockLevel: 10,
        itemCode: 'HP-04'
      },

      // TAPS & SANITARY
      {
        name: 'Prayag PTMT Bib Cock Tap 15mm with Flange',
        category: 'Tap',
        brand: 'Prayag',
        sizeModel: '15mm / 0.5 inch',
        unit: 'piece',
        purchasePrice: 85,
        sellingPrice: 130,
        gstRate: 18,
        hsnCode: '3922',
        stockQuantity: 85,
        lowStockLevel: 15,
        itemCode: 'TAP-01'
      },
      {
        name: 'Jaquar Alive Brass Bib Tap Chrome Finish',
        category: 'Tap',
        brand: 'Jaquar',
        sizeModel: '0.5 inch Heavy',
        unit: 'piece',
        purchasePrice: 620,
        sellingPrice: 850,
        gstRate: 18,
        hsnCode: '8481',
        stockQuantity: 30,
        lowStockLevel: 6,
        itemCode: 'TAP-02'
      },
      {
        name: 'Stainless Steel Long Body Tap 0.5 inch',
        category: 'Tap',
        brand: 'Apex',
        sizeModel: 'SS 304 Grade',
        unit: 'piece',
        purchasePrice: 160,
        sellingPrice: 240,
        gstRate: 18,
        hsnCode: '8481',
        stockQuantity: 45,
        lowStockLevel: 8,
        itemCode: 'TAP-03'
      },
      {
        name: 'Brass Angle Cock Valve Heavy 0.5 inch',
        category: 'Tap',
        brand: 'Viking',
        sizeModel: '1/2 inch',
        unit: 'piece',
        purchasePrice: 190,
        sellingPrice: 280,
        gstRate: 18,
        hsnCode: '8481',
        stockQuantity: 60,
        lowStockLevel: 12,
        itemCode: 'TAP-04'
      },
      {
        name: 'Champion Teflon Thread Seal Tape (Box of 10)',
        category: 'Tap',
        brand: 'Champion',
        sizeModel: '12mm x 10m',
        unit: 'packet',
        purchasePrice: 90,
        sellingPrice: 150,
        gstRate: 18,
        hsnCode: '3919',
        stockQuantity: 50,
        lowStockLevel: 10,
        itemCode: 'TAP-05'
      },

      // MOTORS
      {
        name: 'Kirloskar Chhotu 0.5 HP Monoblock Water Pump',
        category: 'Motor',
        brand: 'Kirloskar',
        sizeModel: '0.5 HP / 25x25mm',
        unit: 'piece',
        purchasePrice: 2450,
        sellingPrice: 3100,
        gstRate: 18,
        hsnCode: '8413',
        stockQuantity: 14,
        lowStockLevel: 3,
        itemCode: 'MOT-01'
      },
      {
        name: 'Crompton Mini Crest 1 HP Self Priming Water Motor',
        category: 'Motor',
        brand: 'Crompton',
        sizeModel: '1.0 HP / 25x25mm Brass Impeller',
        unit: 'piece',
        purchasePrice: 3800,
        sellingPrice: 4750,
        gstRate: 18,
        hsnCode: '8413',
        stockQuantity: 8,
        lowStockLevel: 2,
        itemCode: 'MOT-02'
      },
      {
        name: 'Havells Hi-Flow 1.5 HP Openwell Motor Pump',
        category: 'Motor',
        brand: 'Havells',
        sizeModel: '1.5 HP Single Phase',
        unit: 'piece',
        purchasePrice: 7200,
        sellingPrice: 8900,
        gstRate: 18,
        hsnCode: '8413',
        stockQuantity: 5,
        lowStockLevel: 2,
        itemCode: 'MOT-03'
      },

      // SUBMERSIBLE PUMPS
      {
        name: 'V-Guard 3 HP 10 Stage 100mm Borewell Submersible Pump',
        category: 'Submersible',
        brand: 'V-Guard',
        sizeModel: '3.0 HP / 10 Stage Oil Filled',
        unit: 'set',
        purchasePrice: 14500,
        sellingPrice: 17800,
        gstRate: 12,
        hsnCode: '8413',
        stockQuantity: 6,
        lowStockLevel: 2,
        itemCode: 'SUB-01'
      },
      {
        name: 'CRI 5 HP 15 Stage Heavy Agriculture Submersible Pump',
        category: 'Submersible',
        brand: 'CRI',
        sizeModel: '5.0 HP Three Phase',
        unit: 'set',
        purchasePrice: 22000,
        sellingPrice: 26500,
        gstRate: 12,
        hsnCode: '8413',
        stockQuantity: 4,
        lowStockLevel: 2,
        itemCode: 'SUB-02'
      },
      {
        name: 'Automatic Digital Submersible Starter Control Panel 3 HP',
        category: 'Submersible',
        brand: 'BCH Electric',
        sizeModel: '3 HP Single Phase Auto Cut',
        unit: 'piece',
        purchasePrice: 1850,
        sellingPrice: 2450,
        gstRate: 18,
        hsnCode: '8537',
        stockQuantity: 10,
        lowStockLevel: 3,
        itemCode: 'SUB-03'
      },
      {
        name: 'Finolex 3 Core Submersible Flat Copper Cable 4 sq mm (100m Roll)',
        category: 'Submersible',
        brand: 'Finolex',
        sizeModel: '3 Core x 4 sq mm x 100m',
        unit: 'bundle',
        purchasePrice: 6800,
        sellingPrice: 8200,
        gstRate: 18,
        hsnCode: '8544',
        stockQuantity: 8,
        lowStockLevel: 2,
        itemCode: 'SUB-04'
      },

      // FITTINGS
      {
        name: 'PVC Elbow 90 Degree 1 inch Heavy',
        category: 'Fitting',
        brand: 'Finolex',
        sizeModel: '1 inch / 25mm',
        unit: 'piece',
        purchasePrice: 12,
        sellingPrice: 20,
        gstRate: 18,
        hsnCode: '3917',
        stockQuantity: 300,
        lowStockLevel: 50,
        itemCode: 'FIT-01'
      },
      {
        name: 'PVC Tee Equal 1 inch Heavy',
        category: 'Fitting',
        brand: 'Finolex',
        sizeModel: '1 inch',
        unit: 'piece',
        purchasePrice: 16,
        sellingPrice: 26,
        gstRate: 18,
        hsnCode: '3917',
        stockQuantity: 250,
        lowStockLevel: 40,
        itemCode: 'FIT-02'
      },
      {
        name: 'Brass FTA (Female Threaded Adaptor) 0.75 inch',
        category: 'Fitting',
        brand: 'Astral',
        sizeModel: '3/4 inch CPVC to Brass',
        unit: 'piece',
        purchasePrice: 65,
        sellingPrice: 95,
        gstRate: 18,
        hsnCode: '7412',
        stockQuantity: 120,
        lowStockLevel: 25,
        itemCode: 'FIT-03'
      },
      {
        name: 'GI Union Socket 1.5 inch Heavy Duty',
        category: 'Fitting',
        brand: 'Unik',
        sizeModel: '1.5 inch Threaded',
        unit: 'piece',
        purchasePrice: 140,
        sellingPrice: 210,
        gstRate: 18,
        hsnCode: '7307',
        stockQuantity: 40,
        lowStockLevel: 10,
        itemCode: 'FIT-04'
      },
      {
        name: 'Weld-On PVC Solvent Cement 250ml Tin with Brush',
        category: 'Fitting',
        brand: 'Weld-On',
        sizeModel: '250ml Can',
        unit: 'piece',
        purchasePrice: 85,
        sellingPrice: 125,
        gstRate: 18,
        hsnCode: '3506',
        stockQuantity: 45,
        lowStockLevel: 10,
        itemCode: 'FIT-05'
      }
    ];

    for (const pData of sampleProducts) {
      const prod = await Product.create({
        ...pData,
        createdBy: admin._id
      });

      await StockMovement.create({
        product: prod._id,
        productName: prod.name,
        type: 'IN',
        quantity: prod.stockQuantity,
        previousStock: 0,
        newStock: prod.stockQuantity,
        referenceType: 'Seed',
        reason: 'Initial Seeding Stock',
        performedBy: admin._id,
        performedByName: admin.name
      });
    }

    logger.info(`Seeded ${sampleProducts.length} hardware products across all categories.`);

    // 5. Seed Customers (including customers with pending Udhaar)
    const sampleCustomers = [
      {
        name: 'Rajesh Sharma (Kisan)',
        phone: '9811223344',
        address: 'Village Rampur, Near Old Well, Post Kalan',
        gstin: '',
        balanceDue: 4500,
        notes: 'Regular customer for borewell and irrigation supplies'
      },
      {
        name: 'Anil Verma (Verma Plumbing Services)',
        phone: '9822334455',
        address: 'Plot 45, Industrial Area Phase 1',
        gstin: '07BZZPV9999C1Z8',
        balanceDue: 2150,
        notes: 'Plumbing contractor, buys bulk fittings and pipes'
      },
      {
        name: 'Sunil Kumar',
        phone: '9833445566',
        address: 'House 12, Ward 4, Main Town',
        gstin: '',
        balanceDue: 0,
        notes: 'Cash customer'
      },
      {
        name: 'Mahesh Tube-Well Boring Works',
        phone: '9844556677',
        address: 'Kisan Mandi Bypass Road',
        gstin: '',
        balanceDue: 8900,
        notes: 'Borewell driller. High volume buyer of submersibles and casing pipes.'
      }
    ];

    for (const c of sampleCustomers) {
      await Customer.create(c);
    }

    logger.info(`Seeded ${sampleCustomers.length} sample customers.`);
    logger.info('Database seeded successfully!');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    logger.error(`Error during seeding: ${err.message}`, err);
    process.exit(1);
  }
};

seedDatabase();
