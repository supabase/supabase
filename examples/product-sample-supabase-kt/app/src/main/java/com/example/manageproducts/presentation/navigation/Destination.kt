package com.example.manageproducts.presentation.navigation

import androidx.navigation.NavType
import androidx.navigation.navArgument


interface Destination {
    val route: String
    val title: String
}


object ProductListDestination : Destination {
    override val route = "product_list"
    override val title = "Product List"
}

object ProductDetailsDestination : Destination {
    override val route = "product_details"
    override val title = "Product Details"
    const val productId = "product_id"
    val arguments = listOf(navArgument(name = productId) {
        type = NavType.StringType
    })
    fun createRouteWithParam(productId: String) = "$route/${productId}"
}

object AddProductDestination : Destination {
    override val route = "add_product"
    override val title = "Add Product"
}

object AuthenticationDestination: Destination {
    override val route = "authentication"
    override val title = "Authentication"
}

object SignUpDestination: Destination {
    override val route = "signup"
    override val title = "Sign Up"
}