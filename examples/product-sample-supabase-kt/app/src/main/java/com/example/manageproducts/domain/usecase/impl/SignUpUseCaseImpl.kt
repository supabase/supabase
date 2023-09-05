package com.example.manageproducts.domain.usecase.impl

import com.example.manageproducts.data.repository.AuthenticationRepository
import com.example.manageproducts.domain.usecase.SignUpUseCase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class SignUpUseCaseImpl @Inject constructor(
    private val authenticationRepository: AuthenticationRepository
) : SignUpUseCase {
    override suspend fun execute(input: SignUpUseCase.Input): SignUpUseCase.Output =
        withContext(Dispatchers.IO) {
            val result = authenticationRepository.signUp(input.email, input.password)
            if (result) {
                SignUpUseCase.Output.Success
            } else {
                SignUpUseCase.Output.Failure
            }
        }
}