/**
 * Nebula VPN - Android GPS Mock Location Provider
 * ================================================
 * Provides GPS spoofing capabilities for Android mobile devices.
 * Designed for React Native, Cordova, or Capacitor mobile implementations.
 * 
 * Features:
 * - Mock location provider registration
 * - System-wide GPS coordinate override
 * - Mock location permission handling
 * - GPS jitter simulation for realistic movement
 * - Integration with VPN server location matching
 * 
 * @module android-gps-mock
 * @author ColinNebula - Nebula Media 3D
 * @date April 2026
 * @platform Android
 */

'use strict';

// ─── Mock Implementation for Future Mobile App ──────────────────────────────

/**
 * AndroidGPSMock - Mock location provider for Android
 * 
 * IMPORTANT: This is a JavaScript/TypeScript template for future mobile implementation.
 * It shows the structure and API design that would be used in a React Native or
 * Capacitor mobile version of Nebula VPN.
 * 
 * For actual Android implementation, you would need:
 * 1. React Native with react-native-location-mock package
 * 2. Capacitor with @capacitor-community/mock-location plugin
 * 3. Native Android module using LocationManager.setTestProviderLocation()
 */
class AndroidGPSMock {
  constructor() {
    this.enabled = false;
    this.mockLocation = null;
    this.updateInterval = null;
    this.jitterEnabled = false;
    
    console.log('📱 [AndroidGPS] Mock location provider initialized');
  }

  /**
   * Check if mock location is available on the device
   * Requires "Allow mock locations" in Developer Options
   */
  async isMockLocationAvailable() {
    console.log('📱 [AndroidGPS] Checking mock location availability...');
    
    // In React Native, you would use:
    // const { MockLocation } = require('react-native');
    // return await MockLocation.isAvailable();
    
    // In Capacitor, you would use:
    // import { MockLocation } from '@capacitor-community/mock-location';
    // const result = await MockLocation.isEnabled();
    // return result.enabled;
    
    return {
      available: false,
      reason: 'Android GPS mock requires mobile app (React Native/Capacitor)',
      requirement: 'Enable "Allow mock locations" in Android Developer Options',
    };
  }

  /**
   * Enable mock location provider
   * @param {Object} location - Target location { lat, lng, accuracy?, altitude?, speed?, bearing? }
   */
  async enable(location) {
    console.log('📱 [AndroidGPS] Enabling mock location:', location);

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return { success: false, error: 'Invalid location coordinates' };
    }

