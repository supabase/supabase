package com.example.manageproducts.domain.usecase.impl

import com.example.manageproducts.data.repository.ProductRepository
import com.example.manageproducts.domain.usecase.DeleteProductUseCase
import javax.inject.Inject

class DeleteProductUseCaseImpl @Inject constructor(
    private val productRepository: ProductRepository
) : DeleteProductUseCase {
    override suspend fun execute(input: DeleteProductUseCase.Input): DeleteProductUseCase.Output {
        productRepository.deleteProduct(input.productId)
        return DeleteProductUseCase.Output.Success
    }
}