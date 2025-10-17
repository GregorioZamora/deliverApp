// eslint-disable-next-line no-unused-vars
import { Order, Product, Restaurant, User, sequelizeSession } from '../models/models.js'
import moment from 'moment'
import { Op } from 'sequelize'

const generateFilterWhereClauses = function (req) {
  const filterWhereClauses = []
  if (req.query.status) {
    switch (req.query.status) {
      case 'pending':
        filterWhereClauses.push({
          startedAt: null
        })
        break
      case 'in process':
        filterWhereClauses.push({
          [Op.and]: [
            {
              startedAt: {
                [Op.ne]: null
              }
            },
            { sentAt: null },
            { deliveredAt: null }
          ]
        })
        break
      case 'sent':
        filterWhereClauses.push({
          [Op.and]: [
            {
              sentAt: {
                [Op.ne]: null
              }
            },
            { deliveredAt: null }
          ]
        })
        break
      case 'delivered':
        filterWhereClauses.push({
          sentAt: {
            [Op.ne]: null
          }
        })
        break
    }
  }
  if (req.query.from) {
    const date = moment(req.query.from, 'YYYY-MM-DD', true)
    filterWhereClauses.push({
      createdAt: {
        [Op.gte]: date
      }
    })
  }
  if (req.query.to) {
    const date = moment(req.query.to, 'YYYY-MM-DD', true)
    filterWhereClauses.push({
      createdAt: {
        [Op.lte]: date.add(1, 'days') // FIXME: se pasa al siguiente día a las 00:00
      }
    })
  }
  return filterWhereClauses
}

// Returns :restaurantId orders
const indexRestaurant = async function (req, res) {
  const whereClauses = generateFilterWhereClauses(req)
  whereClauses.push({
    restaurantId: req.params.restaurantId
  })
  try {
    const orders = await Order.findAll({
      where: whereClauses,
      include: {
        model: Product,
        as: 'products'
      }
    })
    res.json(orders)
  } catch (err) {
    res.status(500).send(err)
  }
}

// TODO: Implement the indexCustomer function that queries orders from current logged-in customer and send them back.
// Orders have to include products that belongs to each order and restaurant details sort them by createdAt date, desc.
const indexCustomer = async function (req, res) {
  const whereClauses = generateFilterWhereClauses(req)
  whereClauses.push({ userId: req.user.id })
  try {
    const orders = await Order.findAll({
      where: whereClauses,
      include: [
        { model: Product, as: 'products' },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['name', 'description', 'address', 'postalCode', 'url', 'shippingCosts', 'averageServiceMinutes', 'email', 'phone', 'logo', 'heroImage', 'status', 'restaurantCategoryId']
        }
      ],
      order: [['createdAt', 'DESC']]
    })
    res.json(orders)
  } catch (err) {
    res.status(500).send(err.message)
  }
}

// TODO: Implement the create function that receives a new order and stores it in the database.
// Take into account that:
// 1. If price is greater than 10€, shipping costs have to be 0.
// 2. If price is less or equals to 10€, shipping costs have to be restaurant default shipping costs and have to be added to the order total price
// 3. In order to save the order and related products, start a transaction, store the order, store each product lines and commit the transaction
// 4. If an exception is raised, catch it and rollback the transaction
const create = async function (req, res) {
  const t = await sequelizeSession.transaction()
  try {
    const newOrder = Order.build(req.body)
    newOrder.createdAt = Date.now()
    // Si vienen valores para startedAt, sentAt o deliveredAt en el body, se respetan;
    // en caso contrario, se asigna null (estado pendiente).
    newOrder.startedAt = (req.body.startedAt !== undefined) ? req.body.startedAt : null
    newOrder.sentAt = (req.body.sentAt !== undefined) ? req.body.sentAt : null
    newOrder.deliveredAt = (req.body.deliveredAt !== undefined) ? req.body.deliveredAt : null
    newOrder.userId = req.user.id // cliente autenticado

    let precioTotalDelPedido = 0.0
    for (const lineaProducto of req.body.products) {
      const esteProducto = await Product.findByPk(lineaProducto.productId, {
        attributes: ['price'],
        transaction: t
      })
      precioTotalDelPedido += lineaProducto.quantity * esteProducto.price
    }

    if (precioTotalDelPedido > 10) {
      newOrder.shippingCosts = 0.0
    } else {
      const esteRestaurante = await Restaurant.findByPk(req.body.restaurantId, {
        transaction: t
      })
      newOrder.shippingCosts = esteRestaurante.shippingCosts
    }
    newOrder.price = precioTotalDelPedido + newOrder.shippingCosts

    const order = await newOrder.save({ transaction: t })
    for (const lineaProducto of req.body.products) {
      const miProducto = await Product.findByPk(lineaProducto.productId, { transaction: t })
      await order.addProduct(miProducto, { through: { quantity: lineaProducto.quantity, unityPrice: miProducto.price }, transaction: t })
    }

    const toReturn = await Order.findOne({
      where: { id: order.id },
      include: { model: Product, as: 'products' },
      transaction: t
    })

    await t.commit()
    res.json(toReturn)
  } catch (err) {
    await t.rollback()
    res.status(500).send(err)
  }
}

