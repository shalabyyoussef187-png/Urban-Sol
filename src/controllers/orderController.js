const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const pusher = require('../utils/pusher');

const createOrder = async (req, res) => {
  try {
    const { customer_name, customer_email, items } = req.body;
    // items should be an array of { product_id, quantity

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    let total_amount = 0;
    const orderItemsData = [];

    // Calculate total amount and prepare order items
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.product_id } });
      if (!product) {
        return res.status(404).json({ message: `Product with id ${item.product_id} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
      }

      total_amount += product.price * item.quantity;
      orderItemsData.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price,
      });

      // Update product stock (in a real app, this should be done in a transaction)
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: product.stock - item.quantity },
      });
    }

    const order = await prisma.order.create({
      data: {
        customer_name,
        customer_email,
        total_amount,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // Trigger Pusher event
    pusher.trigger('orders-channel', 'new-order', {
      message: 'A new order has been placed',
      order: order
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // validate status enum
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  updateOrderStatus,
};
