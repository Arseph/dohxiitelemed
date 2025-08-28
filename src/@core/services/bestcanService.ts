import { globals } from '@/globals';
import axios from 'axios';

const API_URL = `${globals.api}/api/bestcans`

export const fetchDivision = async () => {
  try {
    const response = await axios.get(`${API_URL}/division`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    return response.data.division; // Extract the `division` array from the response
  } catch (error) {
    console.error('Error fetching divisions:', error);
    throw error;
  }
};


export const fetchSectionsByDivision  = async (divisionid: number) => {
  try {
    const response = await axios.get(`${API_URL}/sections/${divisionid}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    return response.data; // Extract the `division` array from the response
  } catch (error) {
    console.error('Error fetching divisions:', error);
    throw error;
  }
};

export const fetchEmployee = async (params: { divid?: number; secid?: number }) => {
  try {
    const response = await axios.get(`${API_URL}/employees`, {
      params, // Pass division and section IDs as query parameters
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    return response.data; // Return the full response data
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error; // Re-throw the error to handle it where the function is called
  }
};

export const fetchPosition = async (employeeId: number) => {
  try {
    const response = await axios.get(`${API_URL}/position/${employeeId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    return response.data; 
  } catch (error) {
    console.error('Error fetching position:', error);
    throw error;
  }
};

export const fetchNomineesData  = async () => {
  try {
    const response = await axios.get(`${API_URL}/fetch-nominees`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const fetchNomineeData = async (employeeId: number) => {
  try {
    const response = await axios.get(`${API_URL}/get-position-emp`, {
      params: { id: employeeId }, // Pass the employee ID as a query parameter
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (response.data) {
      console.log('Fetched Nominee Data:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching nominee data:', error);
    throw error;
  }
};





