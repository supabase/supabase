package com.example.manageproducts.data.repository

interface ImageRepository {
    suspend fun uploadImage(fileName: String, image: ByteArray): String
    suspend fun getImage()
}