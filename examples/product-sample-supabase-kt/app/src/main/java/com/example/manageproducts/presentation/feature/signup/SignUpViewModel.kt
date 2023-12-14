package com.example.manageproducts.presentation.feature.signup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.manageproducts.domain.usecase.SignUpUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SignUpViewModel @Inject constructor(
    private val signUpUseCase: SignUpUseCase
) : ViewModel() {

    private val _email = MutableStateFlow<String>("")
    val email: Flow<String> = _email

    private val _password = MutableStateFlow("")
    val password = _password

    private val _message = MutableStateFlow("")
    val message = _message

    fun onEmailChange(email: String) {
        _email.value = email
    }

    fun onPasswordChange(password: String) {
        _password.value = password
    }

    fun onSignUp() {
        viewModelScope.launch {
            val result = signUpUseCase.execute(
                SignUpUseCase.Input(
                    email = _email.value,
                    password = _password.value
                )
            )
            when (result) {
                is SignUpUseCase.Output.Success -> {
                    _message.emit("Account created successfully!")
                }
                else -> {
                    _message.emit("Create account failed !")

                }
            }
        }

    }
}