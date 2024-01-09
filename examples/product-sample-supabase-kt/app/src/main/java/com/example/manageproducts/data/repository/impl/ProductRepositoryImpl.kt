package com.example.manageproducts.data.repository.impl

import com.example.manageproducts.BuildConfig
import com.example.manageproducts.data.network.dto.ProductDto
import com.example.manageproducts.data.repository.ProductRepository
import com.example.manageproducts.domain.model.Product
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.storage.Storage
import javax.inject.Inject

class ProductRepositoryImpl @Inject constructor(
    private val postgrest: Postgrest,
    private val storage: Storage,
) : ProductRepository {
    override suspend fun createProduct(product: Product): Boolean {
        return try {
            val productDto = ProductDto(
                name = product.name,
                price = product.price,
            )
            postgrest["products"].insert(productDto)
            true
        } catch (e: java.lang.Exception) {
            throw e
        }
    }

    override suspend fun getProducts(): List<ProductDto>? {
        val result = postgrest["products"]
            .select().decodeList<ProductDto>()
        return result
    }


    override suspend fun getProduct(id: String): ProductDto {
        return postgrest["products"].select {
            filter {
                eq("id", id)
            }
        }.decodeSingle<ProductDto>()
    }

    override suspend fun deleteProduct(id: String) {
        postgrest["products"].delete {
            filter {
                eq("id", id)
            }
        }
    }

    override suspend fun updateProduct(
        id: String,
        name: String,
        price: Double,
        imageName: String,
        imageFile: ByteArray
    ) {
        if (imageFile.isNotEmpty()) {
            val imageUrl =
                storage["Product%20Image"].upload(
                    path = "$imageName.png",
                    data = imageFile,
                    upsert = true
                )
            postgrest["products"].update({
                set("name", name)
                set("price", price)
                set("image", buildImageUrl(imageFileName = imageUrl))
            }) {
                filter {
                    eq("id", id)
                }
            }
        } else {
            postgrest["products"].update({
                set("name", name)
                set("price", price)
            }) {
                filter {
                    eq("id", id)
                }
            }
        }
    }

    private fun buildImageUrl(imageFileName: String) =
        "${BuildConfig.SUPABASE_URL}/storage/v1/object/public/${imageFileName}".replace(" ", "%20")
}