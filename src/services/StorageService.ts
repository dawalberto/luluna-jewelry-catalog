
interface CloudinaryUsage {
  used: number; // bytes
  limit: number; // bytes
  bandwidth: number; // bytes
  bandwidthLimit: number; // bytes
  transformations: number;
  transformationsLimit: number;
}

interface FirebaseStorageUsage {
  used: number; // bytes
  limit: number; // bytes
  fileCount: number;
}

export class StorageService {
  /**
   * Get Cloudinary usage statistics
   * Note: This requires server-side implementation with API Key and Secret
   * For now, we'll return default limits for free tier
   */
  async getCloudinaryUsage(): Promise<CloudinaryUsage> {
    // Cloudinary Admin API requires API Secret which should NEVER be exposed in client-side code
    // This is a placeholder that shows free tier limits
    // To get real usage, you need to implement a backend endpoint
    
    // Free tier limits (as of 2025)
    const GB = 1024 * 1024 * 1024;
    
    return {
      used: 0, // Would need backend to fetch real usage
      limit: 25 * GB, // 25 GB storage
      bandwidth: 0, // Would need backend to fetch real usage
      bandwidthLimit: 25 * GB, // 25 GB bandwidth per month
      transformations: 0, // Would need backend to fetch real usage
      transformationsLimit: 25000, // 25,000 transformations per month
    };
  }

  /**
   * Get Firebase Storage usage statistics
   * Note: Listing files requires proper CORS configuration and authentication
   * This method returns free tier limits. For actual usage, check Firebase Console
   */
  async getFirebaseStorageUsage(): Promise<FirebaseStorageUsage> {
    // Firebase Storage listAll() requires:
    // 1. Proper CORS configuration in Firebase Console
    // 2. User authentication with proper permissions
    // 3. Storage Rules that allow listing
    //
    // To avoid CORS errors and authentication issues, we return default limits
    // Users should check the Firebase Console for actual usage details
    
    // Firebase free tier: 5 GB storage, Blaze plan: pay as you go
    const GB = 1024 * 1024 * 1024;
    const freeLimit = 5 * GB;

    return {
      used: 0, // Would need backend or authenticated access to fetch real usage
      limit: freeLimit,
      fileCount: 0, // Would need backend or authenticated access to fetch real count
    };
  }
}
