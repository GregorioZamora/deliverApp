import { get } from './helpers/ApiRequestsHelper'

function getMyConfirmedOrders (id) {
  return get('orders')
}

function getDetail (id) {
  return get(`orders/${id}`)
}

export { getMyConfirmedOrders, getDetail }
