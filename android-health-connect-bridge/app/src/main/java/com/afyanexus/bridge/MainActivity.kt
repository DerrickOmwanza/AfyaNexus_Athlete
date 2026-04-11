package com.afyanexus.bridge

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.afyanexus.bridge.databinding.ActivityMainBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var healthBridge: HealthConnectBridge
    private val afyaNexusApi = AfyaNexusApi()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        healthBridge = HealthConnectBridge(this)

        binding.serverUrlInput.setText("http://192.168.1.10:5000/api")

        val requestPermissions = registerForActivityResult(healthBridge.permissionContract()) { granted ->
            updateStatus("Permissions granted: ${granted.size}/${healthBridge.permissions.size}")
        }

        binding.grantPermissionsButton.setOnClickListener {
            requestPermissions.launch(healthBridge.permissions)
        }

        binding.syncButton.setOnClickListener {
            val serverUrl = binding.serverUrlInput.text.toString().trim()
            val token = binding.tokenInput.text.toString().trim()

            if (serverUrl.isBlank() || token.isBlank()) {
                updateStatus("Enter both server URL and athlete token before syncing.")
                return@setOnClickListener
            }

            lifecycleScope.launch {
                updateStatus("Reading Health Connect and sending payload...")
                val payload = withContext(Dispatchers.IO) {
                    healthBridge.collectLastSevenDaysPayload()
                }
                val result = withContext(Dispatchers.IO) {
                    afyaNexusApi.syncHealthConnect(serverUrl, token, payload)
                }
                updateStatus(result)
            }
        }

        binding.openDashboardButton.setOnClickListener {
            val dashboardUrl = binding.serverUrlInput.text.toString()
                .replace("/api", "", ignoreCase = true)
                .trim()
            if (dashboardUrl.isBlank()) {
                updateStatus("Enter the server URL first.")
                return@setOnClickListener
            }

            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(dashboardUrl)))
        }
    }

    private fun updateStatus(message: String) {
        binding.statusText.text = "Status:\n$message"
    }
}