// TODO: Implement the update function that receives a modified order and persists it in the database.
// Take into account that:
// 1. If price is greater than 10€, shipping costs have to be 0.
// 2. If price is less or equals to 10€, shipping costs have to be restaurant default shipping costs and have to be added to the order total price
// 3. In order to save the updated order and updated products, start a transaction, update the order, remove the old related OrderProducts and store the new product lines, and commit the transaction
// 4. If an exception is raised, catch it and rollback the transaction
const update = async function (req, res) {
  const t = await sequelizeSession.transaction()
  try {
    const order = await Order.findByPk(req.params.orderId, { transaction: t })
    if (!order) {
      await t.rollback()
      return res.status(404).send('Order not found')
    }
    // Solo se permite actualizar si la orden está pendiente
    if (order.startedAt || order.sentAt || order.deliveredAt) {
      await t.rollback()
      return res.status(409).send('Order cannot be modified as it is already in progress')
    }
    // Actualizamos la orden con los datos del body
    order.set(req.body)
    let totalPrice = 0.0
    for (const productLine of req.body.products) {
      const product = await Product.findByPk(productLine.productId, {
        attributes: ['price'],
        transaction: t
      })
      totalPrice += productLine.quantity * product.price
    }
    if (totalPrice > 10) {
      order.shippingCosts = 0.0
    } else {
      // Usamos el restaurantId original, ya que no se permite modificarlo
      const restaurant = await Restaurant.findByPk(order.restaurantId, { transaction: t })
      order.shippingCosts = restaurant.shippingCosts
    }
    order.price = totalPrice + order.shippingCosts

    await order.save({ transaction: t })
    // Eliminamos asociaciones previas de OrderProducts
    await order.setProducts([], { transaction: t })
    for (const productLine of req.body.products) {
      const product = await Product.findByPk(productLine.productId, { transaction: t })
      await order.addProduct(product, {
        through: { quantity: productLine.quantity, unityPrice: product.price },
        transaction: t
      })
    }
    const updatedOrder = await Order.findOne({
      where: { id: order.id },
      include: { model: Product, as: 'products' },
      transaction: t
    })

    await t.commit()
    res.json(updatedOrder)
  } catch (err) {
    await t.rollback()
    res.status(500).send(err)
  }
}

// TODO: Implement the destroy function that receives an orderId as path param and removes the associated order from the database.
// Take into account that:
// 1. The migration include the "ON DELETE CASCADE" directive so OrderProducts related to this order will be automatically removed.
// Si destruyen un pedido, se carga los productos en cascada, entonces tenemos que mirar los productos que esten en el pedido y cargarnoslos
const destroy = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    if (!order) {
      return res.status(404).send('Order not found')
    }
    // Solo se permite eliminar si la orden está pendiente
    if (order.startedAt || order.sentAt || order.deliveredAt) {
      return res.status(409).send('Cannot delete an order that is already in progress')
    }
    await order.destroy()
    res.status(200).json({ message: 'Successfully deleted order id ' + req.params.orderId })
  } catch (err) {
    res.status(500).send(err)
  }
}

const confirm = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.startedAt = new Date()
    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

const send = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.sentAt = new Date()
    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

const deliver = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.deliveredAt = new Date()
    const updatedOrder = await order.save()
    const restaurant = await Restaurant.findByPk(order.restaurantId)
    const averageServiceTime = await restaurant.getAverageServiceTime()
    await Restaurant.update({ averageServiceMinutes: averageServiceTime }, { where: { id: order.restaurantId } })
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

const show = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [{
        model: Restaurant,
        as: 'restaurant',
        attributes: ['name', 'description', 'address', 'postalCode', 'url', 'shippingCosts', 'averageServiceMinutes', 'email', 'phone', 'logo', 'heroImage', 'status', 'restaurantCategoryId']
      },
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'email', 'avatar', 'userType']
      },
      {
        model: Product,
        as: 'products'
      }]
    })
    res.json(order)
  } catch (err) {
    res.status(500).send(err)
  }
}

const analytics = async function (req, res) {
  const yesterdayZeroHours = moment().subtract(1, 'days').set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
  const todayZeroHours = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
  try {
    const numYesterdayOrders = await Order.count({
      where:
      {
        createdAt: {
          [Op.lt]: todayZeroHours,
          [Op.gte]: yesterdayZeroHours
        },
        restaurantId: req.params.restaurantId
      }
    })
    const numPendingOrders = await Order.count({
      where:
      {
        startedAt: null,
        restaurantId: req.params.restaurantId
      }
    })
    const numDeliveredTodayOrders = await Order.count({
      where:
      {
        deliveredAt: { [Op.gte]: todayZeroHours },
        restaurantId: req.params.restaurantId
      }
    })

    const invoicedToday = await Order.sum(
      'price',
      {
        where:
        {
          createdAt: { [Op.gte]: todayZeroHours }, // FIXME: Created or confirmed?
          restaurantId: req.params.restaurantId
        }
      })
    res.json({
      restaurantId: req.params.restaurantId,
      numYesterdayOrders,
      numPendingOrders,
      numDeliveredTodayOrders,
      invoicedToday
    })
  } catch (err) {
    res.status(500).send(err)
  }
}

const OrderController = {
  indexRestaurant,
  indexCustomer,
  create,
  update,
  destroy,
  confirm,
  send,
  deliver,
  show,
  analytics
}
export default OrderController
