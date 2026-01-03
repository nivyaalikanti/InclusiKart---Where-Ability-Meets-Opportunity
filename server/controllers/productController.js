const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Get all products (with filtering and pagination)
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      status = 'approved',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(filter)
      .populate('seller', 'username personalDetails.fullName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        products,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching products'
    });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'username personalDetails profileStatus');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching product'
    });
  }
};

// Create product
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      materialsUsed,
      price,
      quantity,
      category,
      tags,
      dimensions,
      weight
    } = req.body;

    // Parse materialsUsed if it's a string
    const materialsArray = Array.isArray(materialsUsed) 
      ? materialsUsed 
      : materialsUsed ? materialsUsed.split(',').map(m => m.trim()) : [];

    // Handle uploaded images
    const images = req.files ? req.files.map((file, index) => ({
      fileName: file.filename,
      filePath: file.path,
      isPrimary: index === 0
    })) : [];

    const product = await Product.create({
      name,
      description,
      materialsUsed: materialsArray,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      dimensions: dimensions ? JSON.parse(dimensions) : undefined,
      weight: weight ? JSON.parse(weight) : undefined,
      images,
      seller: req.user._id,
      status: 'pending' // Products need admin approval
    });

    await product.populate('seller', 'username personalDetails.fullName');

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully and submitted for approval',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating product'
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found or access denied'
      });
    }

    const updates = { ...req.body };
    
    // Parse materialsUsed if it's a string
    if (updates.materialsUsed && typeof updates.materialsUsed === 'string') {
      updates.materialsUsed = updates.materialsUsed.split(',').map(m => m.trim());
    }
    
    // Parse tags if it's a string
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(t => t.trim());
    }

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        fileName: file.filename,
        filePath: file.path,
        isPrimary: index === 0
      }));
      updates.images = [...product.images, ...newImages];
    }

    // Reset status to pending if significant changes are made
    if (updates.name || updates.description || updates.price) {
      updates.status = 'pending';
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('seller', 'username personalDetails.fullName');

    res.json({
      status: 'success',
      message: 'Product updated successfully',
      data: {
        product: updatedProduct
      }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating product'
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found or access denied'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting product'
    });
  }
};

// Get seller's products
const getSellerProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { seller: req.user._id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        products,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching seller products'
    });
  }
};

// Update product status (admin only)
const updateProductStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be "approved" or "rejected"'
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes,
        ...(status === 'approved' && { isAvailable: true })
      },
      { new: true }
    ).populate('seller', 'username email personalDetails.fullName');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.json({
      status: 'success',
      message: `Product ${status} successfully`,
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating product status'
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  updateProductStatus
};