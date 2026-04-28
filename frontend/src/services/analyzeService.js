import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';

export async function analyzeContent(input) {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/summarize-text`, {
      text: input,
      summary_mode: 'medium'
    });
    
    // Transform merged_backend response to expected frontend format if needed
    // The merged_backend returns: { summary, detailedSummary, keywords, entities, ... }
    return {
      ...response.data,
      topics: response.data.keywords || [],
      // For text input, merged_backend /api/summarize-text doesn't return flashcards/quiz
      // unless we use /api/full-text (which doesn't exist yet, but we could add)
      // For now, let's just return what we have.
    };
  } catch (error) {
    console.error('Analysis failed:', error);
    throw new Error(error.response?.data?.error || 'Failed to analyze text content');
  }
}

export async function analyzeFull(file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  if (options.mode) formData.append('summary_mode', options.mode);
  if (options.flashcardCount) formData.append('flashcard_count', options.flashcardCount);
  if (options.quizCount) formData.append('quiz_count', options.quizCount);

  try {
    const response = await axios.post(`${BACKEND_URL}/api/full`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('Full analysis failed:', error);
    throw new Error(error.response?.data?.error || 'Failed to analyze document');
  }
}

export async function analyzeFullText(text, options = {}) {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/full-text`, {
      text,
      summary_mode: options.mode || 'medium',
      flashcard_count: options.flashcardCount || 10,
      quiz_count: options.quizCount || 5
    });
    return response.data;
  } catch (error) {
    console.error('Full text analysis failed:', error);
    throw new Error(error.response?.data?.error || 'Failed to analyze text content');
  }
}

