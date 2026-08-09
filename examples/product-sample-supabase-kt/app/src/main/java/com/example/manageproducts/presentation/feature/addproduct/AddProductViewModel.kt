package com.example.manageproducts.presentation.feature.addproduct

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.manageproducts.domain.model.Product
import com.example.manageproducts.domain.usecase.CreateProductUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class AddProductViewModel @Inject constructor(
    private val createProductUseCase: CreateProductUseCase,
) : ViewModel(), AddProductContract {

    private val _navigateAddProductSuccess = MutableStateFlow<CreateProductUseCase.Output?>(null)
    override val navigateAddProductSuccess: Flow<CreateProductUseCase.Output?> =
        _navigateAddProductSuccess

    private val _isLoading = MutableStateFlow(false)
    override val isLoading: Flow<Boolean> = _isLoading

    private val _showSuccessMessage = MutableStateFlow(false)
    override val showSuccessMessage: Flow<Boolean> = _showSuccessMessage
    override fun onCreateProduct(name: String, price: Double) {
        if (name.isEmpty() || price <= 0) return
        viewModelScope.launch {
            _isLoading.value = true
            val product = Product(
                id = UUID.randomUUID().toString(),
                name = name,
                price = price,
            )
            when (val result =
                createProductUseCase.execute(CreateProductUseCase.Input(product = product))) {
                is CreateProductUseCase.Output.Success -> {
                    _isLoading.value = false
                    _showSuccessMessage.emit(true)
                    _navigateAddProductSuccess.value = result
                }
                is CreateProductUseCase.Output.Failure -> {
                    _isLoading.value = false
                    _navigateAddProductSuccess.value = result
                }
            }

        }
    }

    override fun onAddMoreProductSelected() {
        _navigateAddProductSuccess.value = null
    }

    override fun onRetrySelected() {
        _navigateAddProductSuccess.value = null
    }
}