    // Validate coordinates
    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
      return { success: false, error: 'Coordinates out of range' };
    }

    this.mockLocation = {
      latitude: location.lat,
      longitude: location.lng,
      accuracy: location.accuracy || 10,      // meters
      altitude: location.altitude || 0,       // meters above sea level
      speed: location.speed || 0,             // meters per second
      bearing: location.bearing || 0,         // degrees (0-360)
      time: Date.now(),
    };

    // ACTUAL ANDROID IMPLEMENTATION WOULD BE:
    // ========================================
    
    // React Native approach:
    // const MockLocation = require('react-native-location-mock');
    // await MockLocation.setMockLocationEnabled(true);
    // await MockLocation.setMockLocation(this.mockLocation);

    // Capacitor approach:
    // import { MockLocation } from '@capacitor-community/mock-location';
    // await MockLocation.enable();
    // await MockLocation.setLocation({
    //   latitude: this.mockLocation.latitude,
    //   longitude: this.mockLocation.longitude,
    //   accuracy: this.mockLocation.accuracy,
    //   altitude: this.mockLocation.altitude,
    //   speed: this.mockLocation.speed,
    //   bearing: this.mockLocation.bearing,
    // });

    // Native Android (Java/Kotlin) approach:
    // LocationManager locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
    // locationManager.addTestProvider(
    //   LocationManager.GPS_PROVIDER,
    //   false, false, false, false, true, true, true,
    //   Criteria.POWER_LOW, Criteria.ACCURACY_FINE
    // );
    // locationManager.setTestProviderEnabled(LocationManager.GPS_PROVIDER, true);
    // Location mockLocation = new Location(LocationManager.GPS_PROVIDER);
    // mockLocation.setLatitude(latitude);
    // mockLocation.setLongitude(longitude);
    // mockLocation.setAccuracy(accuracy);
    // mockLocation.setTime(System.currentTimeMillis());
    // locationManager.setTestProviderLocation(LocationManager.GPS_PROVIDER, mockLocation);

    this.enabled = true;
    console.log('✅ [AndroidGPS] Mock location enabled (template implementation)');

    return {
      success: true,
      message: 'Mock location template ready for mobile implementation',
      location: this.mockLocation,
      note: 'This is a desktop app - actual Android implementation requires React Native or Capacitor',
    };
  }

  /**
   * Disable mock location provider
   */
  async disable() {
    console.log('📱 [AndroidGPS] Disabling mock location...');

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // ACTUAL ANDROID IMPLEMENTATION:
    // React Native:
    // await MockLocation.setMockLocationEnabled(false);
    
    // Capacitor:
    // await MockLocation.disable();
    
    // Native Android:
    // locationManager.removeTestProvider(LocationManager.GPS_PROVIDER);

    this.enabled = false;
    this.mockLocation = null;
    console.log('✅ [AndroidGPS] Mock location disabled');

    return { success: true, message: 'Mock location disabled' };
  }

  /**
   * Update mock location coordinates
   * @param {Object} location - New location { lat, lng, ... }
   */
  async updateLocation(location) {
    if (!this.enabled) {
      return { success: false, error: 'Mock location is not enabled' };
    }

    this.mockLocation = {
      ...this.mockLocation,
      latitude: location.lat,
      longitude: location.lng,
      accuracy: location.accuracy || this.mockLocation.accuracy,
      altitude: location.altitude || this.mockLocation.altitude,
      speed: location.speed || this.mockLocation.speed,
      bearing: location.bearing || this.mockLocation.bearing,
      time: Date.now(),
    };

    // ACTUAL ANDROID IMPLEMENTATION:
    // await MockLocation.setLocation(this.mockLocation);

    console.log('📱 [AndroidGPS] Location updated:', this.mockLocation);
    return { success: true, location: this.mockLocation };
  }

  /**
   * Enable GPS jitter to simulate realistic movement
   * @param {number} intervalMs - Update interval in milliseconds
   * @param {number} maxMeters - Maximum jitter in meters
   */
  enableJitter(intervalMs = 5000, maxMeters = 5) {
    if (!this.enabled) {
      return { success: false, error: 'Mock location must be enabled first' };
    }

    console.log('📱 [AndroidGPS] Enabling GPS jitter:', maxMeters, 'meters every', intervalMs, 'ms');

    this.jitterEnabled = true;
    this.updateInterval = setInterval(() => {
      if (!this.mockLocation) return;

      // Calculate jitter (1 meter ≈ 0.00001 degrees at equator)
      const degreesPerMeter = 0.00001;
      const maxDegrees = maxMeters * degreesPerMeter;

      const jitterLat = (Math.random() - 0.5) * 2 * maxDegrees;
      const jitterLng = (Math.random() - 0.5) * 2 * maxDegrees;

      const newLocation = {
        lat: this.mockLocation.latitude + jitterLat,
        lng: this.mockLocation.longitude + jitterLng,
      };

      this.updateLocation(newLocation);
    }, intervalMs);

    return { success: true, message: 'GPS jitter enabled' };
  }

  /**
   * Disable GPS jitter
   */
  disableJitter() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.jitterEnabled = false;
    console.log('📱 [AndroidGPS] GPS jitter disabled');
    return { success: true, message: 'GPS jitter disabled' };
  }

  /**
   * Get current mock location status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      location: this.mockLocation,
      jitterEnabled: this.jitterEnabled,
      platform: 'Android (template)',
      note: 'This is a template implementation for future mobile app development',
    };
  }
}

// ─── React Native Integration Example ──────────────────────────────────────

/**
 * Example of how to integrate with React Native
 * 
 * 1. Install package:
 *    npm install react-native-location-mock
 *    cd android && ./gradlew clean && cd ..
 *    npx react-native link react-native-location-mock
 * 
 * 2. Android Permissions (AndroidManifest.xml):
 *    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
 *    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
 *    <uses-permission android:name="android.permission.ACCESS_MOCK_LOCATION" />
 * 
 * 3. Enable Developer Options on device:
 *    Settings → About Phone → Tap "Build Number" 7 times
 *    Settings → Developer Options → Enable "Allow mock locations"
 * 
 * 4. Usage in React Native:
 * 
 *    import MockLocation from 'react-native-location-mock';
 * 
 *    // Enable mock location
 *    await MockLocation.setMockLocationEnabled(true);
 * 
 *    // Set location
 *    await MockLocation.setMockLocation({
 *      latitude: 40.7128,
 *      longitude: -74.0060,
 *      accuracy: 10,
 *      altitude: 0,
 *      speed: 0,
 *      bearing: 0,
 *    });
 * 
 *    // Disable mock location
 *    await MockLocation.setMockLocationEnabled(false);
 */

