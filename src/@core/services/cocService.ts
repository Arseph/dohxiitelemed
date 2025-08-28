import { globals } from '@/globals';
import axios from 'axios';

const API_URL = `${globals.api}/api/cocs`

export const fetchDocument = async () => {
  try {
    const response = await axios.get(`${API_URL}/document_type`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })

    return response.data
  }
  catch (error) {
   // console.error('Error fetching cocdocument:', error)
    throw error
  }
};

export const fetchUserCOC = async (userId: number) => {
  try {
    const response = await axios.get(`${API_URL}/cocuser/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (response.data.success) {
      return response.data.data; // Return the filtered leaves
    } else {
      console.error('Failed to retrieve user coc:', response.data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching user coc:', error);
    throw error;
  }
};

export const FetchUpdateData = async (app_number: string) => {
  try {
    const response = await axios.get(`${API_URL}/cocretrive/${app_number}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching update data:', error);
    throw error;
  }
};

export const FetchAttachment = async (appNumber: string) => {
  try {
    const response = await axios.get(`${API_URL}/retrieve/${appNumber}`,{
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching attachment data:', error.response?.data || error.message);
    throw new Error('Unable to fetch attachment data. Please try again later.');
  }
};




