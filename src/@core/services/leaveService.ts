import { globals } from '@/globals';
import axios from 'axios';

const API_URL = `${globals.api}/api/leaves`

export const fetchLeaveType = async () => {
  try {
    const response = await axios.get(`${API_URL}/leavetype`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })

    return response.data
  }
  catch (error) {
    console.error('Error fetching leavetype:', error)
    throw error
  }
}

export const fetchLeaveDetails = async (leaveTypeId: number) => {
  try {
    const response = await axios.get(`${API_URL}/leavedetails?leaveTypeId=${leaveTypeId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })

    return response.data
  }
  catch (error) {
    console.error('Error fetching leavetype:', error)
    throw error
  }
}
export const FetchUpdateData = async (id: number) => {
  try {
    const response = await axios.get(`${API_URL}/leaveretrive/${id}`, {
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

export const fetchUserLeaves = async (userId: number) => {
  try {
    const response = await axios.get(`${API_URL}/leaveuser/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (response.data.success) {
      return response.data.data; // Return the filtered leaves
    } else {
      console.error('Failed to retrieve user leaves:', response.data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching user leaves:', error);
    throw error;
  }
};

