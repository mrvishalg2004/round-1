/**
 * Safely parses JSON from a response and handles various error scenarios
 */
export async function safelyParseJSON(response: Response) {
  try {
    // First check if the response is ok
    if (!response.ok) {
      // Try to get error information
      const errorText = await response.text();
      
      try {
        // Try to parse as JSON
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API error: ${response.status}`);
      } catch (jsonError) {
        // If JSON parsing fails, use the raw text
        throw new Error(errorText || `API error: ${response.status}`);
      }
    }

    // For successful responses, safely parse JSON
    const text = await response.text();
    
    // Handle empty responses
    if (!text) {
      return {};
    }
    
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse JSON from successful response:', error);
      return { error: 'Invalid JSON response from server' };
    }
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
} 