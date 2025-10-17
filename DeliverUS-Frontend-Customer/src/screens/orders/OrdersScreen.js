import React, { useEffect, useState } from 'react'
import { StyleSheet, View, FlatList } from 'react-native'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import { getMyConfirmedOrders } from '../../api/OrderEndpoints'
import ImageCard from '../../components/ImageCard'
import { showMessage } from 'react-native-flash-message'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { API_BASE_URL } from '@env'
import restaurantLogo from '../../../assets/restaurantLogo.jpeg'

export default function OrdersScreen ({ navigation }) {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    fetchConfirmedOrders()
  }, [])

  const fetchConfirmedOrders = async () => {
    try {
      const fetchedOrders = await getMyConfirmedOrders()
      setOrders(fetchedOrders)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving your confirmed orders. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const renderOrder = ({ item }) => {
    return (
      <ImageCard
        imageUri={item.restaurant?.logo ? { uri: API_BASE_URL + '/' + item.restaurant.logo } : restaurantLogo}
        title={`Order #${item.id}`}
        onPress={() => {
          navigation.navigate('OrderDetailScreen', { id: item.id })
        }}
      >
        <TextRegular>Restaurant: {item.restaurant?.name}</TextRegular>
        <TextRegular>Date: {new Date(item.createdAt).toLocaleString()}</TextRegular>
        <TextRegular>Status: {item.status}</TextRegular>
      </ImageCard>
    )
  }

  return (
    <View style={styles.container}>
      <TextSemiBold textStyle={styles.sectionTitle}>Mis pedidos</TextSemiBold>
      <FlatList
        style={{ width: '100%' }}
        data={orders}
        keyExtractor={item => item.id.toString()}
        renderItem={renderOrder}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  FRHeader: { // TODO: remove this style and the related <View>. Only for clarification purposes
    justifyContent: 'center',
    alignItems: 'left',
    margin: 50
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 50
  },
  button: {
    borderRadius: 8,
    height: 40,
    margin: 12,
    padding: 10,
    width: '100%'
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center'
  }
})
