package com.example.manageproducts.domain.usecase.impl

import com.example.manageproducts.data.repository.AuthenticationRepository
import com.example.manageproducts.domain.usecase.SignInWithGoogleUseCase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class SignInWithGoogleUseCaseImpl @Inject constructor(
    private val authenticationRepository: AuthenticationRepository,
): SignInWithGoogleUseCase {
    override suspend fun execute(input: SignInWithGoogleUseCase.Input): SignInWithGoogleUseCase.Output {
        return withContext(Dispatchers.IO) {
            authenticationRepository.signInWithGoogle()
            SignInWithGoogleUseCase.Output()
        }
    }
}