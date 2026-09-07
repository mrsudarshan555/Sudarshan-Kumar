package com.mayra.assistant

import android.app.Application
import com.mayra.assistant.memory.MayraMemoryVaultEngine

/**
 * MAYRA Android Application Entry Point
 * Initializes background services, biometric Voice Guardian security, and local caches.
 */
class MayraApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        // Initialize MAYRA core components and persistent AI Memory Vault
        MayraMemoryVaultEngine.getInstance(this)
    }
}

