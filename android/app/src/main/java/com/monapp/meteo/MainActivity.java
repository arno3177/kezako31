package com.example.kezako31;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import rapropos.capacitor.firebase.authentication.FirebaseAuthenticationPlugin; // Ou le package exact du plugin si nécessaire

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enregistrement explicite pour forcer le plugin à s'initialiser sur Android
        registerPlugin(io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin.class);
    }
}