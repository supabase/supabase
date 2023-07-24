package com.example.manageproducts.presentation.feature.productlist

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Card
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.annotation.ExperimentalCoilApi
import coil.compose.rememberImagePainter
import com.example.manageproducts.domain.model.Product

@OptIn(ExperimentalMaterialApi::class, ExperimentalCoilApi::class)
@Composable
fun ProductListItem(
    modifier: Modifier = Modifier,
    product: Product,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .padding(4.dp)
            .fillMaxWidth(),
        elevation = 8.dp,
        shape = RoundedCornerShape(12.dp),
        onClick = onClick
    ) {
        Row(
            modifier = modifier.padding(10.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Image(
                contentDescription = null,
                painter = rememberImagePainter(product.image),
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .padding(16.dp, 8.dp)
                    .size(64.dp)
            )
            Text(
                text = product.name,
                modifier = modifier.weight(1.0f)
            )
            Text(
                text = "$${product.price}",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}