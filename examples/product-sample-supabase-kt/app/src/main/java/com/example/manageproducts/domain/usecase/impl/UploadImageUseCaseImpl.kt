package com.example.manageproducts.domain.usecase.impl

import android.util.Log
import com.example.manageproducts.data.repository.ImageRepository
import com.example.manageproducts.domain.usecase.UploadImageUseCase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class UploadImageUseCaseImpl @Inject constructor(
    private val imageRepository: ImageRepository
) : UploadImageUseCase {
    override suspend fun execute(input: UploadImageUseCase.Input): UploadImageUseCase.Output {
        return withContext(Dispatchers.IO) {
            val url = imageRepository.uploadImage(input.fileName, input.imageByteArray)
            Log.d("UploadImageUseCase", url)
            UploadImageUseCase.Output.Success()
        }
    }
}