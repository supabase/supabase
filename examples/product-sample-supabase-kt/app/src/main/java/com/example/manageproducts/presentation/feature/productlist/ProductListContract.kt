package com.example.manageproducts.presentation.feature.productlist

import com.example.manageproducts.domain.model.Product
import kotlinx.coroutines.flow.Flow

interface ProductListContract {
    val productList: Flow<List<Product>?>
    fun removeItem(product: Product)
    fun getProducts()
}