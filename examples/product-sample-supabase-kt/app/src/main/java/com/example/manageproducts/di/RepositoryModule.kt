package com.example.manageproducts.di

import com.example.manageproducts.data.repository.ImageRepository
import com.example.manageproducts.data.repository.ProductRepository
import com.example.manageproducts.data.repository.impl.ImageRepositoryImpl
import com.example.manageproducts.data.repository.impl.ProductRepositoryImpl
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@InstallIn(SingletonComponent::class)
@Module
abstract class RepositoryModule {

    @Binds
    abstract fun bindProductRepository(impl: ProductRepositoryImpl): ProductRepository

    @Binds
    abstract fun bindImageRepository(impl: ImageRepositoryImpl): ImageRepository

}