import React from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import styles from '../screens/SettingsScreenStyles';

const SyncFrequency = ({ syncDuration, handleSyncDurationChange, fourHourSyncTime, handleFourHourSyncTimeChange, dailySyncTime, handleDailySyncTimeChange }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Sync Frequency</Text>
      <View style={styles.inputGroup}>
        <Picker
          selectedValue={syncDuration}
          style={styles.picker}
          onValueChange={handleSyncDurationChange}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="Hourly" value="1h" />
          <Picker.Item label="Every 4 Hours" value="4h" />
          <Picker.Item label="Daily" value="24h" />
        </Picker>
        <Text style={styles.label}>How often should your health data be synced automatically?</Text>
      </View>
      {syncDuration === '4h' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prompt Time (Every 4 Hours)</Text>
          <Picker
            selectedValue={fourHourSyncTime}
            style={styles.picker}
            onValueChange={handleFourHourSyncTimeChange}
            itemStyle={styles.pickerItem}
          >
            {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'].map(time => (
              <Picker.Item key={time} label={time} value={time} />
            ))}
          </Picker>
        </View>
      )}
      {syncDuration === '24h' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prompt Time (Daily)</Text>
          <Picker
            selectedValue={dailySyncTime}
            style={styles.picker}
            onValueChange={handleDailySyncTimeChange}
            itemStyle={styles.pickerItem}
          >
            {Array.from({ length: 24 }, (_, i) => {
              const hour = i.toString().padStart(2, '0');
              return <Picker.Item key={hour} label={`${hour}:00`} value={`${hour}:00`} />;
            })}
          </Picker>
        </View>
      )}
    </View>
  );
};

export default SyncFrequency;