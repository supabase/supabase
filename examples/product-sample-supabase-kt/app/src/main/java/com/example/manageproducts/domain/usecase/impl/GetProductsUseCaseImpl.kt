package com.example.manageproducts.domain.usecase.impl

import com.example.manageproducts.data.repository.ProductRepository
import com.example.manageproducts.domain.model.Product
import com.example.manageproducts.domain.usecase.GetProductsUseCase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class GetProductsUseCaseImpl @Inject constructor(
    private val productRepository: ProductRepository,
) : GetProductsUseCase {
    override suspend fun execute(input: Unit): GetProductsUseCase.Output =
        withContext(Dispatchers.IO) {
            val result = productRepository.getProducts()
            return@withContext result?.let { it ->
                GetProductsUseCase.Output.Success(data = it.map {
                    Product(
                        id = it.id ?: "",
                        name = it.name,
                        price = it.price,
                        image = it.image ?: ""
                    )
                })
            } ?: GetProductsUseCase.Output.Failure
        }
}