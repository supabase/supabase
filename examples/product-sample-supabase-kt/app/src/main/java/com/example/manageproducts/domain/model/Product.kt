package com.example.manageproducts.domain.model

data class Product(
    val id: String,
    val name: String,
    val price: Double,
    val image: String = ""
)
