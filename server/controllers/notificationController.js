const Notification = require('../models/Notification');

// Get notifications for current user
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { user: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        notifications,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
  }
};

// Mark notification(s) read
const markAsRead = async (req, res) => {
  try {
    const { ids } = req.body; // array of ids
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ status: 'error', message: 'Invalid ids' });
    }

    await Notification.updateMany({ _id: { $in: ids }, user: req.user._id }, { $set: { isRead: true } });

    res.json({ status: 'success', message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update notifications' });
  }
};

module.exports = { getNotifications, markAsRead };
