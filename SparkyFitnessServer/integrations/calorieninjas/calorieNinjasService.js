const { log } = require('../../config/logging');
const externalProviderRepository = require('../../models/externalProviderRepository');

const CALORIENINJAS_API_BASE_URL = "https://api.calorieninjas.com/v1/nutrition";

async function getCalorieNinjasHeaders(providerId) {
  const providerData = await externalProviderRepository.getExternalDataProviderById(providerId);
  if (!providerData || !providerData.app_key) {
    throw new Error("CalorieNinjas provider not configured or API Key missing.");
  }
  
  let apiKey = providerData.app_key.trim();
  // If the key is duplicated (80 characters and first half equals second half), split it
  if (apiKey.length === 80 && apiKey.substring(0, 40) === apiKey.substring(40)) {
    apiKey = apiKey.substring(0, 40);
  }

  return {
    "Content-Type": "application/json",
    "X-Api-Key": apiKey,
  };
}

async function searchCalorieNinjasFoods(query, providerId) {
  try {
    const headers = await getCalorieNinjasHeaders(providerId);
    const response = await fetch(`${CALORIENINJAS_API_BASE_URL}?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: headers,
    });
    if (!response.ok) {
      const errorText = await response.text();
      log('error', "CalorieNinjas Nutrition API error:", errorText);
      throw new Error(`CalorieNinjas API error: ${errorText}`);
    }
    const data = await response.json();
    return data; // returns { items: [ ... ] }
  } catch (error) {
    log('error', `Error searching CalorieNinjas foods with query "${query}" in calorieNinjasService:`, error);
    throw error;
  }
}

module.exports = {
  searchCalorieNinjasFoods,
};
