package com.example.manageproducts

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.rememberNavController
import com.example.manageproducts.presentation.feature.signin.SignInSuccessScreen
import com.example.manageproducts.ui.theme.ManageProductsTheme
import dagger.hilt.android.AndroidEntryPoint
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.gotrue.handleDeeplinks
import javax.inject.Inject

@AndroidEntryPoint
class DeepLinkHandlerActivity : ComponentActivity() {

    @Inject
    lateinit var supabaseClient: SupabaseClient

    private lateinit var callback: (String, String) -> Unit
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        supabaseClient.handleDeeplinks(intent = intent,
            onSessionSuccess = { userSession ->
                Log.d("LOGIN", "Log in successfully with user info: ${userSession.user}")
                userSession.user?.apply {
                    callback(email ?: "", createdAt.toString())
                }
            })
        setContent {
            val navController = rememberNavController()
            val emailState = remember { mutableStateOf("") }
            val createdAtState = remember { mutableStateOf("") }
            LaunchedEffect(Unit) {
                callback = { email, created ->
                    emailState.value = email
                    createdAtState.value = created
                }
            }
            ManageProductsTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    SignInSuccessScreen(
                        modifier = Modifier.padding(20.dp),
                        navController = navController,
                        email = emailState.value,
                        createdAt = createdAtState.value,
                        onClick = { navigateToMainApp() }
                    )
                }
            }
        }
    }

    private fun navigateToMainApp() {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        startActivity(intent)
    }
}

