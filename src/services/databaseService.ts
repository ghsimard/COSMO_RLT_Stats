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

export const getSchoolsWithLowSubmissions = async (): Promise<School[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/schools/low-submissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching schools with low submissions:', error);
    throw error;
  }
};

export const getSubmissionCounts = async (schoolId: string): Promise<{
  docentes: number;
  estudiantes: number;
  acudientes: number;
}> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/schools/${schoolId}/submissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching submission counts:', error);
    throw error;
  }
};

export const getSchoolContactInfo = async (schoolId: string): Promise<School> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/schools/${schoolId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching school contact info:', error);
    throw error;
  }
}; 