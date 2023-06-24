package com.example.manageproducts.presentation.feature.addproduct

import android.annotation.SuppressLint
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.TopAppBar
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.example.manageproducts.R
import com.example.manageproducts.domain.usecase.CreateProductUseCase
import com.example.manageproducts.presentation.feature.addproduct.composables.FailScreen
import com.example.manageproducts.presentation.feature.addproduct.composables.LoadingScreen
import com.example.manageproducts.presentation.feature.addproduct.composables.SuccessScreen

@SuppressLint("UnusedMaterial3ScaffoldPaddingParameter")
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddProductScreen(
    modifier: Modifier = Modifier,
    navController: NavController,
    viewModel: AddProductViewModel = hiltViewModel(),
) {
    Scaffold(
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = {
                        navController.navigateUp()
                    }) {
                        Icon(
                            imageVector = Icons.Filled.ArrowBack,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                },
                backgroundColor = MaterialTheme.colorScheme.primary,
                title = {
                    Text(
                        text = stringResource(R.string.add_product_text_screen_title),
                        color = MaterialTheme.colorScheme.onPrimary,
                    )
                },
            )
        }
    ) { padding ->
        val navigateAddProductSuccess =
            viewModel.navigateAddProductSuccess.collectAsState(initial = null).value
        val isLoading =
            viewModel.isLoading.collectAsState(initial = null).value
        if (isLoading == true) {
            LoadingScreen(message = "Adding Product",
                onCancelSelected = {
                    navController.navigateUp()
                })
        } else {
            when (navigateAddProductSuccess) {
                null -> {
                    Column(
                        modifier = modifier
                            .padding(padding)
                            .padding(16.dp)
                            .fillMaxSize()
                    ) {
                        val name = rememberSaveable { mutableStateOf("") }
                        val price = rememberSaveable { mutableStateOf("") }
                        OutlinedTextField(
                            label = {
                                Text(
                                    text = "Product name",
                                    color = MaterialTheme.colorScheme.primary,
                                    style = MaterialTheme.typography.titleMedium
                                )
                            },
                            maxLines = 2,
                            shape = RoundedCornerShape(32),
                            modifier = modifier.fillMaxWidth(),
                            value = name.value,
                            onValueChange = {
                                name.value = it
                            },
                        )
                        Spacer(modifier = modifier.height(12.dp))
                        OutlinedTextField(
                            label = {
                                Text(
                                    text = "Product price",
                                    color = MaterialTheme.colorScheme.primary,
                                    style = MaterialTheme.typography.titleMedium
                                )
                            },
                            maxLines = 2,
                            shape = RoundedCornerShape(32),
                            modifier = modifier.fillMaxWidth(),
                            value = price.value,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            onValueChange = {
                                price.value = it
                            },
                        )
                        Spacer(modifier = modifier.height(12.dp))
                        Spacer(modifier = modifier.weight(1f))
                        OutlinedButton(
                            modifier = modifier
                                .fillMaxWidth(),
                            onClick = {
                                navController.navigateUp()
                            }) {
                            Text(text = "Cancel")
                        }
                        Spacer(modifier = modifier.height(12.dp))
                        Button(
                            modifier = modifier.fillMaxWidth(),
                            onClick = {
                                viewModel.onCreateProduct(
                                    name = name.value,
                                    price = if (price.value.isEmpty()) 0.0 else price.value.trim()
                                        .toDouble(),
                                )
                            }) {
                            Text(text = "Add Product")
                        }
                    }
                }
                is CreateProductUseCase.Output.Success -> {
                    SuccessScreen(
                        message = "Product added",
                        onMoreAction = {
                            viewModel.onAddMoreProductSelected()
                        },
                        onNavigateBack = {
                            navController.navigateUp()
                        })
                }
                is CreateProductUseCase.Output.Failure -> {
                    val resonMessage = rememberSaveable {
                        mutableStateOf(handleError(navigateAddProductSuccess))
                    }
                    FailScreen(modifier = modifier.padding(16.dp),
                        message = "Fail to Add Product",
                        reason = resonMessage.value,
                        onRetrySelected = {
                            viewModel.onRetrySelected()
                        },
                        onNavigateBack = { navController.navigateUp() }
                    )
                }

            }
        }

    }
}

private fun handleError(failResult: CreateProductUseCase.Output.Failure): String {
    return when (failResult) {
        is CreateProductUseCase.Output.Failure.InternalError -> {
            "Internal Error"
        }
        is CreateProductUseCase.Output.Failure.BadRequest -> {
            "Bad request"
        }
        is CreateProductUseCase.Output.Failure.Conflict -> {
            "Conflict"
        }
        is CreateProductUseCase.Output.Failure.Unauthorized -> {
            "Unauthorized"
        }
        else -> {
            "Internal Error"
        }
    }
}