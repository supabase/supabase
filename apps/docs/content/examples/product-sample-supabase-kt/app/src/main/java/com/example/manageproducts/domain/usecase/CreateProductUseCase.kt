package com.example.manageproducts.domain.usecase

import com.example.manageproducts.domain.model.Product

interface CreateProductUseCase : UseCase<CreateProductUseCase.Input, CreateProductUseCase.Output> {
    class Input(val product: Product)
    sealed class Output {
        class Success(val result: Boolean) : Output()
        open class Failure : Output() {
            object Conflict : Failure()
            object Unauthorized : Failure()
            object BadRequest : Failure()
            object InternalError : Failure()
        }
    }
}