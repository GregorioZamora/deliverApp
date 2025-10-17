/* eslint-disable react/prop-types */
import React, { useState, useEffect, useContext } from 'react'
import { StyleSheet, FlatList, ScrollView, View, Pressable, Image } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { brandPrimary, brandPrimaryTap, brandSecondary, flashStyle, flashTextStyle } from '../../styles/GlobalStyles'
import { getDetail } from '../../api/RestaurantEndpoints'
import TextRegular from '../../components/TextRegular'
import ImageCard from '../../components/ImageCard'
import TextSemibold from '../../components/TextSemibold'
import { AuthorizationContext } from '../../context/AuthorizationContext'

export default function ConfirmOrderScreen ({ navigation, route }) {
  const [products, setProducts] = useState([])
  const [restaurant, setRestaurant] = useState({})
  const { loggedInUser } = useContext(AuthorizationContext)
  let totalPrice = 0.0
  for (const precio of route.params.price) {
    totalPrice += precio
  }

  useEffect(() => {
    async function fetchProducts () {
      try {
        const fetchedRestaurantDetail = await getDetail(route.params.id)
        setProducts(fetchedRestaurantDetail.products)
        setRestaurant(fetchedRestaurantDetail)
      } catch (error) {
        showMessage({
          message: `There was a problem while retrieving the products. ${error}`,
          type: 'error',
          style: flashStyle,
          textStyle: flashTextStyle
        })
      }
    }
    fetchProducts()
  }, [])

  const renderHeader = () => {
    return (
      <View style={styles.restaurantHeaderContainer}>
        <TextRegular textStyle = {{ textAlign: 'left', fontSize: 18, color: 'white' }}>Please, confirm or dismiss your order right below</TextRegular>
        <Image style={styles.image} source={restaurant.logo ? { uri: process.env.API_BASE_URL + '/' + restaurant.logo, cache: 'force-cache' } : undefined} />
        <TextRegular textStyle={styles.textTitle}>Total Price: {totalPrice} €</TextRegular>
      </View>
    )
  }

  const renderProduct = ({ item, index }) => {
    if (route.params.quantities[index] > 0) {
      return (
        <View style={{ flex: 5, padding: 10 }}>
          <ImageCard
          imageUri={item.image ? { uri: process.env.API_BASE_URL + '/' + item.image } : undefined}
          title={item.name}
          >
          <TextRegular numberOfLines={2}>{item.description}</TextRegular>
          <TextSemibold textStyle={styles.price}>{item.price.toFixed(2)}€</TextSemibold>
          <View>
            <TextRegular>Cantidad: <TextSemibold>{route.params.quantities[index]}</TextSemibold>
              <TextRegular textStyle={{ paddingLeft: 50 }}>Precio total: <TextSemibold>{route.params.price[index]} €</TextSemibold></TextRegular>
            </TextRegular>
          </View>
        </ImageCard>
      </View>
      )
    }
  }

  return (
    <ScrollView style={styles.container}>
      <FlatList
      style={styles.list}
      renderItem={renderProduct}
      data={products}
      ListHeaderComponent={renderHeader}
      />
      {/* FR3: Add, edit and remove products to a new order.
                A customer can add several products, and several units of a product to a new order.
                Before confirming, customer can edit and remove products.
                Once the order is confirmed, it cannot be edited or removed. */}
        <ScrollView>
          <TextRegular textStyle={{ color: 'black', fontSize: 14 }}>
            Do you want to use this address to receive your order? <TextSemibold textStyle={{ fontSize: 16 }}>{loggedInUser.address}</TextSemibold>
          </TextRegular>
          <Pressable
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? brandPrimaryTap
                  : brandPrimary
              },
              styles.button
            ]}
            onPress={() => {
              navigation.navigate('ConfirmOrderScreenYes',
                {
                  quantities: route.params.quantities,
                  price: route.params.price,
                  precioTotal: totalPrice,
                  id: route.params.id
                })
            }}>
            <TextRegular textStyle={{ color: 'white', fontSize: 15 }}>
              Yes
            </TextRegular>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? brandPrimaryTap
                  : brandPrimary
              },
              styles.button
            ]}
            onPress={() => {
              navigation.navigate('ConfirmOrderScreenNo',
                {
                  quantities: route.params.quantities,
                  price: route.params.price,
                  precioTotal: totalPrice,
                  id: route.params.id
                })
            }}>
            <TextRegular textStyle={{ color: 'white', fontSize: 15 }}>
              No
            </TextRegular>
          </Pressable>
          </ScrollView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  row: {
    padding: 15,
    marginBottom: 5,
    backgroundColor: brandSecondary
  },
  restaurantHeaderContainer: {
    height: 200,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'column',
    alignItems: 'center'
  },
  imageBackground: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center'
  },
  image: {
    height: 100,
    width: 100,
    marginBottom: 5,
    marginTop: 10
  },
  description: {
    color: 'white'
  },
  textTitle: {
    fontSize: 18,
    color: 'white',
    paddingTop: 20
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  button: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center'
  },
  text: {
    fontSize: 16,
    color: brandSecondary,
    textAlign: 'center',
    marginLeft: 5
  },
  headerText: {
    color: 'white',
    textAlign: 'center'
  }
})
