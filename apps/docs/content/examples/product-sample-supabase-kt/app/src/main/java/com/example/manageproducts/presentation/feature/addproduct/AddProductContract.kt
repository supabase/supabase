package com.example.manageproducts.presentation.feature.addproduct

import com.example.manageproducts.domain.usecase.CreateProductUseCase
import kotlinx.coroutines.flow.Flow

interface AddProductContract {

    val navigateAddProductSuccess: Flow<CreateProductUseCase.Output?>
    val isLoading: Flow<Boolean>
    val showSuccessMessage: Flow<Boolean>
    fun onCreateProduct(name: String, price: Double)
    fun onAddMoreProductSelected()
    fun onRetrySelected()
}