import axios from 'axios';
import type { MapData, MapListItem, Tile } from '../types/game.types';
import { authService } from './auth.service';

const API_BASE_URL = 'http://100.121.246.85:4025/api';

export interface CreateMapData {
  name: string;
  width: number;
  height: number;
  tiles: Tile[][];
  isPublished?: boolean;
  isDefaultSpawn?: boolean;
}

export interface UpdateMapData {
  name?: string;
  width?: number;
  height?: number;
  tiles?: Tile[][];
  isPublished?: boolean;
  isDefaultSpawn?: boolean;
}

export interface MapResponse<T = MapData> {
  success: boolean;
  message?: string;
  data?: {
    map: T;
  };
}

export interface MapsListResponse {
  success: boolean;
  message?: string;
  data?: {
    maps: MapListItem[];
    count: number;
  };
}

class MapService {
  // Get authorization headers
  private getAuthHeaders() {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Get all maps
  async getAllMaps(): Promise<MapsListResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/maps`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Get map by ID (with full tile data)
  async getMapById(id: string): Promise<MapResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/maps/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Get default spawn map
  async getDefaultMap(): Promise<MapResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/maps/default`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Create new map (developer only)
  async createMap(data: CreateMapData): Promise<MapResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/maps`, data, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Update map (developer only)
  async updateMap(id: string, data: UpdateMapData): Promise<MapResponse> {
    try {
      const response = await axios.put(`${API_BASE_URL}/maps/${id}`, data, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Delete map (developer only)
  async deleteMap(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/maps/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Toggle publish status (developer only)
  async togglePublish(id: string): Promise<MapResponse> {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/maps/${id}/publish`,
        {},
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Set as default spawn (developer only)
  async setDefaultSpawn(id: string): Promise<MapResponse> {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/maps/${id}/set-default`,
        {},
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Upload background image (developer only)
  async uploadBackgroundImage(
    id: string,
    file: File
  ): Promise<MapResponse & { data?: { map: MapData; imageUrl: string } }> {
    try {
      const formData = new FormData();
      formData.append('background', file);

      const response = await axios.post(`${API_BASE_URL}/maps/${id}/background`, formData, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }
}

export const mapService = new MapService();
