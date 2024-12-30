package com.example.manageproducts.presentation.feature.productlist

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.manageproducts.domain.model.Product
import com.example.manageproducts.domain.usecase.DeleteProductUseCase
import com.example.manageproducts.domain.usecase.GetProductsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProductListViewModel @Inject constructor(
    private val getProductsUseCase: GetProductsUseCase,
    private val deleteProductUseCase: DeleteProductUseCase,
) : ViewModel(), ProductListContract {

    private val _productList = MutableStateFlow<List<Product>?>(listOf())
    override val productList: Flow<List<Product>?> = _productList


    private val _isLoading = MutableStateFlow(false)
    val isLoading: Flow<Boolean> = _isLoading

    init {
        getProducts()
    }

    override fun getProducts() {
        viewModelScope.launch {
            when (val result = getProductsUseCase.execute(input = Unit)) {
                is GetProductsUseCase.Output.Success -> {
                    _productList.emit(result.data)
                }
                is GetProductsUseCase.Output.Failure -> {

                }
            }
        }
    }

    override fun removeItem(product: Product) {
        viewModelScope.launch {
            val newList = mutableListOf<Product>().apply { _productList.value?.let { addAll(it) } }
            newList.remove(product)
            _productList.emit(newList.toList())

            // Call api to remove
            deleteProductUseCase.execute(DeleteProductUseCase.Input(productId = product.id))
            // Then fetch again
            getProducts()
        }
    }
}