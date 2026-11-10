import { Settings } from '../models/Settings.js';
import { logAudit } from '../utils/auditLogger.js';

export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const oldValues = settings.toObject();
    Object.assign(settings, req.body);
    await settings.save();

    await logAudit({
      action: 'SETTINGS_UPDATE',
      resourceType: 'Settings',
      resourceId: settings._id,
      req,
      user: req.user,
      details: { before: oldValues, after: settings.toObject() }
    });

    res.status(200).json({
      success: true,
      message: 'Shop settings updated successfully.',
      data: settings
    });
  } catch (err) {
    next(err);
  }
};
