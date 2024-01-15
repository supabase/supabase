package com.example.manageproducts.domain.usecase.impl

import com.example.manageproducts.data.repository.ProductRepository
import com.example.manageproducts.domain.model.Product
import com.example.manageproducts.domain.usecase.GetProductDetailsUseCase
import javax.inject.Inject

class GetProductDetailsUseCaseImpl @Inject constructor(
    private val productRepository: ProductRepository,
) : GetProductDetailsUseCase {
    override suspend fun execute(input: GetProductDetailsUseCase.Input): GetProductDetailsUseCase.Output {
        val result = productRepository.getProduct(input.id)
        return GetProductDetailsUseCase.Output.Success(
            data = Product(
                id = result.id ?: "",
                name = result.name,
                price = result.price,
                image = result.image ?: "",
            )
        )
    }
}