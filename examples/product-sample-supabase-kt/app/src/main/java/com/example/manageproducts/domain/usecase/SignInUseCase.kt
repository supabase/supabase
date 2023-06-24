package com.example.manageproducts.domain.usecase

interface SignInUseCase : UseCase<SignInUseCase.Input, SignInUseCase.Output> {
    class Input(val email: String, val password: String)
    sealed class Output() {
        object Success : Output()
        object Failure : Output()
    }
}