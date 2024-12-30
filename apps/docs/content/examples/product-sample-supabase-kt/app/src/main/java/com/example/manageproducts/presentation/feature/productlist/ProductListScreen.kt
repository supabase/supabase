package com.example.manageproducts.presentation.feature.productlist

import android.annotation.SuppressLint
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import androidx.navigation.NavController
import com.example.manageproducts.R
import com.example.manageproducts.presentation.navigation.AddProductDestination
import com.example.manageproducts.presentation.navigation.AuthenticationDestination
import com.example.manageproducts.presentation.navigation.ProductDetailsDestination
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState

@SuppressLint("UnusedMaterial3ScaffoldPaddingParameter")
@OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterialApi::class)
@Composable
fun ProductListScreen(
    modifier: Modifier = Modifier,
    navController: NavController,
    viewModel: ProductListViewModel = hiltViewModel(),
) {
    val isLoading by viewModel.isLoading.collectAsState(initial = false)
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = isLoading)
    val lifecycleOwner: LifecycleOwner = LocalLifecycleOwner.current
    // If `lifecycleOwner` changes, dispose and reset the effect
    DisposableEffect(lifecycleOwner) {
        // Create an observer that triggers our remembered callbacks
        // for sending analytics events
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_START) {
                viewModel.getProducts()
            }
        }
        // Add the observer to the lifecycle
        lifecycleOwner.lifecycle.addObserver(observer)

        // When the effect leaves the Composition, remove the observer
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }
    SwipeRefresh(state = swipeRefreshState, onRefresh = { viewModel.getProducts() }) {
        Scaffold(
            topBar = {
                TopAppBar(
                    backgroundColor = MaterialTheme.colorScheme.primary,
                    title = {
                        Text(
                            text = stringResource(R.string.product_list_text_screen_title),
                            color = MaterialTheme.colorScheme.onPrimary,
                        )
                    },
                )
            },
            floatingActionButton = {
                AddProductButton(onClick = { navController.navigate(AddProductDestination.route) })
            }
        ) { padding ->
            Column(modifier = modifier.padding(paddingValues = padding)) {
                androidx.compose.material3.Button(modifier = modifier.fillMaxWidth().padding(20.dp), onClick = {
                    navController.navigate(AuthenticationDestination.route)
                }) {
                    Text("Authentication feature")
                }

                val productList = viewModel.productList.collectAsState(initial = listOf()).value
                if (!productList.isNullOrEmpty()) {
                    LazyColumn(
                        modifier = modifier.padding(padding),
                        contentPadding = PaddingValues(5.dp)
                    ) {
                        itemsIndexed(
                            items = productList,
                            key = { _, product -> product.name }) { _, item ->
                            val state = rememberDismissState(
                                confirmStateChange = {
                                    if (it == DismissValue.DismissedToStart) {
                                        // Handle item removed
                                        viewModel.removeItem(item)
                                    }
                                    true
                                }
                            )
                            SwipeToDismiss(
                                state = state,
                                background = {
                                    val color by animateColorAsState(
                                        targetValue = when (state.dismissDirection) {
                                            DismissDirection.StartToEnd -> MaterialTheme.colorScheme.primary
                                            DismissDirection.EndToStart -> MaterialTheme.colorScheme.primary.copy(
                                                alpha = 0.2f
                                            )
                                            null -> Color.Transparent
                                        }
                                    )
                                    Box(
                                        modifier = modifier
                                            .fillMaxSize()
                                            .background(color = color)
                                            .padding(16.dp),
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.Delete,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = modifier.align(Alignment.CenterEnd)
                                        )
                                    }

                                },
                                dismissContent = {
                                    ProductListItem(
                                        product = item,
                                        modifier = modifier,
                                        onClick = {
                                            navController.navigate(
                                                ProductDetailsDestination.createRouteWithParam(
                                                    item.id
                                                )
                                            )
                                        },
                                    )
                                },
                                directions = setOf(DismissDirection.EndToStart),
                            )
                        }
                    }
                } else {
                    Text("Product list is empty!")
                }
            }


        }
    }
}

@Composable
private fun AddProductButton(
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    FloatingActionButton(
        modifier = modifier,
        onClick = onClick,
        containerColor = MaterialTheme.colorScheme.primary,
        contentColor = MaterialTheme.colorScheme.onPrimary
    ) {
        Icon(
            imageVector = Icons.Filled.Add,
            contentDescription = null,
        )
    }
}