// ─── Capacitor Integration Example ─────────────────────────────────────────

/**
 * Example of how to integrate with Capacitor
 * 
 * 1. Install plugin:
 *    npm install @capacitor-community/mock-location
 *    npx cap sync
 * 
 * 2. Android Permissions (AndroidManifest.xml):
 *    Same as React Native above
 * 
 * 3. Usage in Capacitor:
 * 
 *    import { MockLocation } from '@capacitor-community/mock-location';
 * 
 *    // Check if enabled
 *    const { enabled } = await MockLocation.isEnabled();
 * 
 *    // Enable mock location
 *    await MockLocation.enable();
 * 
 *    // Set location
 *    await MockLocation.setLocation({
 *      latitude: 40.7128,
 *      longitude: -74.0060,
 *      accuracy: 10,
 *    });
 * 
 *    // Disable
 *    await MockLocation.disable();
 */

// ─── Native Android Code Example ───────────────────────────────────────────

/**
 * Native Android implementation (Java)
 * 
 * // In your Activity or Service:
 * 
 * import android.location.Location;
 * import android.location.LocationManager;
 * import android.content.Context;
 * 
 * public class GPSMockProvider {
 *     private LocationManager locationManager;
 *     
 *     public void enable(Context context) {
 *         locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
 *         
 *         // Add test provider
 *         locationManager.addTestProvider(
 *             LocationManager.GPS_PROVIDER,
 *             false, false, false, false, true, true, true,
 *             android.location.Criteria.POWER_LOW,
 *             android.location.Criteria.ACCURACY_FINE
 *         );
 *         
 *         // Enable test provider
 *         locationManager.setTestProviderEnabled(LocationManager.GPS_PROVIDER, true);
 *     }
 *     
 *     public void setLocation(double latitude, double longitude, float accuracy) {
 *         Location mockLocation = new Location(LocationManager.GPS_PROVIDER);
 *         mockLocation.setLatitude(latitude);
 *         mockLocation.setLongitude(longitude);
 *         mockLocation.setAccuracy(accuracy);
 *         mockLocation.setTime(System.currentTimeMillis());
 *         mockLocation.setElapsedRealtimeNanos(android.os.SystemClock.elapsedRealtimeNanos());
 *         
 *         locationManager.setTestProviderLocation(LocationManager.GPS_PROVIDER, mockLocation);
 *     }
 *     
 *     public void disable() {
 *         locationManager.removeTestProvider(LocationManager.GPS_PROVIDER);
 *     }
 * }
 * 
 * // Required Permission in AndroidManifest.xml:
 * <uses-permission android:name="android.permission.ACCESS_MOCK_LOCATION" />
 */

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = { AndroidGPSMock };
