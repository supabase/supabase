package com.example.manageproducts.domain.usecase

import com.example.manageproducts.domain.model.Product

interface GetProductDetailsUseCase :
    UseCase<GetProductDetailsUseCase.Input, GetProductDetailsUseCase.Output> {
    class Input(val id: String)
    sealed class Output {
        class Success(val data: Product): Output()
        object Failure : Output()
    }
}