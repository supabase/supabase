package com.example.manageproducts.presentation.feature.addproduct.composables

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun FailScreen(
    modifier: Modifier = Modifier,
    message: String,
    reason: String,
    onRetrySelected: () -> Unit,
    onNavigateBack: () -> Unit,
) {

    Column(
        modifier = modifier
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(imageVector = Icons.Filled.Close, contentDescription = null,
            modifier = modifier.size(128.dp),
            tint = Color.Red)
        Text(text = message,
            style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = modifier.height(24.dp))
        Text(text = reason)
        Spacer(modifier = modifier.height(24.dp))
        OutlinedButton(
            modifier = modifier
                .fillMaxWidth(),
            onClick = onRetrySelected) {
            Text(text = "Retry")
        }
        Spacer(modifier = modifier.height(12.dp))
        OutlinedButton(
            modifier = modifier
                .fillMaxWidth(),
            onClick = onNavigateBack) {
            Text(text = "Cancel")
        }
    }
}