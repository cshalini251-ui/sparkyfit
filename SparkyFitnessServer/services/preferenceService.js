const preferenceRepository = require('../models/preferenceRepository');
const userRepository = require('../models/userRepository');
const { log } = require('../config/logging');

async function updateUserPreferences(authenticatedUserId, targetUserId, preferenceData) {
  try {
    const updatedPreferences = await preferenceRepository.updateUserPreferences(targetUserId, preferenceData);
    if (!updatedPreferences) {
      throw new Error('User preferences not found or not authorized to update.');
    }
    return updatedPreferences;
  } catch (error) {
    log('error', `Error updating preferences for user ${targetUserId} by ${authenticatedUserId}:`, error);
    throw error;
  }
}

async function deleteUserPreferences(authenticatedUserId, targetUserId) {
  try {
    const success = await preferenceRepository.deleteUserPreferences(targetUserId);
    if (!success) {
      throw new Error('User preferences not found.');
    }
    return { message: 'User preferences deleted successfully.' };
  } catch (error) {
    log('error', `Error deleting preferences for user ${targetUserId} by ${authenticatedUserId}:`, error);
    throw error;
  }
}

async function getUserPreferences(authenticatedUserId, targetUserId) {
  try {
    const preferences = await preferenceRepository.getUserPreferences(targetUserId);
    if (!preferences) {
      return null; // Return null if no preferences found
    }
    return preferences;
  } catch (error) {
    log('error', `Error fetching preferences for user ${targetUserId} by ${authenticatedUserId}:`, error);
    return null; // Return null on error
  }
}

async function upsertUserPreferences(authenticatedUserId, preferenceData) {
  try {
    preferenceData.user_id = authenticatedUserId; // Ensure user_id is set from authenticated user
    const newPreferences = await preferenceRepository.upsertUserPreferences(preferenceData);
    return newPreferences;
  } catch (error) {
    log('error', `Error upserting preferences for user ${authenticatedUserId}:`, error);
    throw error;
  }
}

module.exports = {
  updateUserPreferences,
  deleteUserPreferences,
  getUserPreferences,
  upsertUserPreferences,
};