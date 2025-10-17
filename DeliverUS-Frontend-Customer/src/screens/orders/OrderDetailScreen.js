/* eslint-disable react/prop-types */
import React, { useEffect, useState, useContext } from 'react'
import { StyleSheet, View, FlatList, ActivityIndicator } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { getDetail } from '../../api/OrderEndpoints'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import ImageCard from '../../components/ImageCard'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import defaultProductImage from '../../../assets/product.jpeg'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { API_BASE_URL } from '@env'

export default function OrderDetailScreen ({ route }) {
  const [order, setOrder] = useState(null)
  const { loggedInUser } = useContext(AuthorizationContext)

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const fetchedOrder = await getDetail(route.params.id)
        setOrder(fetchedOrder)
      } catch (error) {
        showMessage({
          message: `Error retrieving order details (id ${route.params.id}): ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }

    fetchOrderDetail()
  }, [loggedInUser, route])

  const renderProduct = ({ item }) => (
    <ImageCard
      imageUri={item.product.image
        ? { uri: `${API_BASE_URL}/${item.product.image}` }
        : defaultProductImage}
      title={item.product.name}
    >
      <TextRegular>{item.product.description}</TextRegular>
      <TextRegular>Cantidad: {item.quantity}</TextRegular>
      <TextSemiBold textStyle={styles.price}>
        Precio: {(item.quantity * item.product.price).toFixed(2)}€
      </TextSemiBold>
    </ImageCard>
  )

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GlobalStyles.brandPrimary} />
      </View>
    )
  }

  return (
    <FlatList
  ListHeaderComponent={
    <View style={styles.headerContainer}>
      <TextSemiBold>Pedido #{order.id}</TextSemiBold>
      <TextRegular>Estado: {order.status}</TextRegular>
      <TextRegular>
        Fecha: {new Date(order.createdAt).toLocaleDateString()}
      </TextRegular>
      <TextSemiBold>
        Total: {(order.totalPrice ?? 0).toFixed(2)}€
      </TextSemiBold>
    </View>
  }
  data={order.orderItems}
  renderItem={renderProduct}
  keyExtractor={item => item.id.toString()}
  style={styles.container}
/>

  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  headerContainer: {
    padding: 20,
    backgroundColor: GlobalStyles.brandSecondary
  },
  price: {
    marginTop: 10
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

// /* eslint-disable react/prop-types */
// import React, { useEffect } from 'react'
// import { StyleSheet, View } from 'react-native'
// import TextRegular from '../../components/TextRegular'
// import TextSemiBold from '../../components/TextSemibold'

// export default function OrderDetailScreen ({ navigation, route }) {
//   useEffect(() => {

//   }, [route])

//   return (
//     <View style={styles.container}>
//       <View style={styles.FRHeader}>
//         <TextSemiBold>FR6: Show order details</TextSemiBold>
//         <TextRegular>A customer will be able to look his/her orders up. The system should provide all details of an order, including the ordered products and their prices.</TextRegular>
//       </View>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   FRHeader: { // TODO: remove this style and the related <View>. Only for clarification purposes
//     justifyContent: 'center',
//     alignItems: 'left',
//     margin: 50
//   },
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     margin: 50
//   }
// })
