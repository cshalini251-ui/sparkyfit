const nutrientDisplayPreferenceRepository = require('../models/nutrientDisplayPreferenceRepository');

const defaultNutrients = ['calories', 'protein', 'carbs', 'fat', 'dietary_fiber'];
const allNutrients = [
    'calories', 'protein', 'carbs', 'fat', 'dietary_fiber', 'sugars', 'sodium',
    'cholesterol', 'saturated_fat', 'trans_fat', 'potassium',
    'vitamin_a', 'vitamin_c', 'iron', 'calcium', 'glycemic_index'
];

const defaultPreferences = [
    // Desktop
    { view_group: 'summary', platform: 'desktop', visible_nutrients: defaultNutrients },
    { view_group: 'quick_info', platform: 'desktop', visible_nutrients: defaultNutrients },
    { view_group: 'food_database', platform: 'desktop', visible_nutrients: allNutrients },
    { view_group: 'goal', platform: 'desktop', visible_nutrients: allNutrients },
    { view_group: 'report_tabular', platform: 'desktop', visible_nutrients: allNutrients },
    { view_group: 'report_chart', platform: 'desktop', visible_nutrients: allNutrients },
    // Mobile
    { view_group: 'summary', platform: 'mobile', visible_nutrients: defaultNutrients },
    { view_group: 'quick_info', platform: 'mobile', visible_nutrients: defaultNutrients },
    { view_group: 'food_database', platform: 'mobile', visible_nutrients: allNutrients },
    { view_group: 'goal', platform: 'mobile', visible_nutrients: allNutrients },
    { view_group: 'report_tabular', platform: 'mobile', visible_nutrients: allNutrients },
    { view_group: 'report_chart', platform: 'mobile', visible_nutrients: allNutrients },
];

async function getNutrientDisplayPreferences(userId) {
    const userPreferences = await nutrientDisplayPreferenceRepository.getNutrientDisplayPreferences(userId);
    if (userPreferences && userPreferences.length > 0) {
        return userPreferences.map(p => ({...p, visible_nutrients: typeof p.visible_nutrients === 'string' ? JSON.parse(p.visible_nutrients) : p.visible_nutrients}));
    }
    return defaultPreferences;
}

async function upsertNutrientDisplayPreference(userId, viewGroup, platform, visibleNutrients) {
    return await nutrientDisplayPreferenceRepository.upsertNutrientDisplayPreference(userId, viewGroup, platform, visibleNutrients);
}

async function resetNutrientDisplayPreference(userId, viewGroup, platform) {
    await nutrientDisplayPreferenceRepository.deleteNutrientDisplayPreference(userId, viewGroup, platform);
    return defaultPreferences.find(p => p.view_group === viewGroup && p.platform === platform);
}

async function createDefaultNutrientPreferencesForUser(userId) {
    return await nutrientDisplayPreferenceRepository.createDefaultNutrientPreferences(userId, defaultPreferences);
}

module.exports = {
    getNutrientDisplayPreferences,
    upsertNutrientDisplayPreference,
    resetNutrientDisplayPreference,
    createDefaultNutrientPreferencesForUser,
    defaultPreferences
};