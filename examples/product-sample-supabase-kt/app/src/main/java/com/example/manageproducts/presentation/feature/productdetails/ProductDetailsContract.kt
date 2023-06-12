package com.example.manageproducts.presentation.feature.productdetails

import com.example.manageproducts.domain.model.Product
import kotlinx.coroutines.flow.Flow

interface ProductDetailsContract {
    val product: Flow<Product?>
    val name: Flow<String>
    val price: Flow<Double>
    val imageUrl: Flow<String>

    fun onSaveProduct(image: ByteArray)
    fun onImageChange(url: String)
}