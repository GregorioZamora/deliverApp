import { check } from 'express-validator'
import { Product, Order } from '../../models/models.js'

const checkArrayCreate = async ( value , { req }) => {
  try {
    if (req.body.products.length < 1) {
      return Promise.reject(new Error('The array of products is empty'))
    }
    for (const p of value) {
      if (p.productId < 1) {
        return Promise.reject(new Error('The productId is not valid'))
      }
      const product = await Product.findByPk(p.productId)
      if (!product.availability) {
        return Promise.reject(new Error('The product is not available'))
      }
      if (product.restaurantId !== req.body.restaurantId) {
        return Promise.reject(new Error('The product does not belong to the restaurant'))
      }
    }
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}

const checkArrayUpdate = async (value, { req }) => {
    try {
      if (req.body.products.length < 1) {
        return Promise.reject(new Error('The array of products is empty'))
      }
      for (const p of value) {
        if (p.productId < 1) {
          return Promise.reject(new Error('The productId is not valid'))
        }
        const product = await Product.findByPk(p.productId)
        if (!product.availability) {
          return Promise.reject(new Error('The product is not available'))
        }
        const original = await Order.findByPk(req.params.orderId)
        if (product.restaurantId !== original.restaurantId) {
          return Promise.reject(new Error('The product does not belong to the original restaurant'))
        }
      }
      return Promise.resolve()
    } catch (err) {
      return Promise.reject(new Error(err))
    }
  }

// TODO: Include validation rules for create that should:
// 1. Check that restaurantId is present in the body and corresponds to an existing restaurant
// 2. Check that products is a non-empty array composed of objects with productId and quantity greater than 0
// 3. Check that products are available
// 4. Check that all the products belong to the same restaurant
const create = [
  check('restaurantId').exists(),
  check('address').exists().isString().isLength({ min: 1, max: 255 }).trim(),
  check('price').default(null).optional({ nullable: true }).isFloat().toFloat(),
  check('products.*.quantity').isInt({ min: 1 }).toInt(),
  check('products').custom(checkArrayCreate)
]

// TODO: Include validation rules for update that should:
// 1. Check that restaurantId is NOT present in the body.
// 2. Check that products is a non-empty array composed of objects with productId and quantity greater than 0
// 3. Check that products are available
// 4. Check that all the products belong to the same restaurant of the originally saved order that is being edited.
// 5. Check that the order is in the 'pending' state.
const update = [
  check('restaurantId').not().exists(),
  check('address').exists().isString().isLength({ min: 1, max: 255 }).trim(),
  check('products.*.quantity').isInt({ min: 1 }).toInt(),
  check('products').custom(checkArrayUpdate)
]

export { create, update }