import { Product } from '../models/Product.js';
import { StockMovement } from '../models/StockMovement.js';
import { logAudit } from '../utils/auditLogger.js';

export const listProducts = async (req, res, next) => {
  try {
    const {
      search = '',
      category = '',
      lowStock = 'false',
      page = 1,
      limit = 50,
      includeInactive = 'false'
    } = req.query;

    const query = {};

    if (includeInactive !== 'true' || req.user.role !== 'admin') {
      query.isActive = true;
    }

    if (category) {
      query.category = category;
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stockQuantity', '$lowStockLevel'] };
    }

    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { brand: { $regex: s, $options: 'i' } },
        { sizeModel: { $regex: s, $options: 'i' } },
        { itemCode: { $regex: s, $options: 'i' } }
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    // Mask purchasePrice for staff
    const sanitizedProducts = products.map((p) => {
      if (req.user.role !== 'admin') {
        const { purchasePrice, ...rest } = p;
        return rest;
      }
      return p;
    });

    res.status(200).json({
      success: true,
      data: sanitizedProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Autocomplete search for billing screen - ultra-fast
 */
export const searchAutocomplete = async (req, res, next) => {
  try {
    const queryStr = (req.query.q || '').trim();
    if (!queryStr) {
      return res.status(200).json({ success: true, data: [] });
    }

    const regex = new RegExp(queryStr, 'i');
    const items = await Product.find({
      isActive: true,
      $or: [
        { name: regex },
        { brand: regex },
        { sizeModel: regex },
        { itemCode: regex }
      ]
    })
      .select('name brand sizeModel unit sellingPrice gstRate hsnCode stockQuantity category')
      .limit(15)
      .lean();

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const data = product.toObject();
    if (req.user.role !== 'admin') {
      delete data.purchasePrice;
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const productData = {
      ...req.body,
      createdBy: req.user._id
    };

    const product = await Product.create(productData);

    // If initial stock is greater than 0, create movement
    if (product.stockQuantity > 0) {
      await StockMovement.create({
        product: product._id,
        productName: product.name,
        type: 'IN',
        quantity: product.stockQuantity,
        previousStock: 0,
        newStock: product.stockQuantity,
        referenceType: 'ManualAdjustment',
        reason: 'Initial Opening Stock',
        performedBy: req.user._id,
        performedByName: req.user.name
      });
    }

    await logAudit({
      action: 'PRODUCT_CREATE',
      resourceType: 'Product',
      resourceId: product._id,
      req,
      user: req.user,
      details: { name: product.name, sellingPrice: product.sellingPrice, stock: product.stockQuantity }
    });

    res.status(201).json({
      success: true,
      message: 'Product added successfully.',
      data: product
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Product.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const priceChanged =
      (req.body.sellingPrice !== undefined && req.body.sellingPrice !== existing.sellingPrice) ||
      (req.body.purchasePrice !== undefined && req.body.purchasePrice !== existing.purchasePrice);

    const oldValues = {
      name: existing.name,
      sellingPrice: existing.sellingPrice,
      purchasePrice: existing.purchasePrice,
      gstRate: existing.gstRate
    };

    Object.assign(existing, req.body);
    await existing.save();

    await logAudit({
      action: priceChanged ? 'PRICE_CHANGE' : 'PRODUCT_UPDATE',
      resourceType: 'Product',
      resourceId: existing._id,
      req,
      user: req.user,
      details: {
        before: oldValues,
        after: {
          name: existing.name,
          sellingPrice: existing.sellingPrice,
          purchasePrice: existing.purchasePrice,
          gstRate: existing.gstRate
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: existing
    });
  } catch (err) {
    next(err);
  }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, type, reason } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const prevStock = product.stockQuantity;
    let newStock = prevStock;

    if (type === 'IN') {
      newStock = prevStock + Math.abs(quantity);
    } else if (type === 'OUT') {
      if (prevStock < Math.abs(quantity)) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce stock below 0. Current stock is ${prevStock}.`
        });
      }
      newStock = prevStock - Math.abs(quantity);
    } else if (type === 'ADJUSTMENT') {
      newStock = Math.max(0, Number(quantity));
    }

    product.stockQuantity = newStock;
    await product.save();

    await StockMovement.create({
      product: product._id,
      productName: product.name,
      type,
      quantity: Math.abs(newStock - prevStock),
      previousStock: prevStock,
      newStock,
      referenceType: 'ManualAdjustment',
      reason,
      performedBy: req.user._id,
      performedByName: req.user.name
    });

    await logAudit({
      action: 'STOCK_ADJUST',
      resourceType: 'Product',
      resourceId: product._id,
      req,
      user: req.user,
      details: { productName: product.name, prevStock, newStock, type, reason }
    });

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully.',
      data: {
        id: product._id,
        stockQuantity: product.stockQuantity
      }
    });
  } catch (err) {
    next(err);
  }
};

export const deactivateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    product.isActive = false;
    await product.save();

    await logAudit({
      action: 'PRODUCT_DEACTIVATE',
      resourceType: 'Product',
      resourceId: product._id,
      req,
      user: req.user,
      details: { name: product.name }
    });

    res.status(200).json({
      success: true,
      message: 'Product deactivated successfully.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk import products from CSV content
 */
export const bulkImportCsv = async (req, res, next) => {
  try {
    const { csvData } = req.body;
    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide CSV data.'
      });
    }

    const lines = csvData.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty or missing data rows.'
      });
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'category', 'purchaseprice', 'sellingprice'];
    const missing = requiredHeaders.filter((rh) => !headers.includes(rh));
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required CSV column headers: ${missing.join(', ')}`
      });
    }

    let importedCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (values.length < headers.length) continue;

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx];
      });

      if (!row.name || !row.category) continue;

      const pPrice = Number(row.purchaseprice) || 0;
      const sPrice = Number(row.sellingprice) || 0;
      const stock = Number(row.stockquantity || row.stock) || 0;
      const gst = Number(row.gstrate || row.gst) || 18;

      await Product.create({
        name: row.name,
        category: row.category,
        brand: row.brand || '',
        sizeModel: row.sizemodel || row.size || '',
        unit: row.unit || 'piece',
        purchasePrice: pPrice,
        sellingPrice: sPrice,
        gstRate: gst,
        hsnCode: row.hsncode || row.hsn || '',
        stockQuantity: stock,
        createdBy: req.user._id
      });
      importedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported ${importedCount} products.`
    });
  } catch (err) {
    next(err);
  }
};
