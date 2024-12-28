package com.example.manageproducts.domain.usecase

import com.example.manageproducts.domain.model.Product

interface GetProductsUseCase : UseCase<Unit, GetProductsUseCase.Output> {
    sealed class Output {
        class Success(val data: List<Product>): Output()
        object Failure : Output()
    }

}