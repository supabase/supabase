package com.example.manageproducts.presentation.feature.productlist

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.manageproducts.data.network.dto.ProductDto
import com.example.manageproducts.data.repository.ProductRepository
import com.example.manageproducts.domain.model.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProductListViewModel @Inject constructor(
    private val productRepository: ProductRepository,
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
            val products = productRepository.getProducts()
            _productList.emit(products?.map { it -> it.asDomainModel() })
        }
    }

    override fun removeItem(product: Product) {
        viewModelScope.launch {
            val newList = mutableListOf<Product>().apply { _productList.value?.let { addAll(it) } }
            newList.remove(product)
            _productList.emit(newList.toList())
            // Call api to remove
            productRepository.deleteProduct(id = product.id)
            // Then fetch again
            getProducts()
        }
    }

    private fun ProductDto.asDomainModel(): Product {
        return Product(
            id = this.id ?: "",
            name = this.name,
            price = this.price,
            image = this.image ?: ""
        )
    }
}