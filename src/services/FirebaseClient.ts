import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from '../config/env';

/**
 * Firebase Client - Singleton Pattern
 * Ensures single instance of Firebase services across the application
 * 
 * SOLID Principles:
 * - Single Responsibility: Manages Firebase initialization and service access
 * - Dependency Inversion: Other services depend on this abstraction
 */
class FirebaseClient {
  private static instance: FirebaseClient;
  private app: FirebaseApp;
  private firestoreInstance: Firestore;
  private storageInstance: FirebaseStorage;
  private authInstance: Auth;

  private constructor() {
    this.app = initializeApp(firebaseConfig);
    this.firestoreInstance = getFirestore(this.app);
    this.storageInstance = getStorage(this.app);
    this.authInstance = getAuth(this.app);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      FirebaseClient.instance = new FirebaseClient();
    }
    return FirebaseClient.instance;
  }

  /**
   * Get Firestore instance
   */
  public get firestore(): Firestore {
    return this.firestoreInstance;
  }

  /**
   * Get Storage instance
   */
  public get storage(): FirebaseStorage {
    return this.storageInstance;
  }

  /**
   * Get Auth instance
   */
  public get auth(): Auth {
    return this.authInstance;
  }
}

export default FirebaseClient;
