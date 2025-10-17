import React, { useEffect, useState, useContext } from 'react'
import { StyleSheet, View, FlatList, ImageBackground, Image } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { getDetail } from '../../api/RestaurantEndpoints'
import ImageCard from '../../components/ImageCard'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import * as GlobalStyles from '../../styles/GlobalStyles' // Importing classes as members to practise this importing style
import { TextInput } from 'react-native-web'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import defaultProductImage from '../../../assets/product.jpeg'
import { API_BASE_URL } from '@env'

export default function RestaurantDetailScreen ({ navigation, route }) {
  const [restaurant, setRestaurant] = useState({})
  const [precio, setPrecio] = useState([])
  const [quantities, setQuantity] = useState([])
  const { loggedInUser } = useContext(AuthorizationContext)

  useEffect(() => {
    const fetchRestaurantDetail = async () => {
      try {
        const fetchedRestaurant = await getDetail(route.params.id)
        // Creación de un array de cantidades inicializado a 0 para cada producto
        // y un array de precios inicializado a 0 para cada producto
        const array = fetchedRestaurant.products.map(x => 0)
        setQuantity(array)
        setPrecio(array)
        setRestaurant(fetchedRestaurant)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving restaurant details (id ${route.params.id}). ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    fetchRestaurantDetail()
  }, [loggedInUser, route])

  const renderHeader = () => {
    return (
      <View>
        <ImageBackground source={(restaurant?.heroImage) ? { uri: process.env.API_BASE_URL + '/' + restaurant.heroImage, cache: 'force-cache' } : undefined} style={styles.imageBackground}>
          <View style={styles.restaurantHeaderContainer}>
            <TextSemiBold textStyle={styles.textTitle}>{restaurant.name}</TextSemiBold>
            <Image style={styles.image} source={restaurant.logo ? { uri: process.env.API_BASE_URL + '/' + restaurant.logo, cache: 'force-cache' } : undefined} />
            <TextRegular textStyle={styles.description}>{restaurant.description}</TextRegular>
            <TextRegular textStyle={styles.description}>{restaurant.restaurantCategory ? restaurant.restaurantCategory.name : ''}</TextRegular>
          </View>
        </ImageBackground>
      </View>
    )
  }

  function updatePriceQuantity ({ quantity, index, item }) {
    // Actualiza la cantidad
    const newQuantity = [...quantities]
    newQuantity[index] = parseInt(quantity)
    setQuantity(newQuantity)
    // Actualiza el precio
    const newPrice = [...precio]
    newPrice[index] = parseFloat(item.price) * parseInt(quantity)
    setPrecio(newPrice)
  }

  const renderProduct = ({ item, index }) => {
    return (
      <ImageCard
        imageUri={item.image ? { uri: process.env.API_BASE_URL + '/' + item.image } : defaultProductImage}
        title={item.name}
      >
        <TextRegular numberOfLines={2}>{item.description}</TextRegular>
        <TextSemiBold textStyle={styles.price}>{item.price.toFixed(2)}€</TextSemiBold>
        {!item.availability &&
          <View style={styles.actionButtonsContainer}>
            <TextRegular textStyle={styles.availability}numberOfLines={6}>Not available</TextRegular>
          </View>
        }
        {/* Insertamos un cuadro en el que el usuario introduzca cuántas unidades de ese producto desea añadir a su pedido */}
        <View>
          <TextRegular>Cantidad:
            <TextRegular textStyle={{ paddingLeft: 50 }}>Precio total: {precio[index]}€</TextRegular>
            </TextRegular>
          <View style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 50 }}>
            <TextInput
                style={styles.input}
                name='quantity'
                placeholder='0'
                keyboardType='numeric'
                onChangeText={quantity => updatePriceQuantity({ quantity, index, item })}
                />
            </View>
          </View>
        </View>
      </ImageCard>
    )
  }

  const renderEmptyProductsList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        This restaurant has no products yet.
      </TextRegular>
    )
  }

  

  // Para la implementación de RF4 añadimos un botón que nos lleva a una pantalla de confirmación de pedido (en el pie de página)
  // const renderFooter = () => {
  //   return (
  //     <Pressable
  //       onPress={() => navigation.navigate('ConfirmOrderScreen', { quantities, price: precio, id: route.params.id })}
  //       style={({ pressed }) => [
  //         {
  //           backgroundColor: pressed
  //             ? brandPrimaryTap
  //             : brandPrimary
  //         },
  //         styles.button
  //       ]}>
  //       <TextRegular textStyle={styles.text}>
  //         Create order
  //       </TextRegular>
  //     </Pressable>
  //   )
  // }
  const renderFooter = () => {
    return (
      <Pressable
        onPress={() => navigation.navigate('ConfirmOrderScreen', { quantities, price: precio, id: route.params.id })}
        style={({ pressed }) => [
          {
            backgroundColor: pressed
              ? GlobalStyles.brandPrimaryTap
              : GlobalStyles.brandPrimary
          },
          styles.button
        ]}
      >
        <TextRegular textStyle={styles.text}>
          Confirm Order
        </TextRegular>
      </Pressable>
    );
  };
  


  return (
    <FlatList
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmptyProductsList}
      ListFooterComponent={renderFooter}
      style={styles.container}
      data={restaurant.products}
      renderItem={renderProduct}
      keyExtractor={item => item.id.toString()}
      />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  row: {
    padding: 15,
    marginBottom: 5,
    backgroundColor: GlobalStyles.brandSecondary
  },
  restaurantHeaderContainer: {
    height: 250,
    padding: 20,
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
    margin: 10
  },
  description: {
    color: 'white'
  },
  textTitle: {
    fontSize: 20,
    color: 'white'
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
    width: '80%'
  },
  text: {
    fontSize: 16,
    color: 'white',
    alignSelf: 'center',
    marginLeft: 5
  },
  availability: {
    textAlign: 'right',
    marginRight: 5,
    color: GlobalStyles.brandSecondary
  },
  actionButton: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    margin: '1%',
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'column',
    width: '50%'
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    bottom: 5,
    position: 'absolute',
    width: '90%'
  },
  input: {
    borderRadius: 8,
    height: 20,
    borderWidth: 1,
    padding: 15,
    marginTop: 10
  }
})
