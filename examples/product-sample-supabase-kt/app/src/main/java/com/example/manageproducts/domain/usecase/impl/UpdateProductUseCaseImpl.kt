package com.example.manageproducts.domain.usecase.impl

import com.example.manageproducts.data.repository.ProductRepository
import com.example.manageproducts.domain.usecase.UpdateProductUseCase
import javax.inject.Inject

class UpdateProductUseCaseImpl @Inject constructor(
    private val productRepository: ProductRepository
) : UpdateProductUseCase {
    override suspend fun execute(input: UpdateProductUseCase.Input): UpdateProductUseCase.Output {
        productRepository.updateProduct(
            id = input.id, name = input.name, price = input.price,
            imageName = input.imageName, imageFile = input.imageFile
        )
        return UpdateProductUseCase.Output.Success
    }
}