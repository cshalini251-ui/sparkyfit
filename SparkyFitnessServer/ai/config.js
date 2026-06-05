function getDefaultModel(serviceType) {
  switch (serviceType) {
    case 'openai':
    case 'openai_compatible':
      return 'gpt-4o-mini';
    case 'anthropic':
      return 'claude-3-5-sonnet-20241022';
    case 'google':
      return 'gemini-2.5-flash';
    case 'mistral':
      return 'mistral-large-latest';
    case 'groq':
      return 'llama3-8b-8192';
    default:
      return 'gpt-3.5-turbo';
  }
}

module.exports = {
  getDefaultModel
};