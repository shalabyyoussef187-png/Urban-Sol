const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const imagekit = require('../config/imagekit');

const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ 
      where: { id },
      include: { category: true }
    });
    
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, categoryId } = req.body;
    let imageUrl = null;

    if (req.file) {
      const result = await imagekit.upload({
        file: req.file.buffer, // required
        fileName: req.file.originalname, // required
        folder: '/products'
      });
      imageUrl = result.url;
    }
    
    const product = await prisma.product.create({
      data: { 
        name, 
        description, 
        price: parseFloat(price), 
        stock: parseInt(stock, 10), 
        categoryId, 
        imageUrl 
      },
    });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, categoryId } = req.body;
    
    let imageUrl = undefined;
    if (req.file) {
      const result = await imagekit.upload({
        file: req.file.buffer, // required
        fileName: req.file.originalname, // required
        folder: '/products'
      });
      imageUrl = result.url;
    }
    
    const dataToUpdate = { name, description, categoryId };
    if (price) dataToUpdate.price = parseFloat(price);
    if (stock) dataToUpdate.stock = parseInt(stock, 10);
    if (imageUrl) dataToUpdate.imageUrl = imageUrl;

    const product = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
