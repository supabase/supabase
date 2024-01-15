package com.example.manageproducts.di

import com.example.manageproducts.data.repository.AuthenticationRepository
import com.example.manageproducts.data.repository.ProductRepository
import com.example.manageproducts.data.repository.impl.AuthenticationRepositoryImpl
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
    abstract fun bindAuthenticateRepository(impl: AuthenticationRepositoryImpl): AuthenticationRepository

}