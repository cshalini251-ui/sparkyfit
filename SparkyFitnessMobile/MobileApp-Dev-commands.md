# Android Build Commands

## Generate Release Keystore

This command generates a private signing key required to build the release version of the app.

```bash
keytool -genkey -v -keystore sparky-fitness-release-key.keystore -alias sparky-fitness-alias -keyalg RSA -keysize 2048 -validity 10000
```
./gradlew --stop


## Build Release APK

This command cleans the previous build and creates a new release-signed APK.

```bash
cd android && ./gradlew clean && ./gradlew assembleRelease && cd ..
```



## SDK Location (local.properties)

If you encounter an "SDK location not found" error when building the Android app, you need to create a `local.properties` file in the `SparkyFitnessMobile/android/` directory. This file specifies the path to your Android SDK.

1.  Create the file: `SparkyFitnessMobile/android/local.properties`
2.  Add the following line to the file, replacing `YOUR_ANDROID_SDK_PATH` with the actual path to your Android SDK:

    ```
    sdk.dir=YOUR_ANDROID_SDK_PATH
    ```

    Example for Windows:
    `sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk`

    Example for macOS/Linux:
    `sdk.dir=/Users/YourUsername/Library/Android/sdk`

    Note: The backslashes in the Windows path need to be escaped with an additional backslash.

adb logcat --clear
adb logcat -s "ReactNative" "HealthConnect" "SparkyFitnessMobile" *:E



Clean b# Navigate to the React Native project directory
cd SparkyFitnessMobile

# Remove node_modules and package lock files
rm -rf node_modules
rm -f yarn.lock package-lock.json

# Clean Android build caches
cd android
./gradlew clean
rm -rf .gradle app/build build
cd .. # Go back to SparkyFitnessMobile directory
uild:



npm start -- --reset-cache

npm install

npm run android




