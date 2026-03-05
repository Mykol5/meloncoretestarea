import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY;

  async geocodeAddress(address: {
    streetNumber?: string;
    streetName?: string;
    landmark?: string;
    city?: string;
    lga?: string;
    state?: string;
    country?: string;
  }): Promise<GeocodingResult | null> {
    if (!this.apiKey) {
      this.logger.warn('Google Maps API key not configured');
      return null;
    }

    const parts = [
      address.streetNumber,
      address.streetName,
      address.landmark,
      address.city,
      address.lga,
      address.state,
      address.country || 'Nigeria',
    ].filter(Boolean);

    const fullAddress = parts.join(', ');

    if (fullAddress.length < 10) {
      this.logger.warn('Address too short for geocoding');
      return null;
    }

    try {
      this.logger.log(`Geocoding address: ${fullAddress}`);

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: fullAddress,
            key: this.apiKey,
          },
          timeout: 10000,
        },
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        const result: GeocodingResult = {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: response.data.results[0].formatted_address,
        };

        this.logger.log(
          `Geocoding successful: ${result.latitude}, ${result.longitude}`,
        );
        return result;
      } else {
        this.logger.warn(`Geocoding failed: ${response.data.status}`);
        return null;
      }
    } catch (error) {
      this.logger.error('Geocoding error:', error.message);
      return null;
    }
  }

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    if (!this.apiKey) {
      this.logger.warn('Google Maps API key not configured');
      return null;
    }

    try {
      this.logger.log(`Reverse geocoding: ${latitude}, ${longitude}`);

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            latlng: `${latitude},${longitude}`,
            key: this.apiKey,
          },
          timeout: 10000,
        },
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const formattedAddress = response.data.results[0].formatted_address;
        this.logger.log(`Reverse geocoding successful: ${formattedAddress}`);
        return formattedAddress;
      } else {
        this.logger.warn(`Reverse geocoding failed: ${response.data.status}`);
        return null;
      }
    } catch (error) {
      this.logger.error('Reverse geocoding error:', error.message);
      return null;
    }
  }
}
