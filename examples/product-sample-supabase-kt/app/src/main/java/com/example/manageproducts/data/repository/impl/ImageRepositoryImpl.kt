package com.example.manageproducts.data.repository.impl

import com.example.manageproducts.BuildConfig
import com.example.manageproducts.data.repository.ImageRepository
import io.github.jan.supabase.storage.Storage
import javax.inject.Inject

class ImageRepositoryImpl @Inject constructor(
    private val storage: Storage
) : ImageRepository {
    override suspend fun uploadImage(fileName: String, image: ByteArray): String {
        val result =
            storage["Product%20Image"].upload(path = "$fileName.png", data = image, upsert = false)
        return result
    }

    override suspend fun getImage() {
        TODO("Not yet implemented")
    }

    private fun buildImageUrl(imageFileName: String) =
        "${BuildConfig.SUPABASE_URL}/storage/v1/object/public/"

}