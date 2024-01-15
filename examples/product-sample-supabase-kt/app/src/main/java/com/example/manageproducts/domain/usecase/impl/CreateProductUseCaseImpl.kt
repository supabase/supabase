package com.example.manageproducts.domain.usecase.impl

import com.example.manageproducts.data.repository.ProductRepository
import com.example.manageproducts.domain.usecase.CreateProductUseCase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import javax.inject.Inject

class CreateProductUseCaseImpl @Inject constructor(
    private val productRepository: ProductRepository,
) : CreateProductUseCase {
    override suspend fun execute(input: CreateProductUseCase.Input): CreateProductUseCase.Output {
        return try {
            withContext(Dispatchers.IO) {
                val result = productRepository.createProduct(product = input.product)
                if (result) {
                    CreateProductUseCase.Output.Success(result = result)
                } else {
                    CreateProductUseCase.Output.Failure()
                }
            }
        } catch (e: Exception) {
            return CreateProductUseCase.Output.Failure.Conflict

        }
    }
}