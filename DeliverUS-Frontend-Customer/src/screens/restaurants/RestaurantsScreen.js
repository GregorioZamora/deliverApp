/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import TextSemiBold from '../../components/TextSemibold'
import TextRegular from '../../components/TextRegular'
import ImageCard from '../../components/ImageCard'
import { brandPrimary, brandSecondary, flashStyle, flashTextStyle } from '../../styles/GlobalStyles'
import { getRestaurants } from '../../api/RestaurantEndpoints'
import { showMessage } from 'react-native-flash-message'
import { FlatList, Text } from 'react-native-web'
import { getPopular } from '../../api/ProductEndpoints'

export default function RestaurantsScreen ({ navigation, route }) {
  // TODO: Create a state for storing the restaurants
  const [restaurants, setRestaurants] = useState([])
  const [popular, setPopular] = useState([])

  // FR1: Restaurants listing
  useEffect(() => {
    // TODO: Fetch all restaurants and set them to state.
    //      Notice that it is not required to be logged in.
    async function fetchRestaurants () {
      try {
        const fetchedRestaurants = await getRestaurants()
        setRestaurants(fetchedRestaurants)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving the restaurants. ${error}`,
          type: 'error',
          style: flashStyle,
          textStyle: flashTextStyle
        })
      }
    }
    fetchRestaurants() // TODO: set restaurants to state
  }, [route])

  // FR7: Show top 3 products - Retrieving the popular products

  useEffect(() => {
    async function fetchPopular () {
      try {
        const fetchedPopular = await getPopular()
        setPopular(fetchedPopular)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving the popular products ${error}`,
          type: 'error',
          style: flashStyle,
          textStyle: flashTextStyle
        })
      }
    }
    fetchPopular()
  }, [])

  const renderRestaurant = ({ item }) => {
    return (
      <ImageCard
      imageUri={item.logo ? { uri: process.env.API_BASE_URL + '/' + item.logo } : undefined}
      title={item.name}
      onPress={() => {
        navigation.navigate('RestaurantDetailScreen', { id: item.id })
      }}
      >
        <TextRegular numberOfLines={2}>{item.description}</TextRegular>
        {item.averageServiceTime !== null && <TextSemiBold>Avg. service time: <TextSemiBold textStyle={{ color: brandPrimary }}>{item.averageServiceMinutes} min.</TextSemiBold></TextSemiBold>}
        <TextSemiBold>Shipping: <TextRegular style={{ color: brandPrimary }}>{item.shippingCosts.toFixed(2)} €</TextRegular></TextSemiBold>
      </ImageCard>
    )
  }

  // FR7: Show top 3 products. Rendering the products we have retrieved before

  const renderPopular = ({ item }) => {
    return (
      <View style={styles.cardBody}>
        <Text style={styles.cardText}>{item.name}</Text>
        <ImageCard
          imageUri={item.image ? { uri: process.env.API_BASE_URL + '/' + item.image } : undefined}
          onPress={() => {
            navigation.navigate('RestaurantDetailScreen', { id: item.restaurantId })
          }}
        />
        <TextRegular style={{ marginRight: 100 }} numberOfLines={2}>{item.description}</TextRegular>
        <TextSemiBold textStyle={styles.price}>{item.price.toFixed(2)}€</TextSemiBold>
      </View>
    )
  }

  // To show the render we created previously we'll create a variable with a flatlist similarly done with the return statement of the default function we're in.
  const renderHeaderPopular = () => {
    return (
      <FlatList
        horizontal={true}
        style={{ flex: 1 }}
        data={popular}
        renderItem={renderPopular}
        />
    )
  }

  const renderEmptyRestaurant = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        No restaurants were retreived. Are you logged in?
      </TextRegular>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={restaurants}
        renderItem={renderRestaurant}
        ListEmptyComponent={renderEmptyRestaurant}
        ListHeaderComponent={renderHeaderPopular}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 50
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
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  cardBody: {
    flex: 5,
    padding: 10
  },
  cardText: {
    marginLeft: 10,
    fontSize: 20,
    alignSelf: 'center',
    fontFamily: 'Montserrat_600SemiBold'
  }
})