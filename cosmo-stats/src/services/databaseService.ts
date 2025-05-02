import axios from 'axios';
import { FrequencyData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const getFrequencyRatings = async (school?: string): Promise<FrequencyData[]> => {
  try {
    const url = school 
      ? `${API_BASE_URL}/api/frequency-ratings?school=${encodeURIComponent(school)}`
      : `${API_BASE_URL}/api/frequency-ratings`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching frequency ratings:', error);
    throw error;
  }
}; 