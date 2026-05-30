package com.example.manageproducts.domain.usecase

interface UseCase<InputT, OutputT> {
    suspend fun execute(input: InputT): OutputT
}