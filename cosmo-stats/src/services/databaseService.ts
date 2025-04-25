import axios from 'axios';
import { FrequencyData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4001';

export const getFrequencyRatings = async (): Promise<FrequencyData[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/frequency-ratings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching frequency ratings:', error);
    throw error;
  }
}; 