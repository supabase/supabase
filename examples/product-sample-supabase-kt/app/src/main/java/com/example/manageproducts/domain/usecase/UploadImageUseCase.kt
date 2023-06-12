package com.example.manageproducts.domain.usecase

interface UploadImageUseCase : UseCase<UploadImageUseCase.Input, UploadImageUseCase.Output> {
    class Input(val fileName: String, val imageByteArray: ByteArray)
    sealed class Output {
        class Success(val image: String? = null) : Output()
    }
}