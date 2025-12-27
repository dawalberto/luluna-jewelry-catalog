import { useEffect, useState } from 'react';
import { firebaseConfig } from '../../config/env';
import { useI18n } from '../../i18n';
import { StorageService } from '../../services';
import { LoadingSpinner } from '../ui';

const storageService = new StorageService();

interface StorageStats {
  cloudinary: {
    isLoading: boolean;
    error: string | null;
    used: number; // bytes
    limit: number; // bytes
    bandwidth: number; // bytes
    bandwidthLimit: number; // bytes
    transformations: number;
    transformationsLimit: number;
  };
  firebase: {
    isLoading: boolean;
    error: string | null;
    used: number; // bytes
    limit: number; // bytes
    fileCount: number;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

function getPercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
}

export default function StoragePanel() {
  const { t } = useI18n();
  const admin = t.admin as any; // Type casting for new properties
  const [stats, setStats] = useState<StorageStats>({
    cloudinary: {
      isLoading: true,
      error: null,
      used: 0,
      limit: 0,
      bandwidth: 0,
      bandwidthLimit: 0,
      transformations: 0,
      transformationsLimit: 0,
    },
    firebase: {
      isLoading: true,
      error: null,
      used: 0,
      limit: 0,
      fileCount: 0,
    },
  });

  useEffect(() => {
    loadCloudinaryStats();
    loadFirebaseStats();
  }, []);

  const loadCloudinaryStats = async () => {
    try {
      const data = await storageService.getCloudinaryUsage();
      setStats((prev) => ({
        ...prev,
        cloudinary: {
          isLoading: false,
          error: null,
          used: data.used,
          limit: data.limit,
          bandwidth: data.bandwidth,
          bandwidthLimit: data.bandwidthLimit,
          transformations: data.transformations,
          transformationsLimit: data.transformationsLimit,
        },
      }));
    } catch (error) {
      setStats((prev) => ({
        ...prev,
        cloudinary: {
          ...prev.cloudinary,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error loading Cloudinary stats',
        },
      }));
    }
  };

  const loadFirebaseStats = async () => {
    try {
      const data = await storageService.getFirebaseStorageUsage();
      setStats((prev) => ({
        ...prev,
        firebase: {
          isLoading: false,
          error: null,
          used: data.used,
          limit: data.limit,
          fileCount: data.fileCount,
        },
      }));
    } catch (error) {
      setStats((prev) => ({
        ...prev,
        firebase: {
          ...prev.firebase,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error loading Firebase stats',
        },
      }));
    }
  };

  const renderProgressBar = (percentage: number, used: number, limit: number, label: string) => {
    const color = getProgressColor(percentage);
    return (
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-600">
            {formatBytes(used)} / {formatBytes(limit)} ({percentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${color} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderCloudinarySection = () => {
    const { cloudinary } = stats;

    if (cloudinary.isLoading) {
      return (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      );
    }

    // Always show info message since we can't get real usage without backend
    return (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ {admin.storageErrorTitle}</strong>
          </p>
          <p className="text-xs text-blue-700 mt-2">{admin.storageCloudinaryManual}</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Límites del plan gratuito:</h4>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">{admin.storageSpace}:</span>
            <span className="font-medium">{formatBytes(cloudinary.limit)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">{admin.storageBandwidth}:</span>
            <span className="font-medium">{formatBytes(cloudinary.bandwidthLimit)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">{admin.storageTransformations}:</span>
            <span className="font-medium">{formatNumber(cloudinary.transformationsLimit)}</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <a
            href="https://cloudinary.com/console"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {admin.storageOpenDashboard} →
          </a>
        </div>
      </div>
    );
  };

  const renderFirebaseSection = () => {
    const { firebase } = stats;

    if (firebase.isLoading) {
      return (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      );
    }

    // Firebase Storage is not being used - images are stored in Cloudinary
    return (
      <div className="space-y-6">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>✓ Firebase Storage no está en uso</strong>
          </p>
          <p className="text-xs text-green-700 mt-2">
            Tus imágenes se almacenan en Cloudinary. Firebase se usa solo para Firestore (base de datos).
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Servicios de Firebase activos:</h4>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-gray-700">Firestore Database</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-gray-700">Authentication</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-gray-400 mr-2">○</span>
              <span className="text-gray-500">Storage (imágenes en Cloudinary)</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <a
            href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/usage`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Ver uso de Firebase →
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{admin.storageTitle}</h2>
        <p className="text-gray-600 mt-1">{admin.storageSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cloudinary Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg
              className="w-8 h-8 mr-3"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                fill="#3448C5"
                stroke="#3448C5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="#3448C5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="#3448C5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900">Cloudinary</h3>
          </div>
          {renderCloudinarySection()}
        </div>

        {/* Firebase Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg
              className="w-8 h-8 mr-3"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.5 19.5L9 15L4.5 10.5V19.5Z"
                fill="#FFA000"
              />
              <path
                d="M9 15L13.5 19.5L18 9L9 15Z"
                fill="#F57C00"
              />
              <path
                d="M13.5 19.5L18 9L15 3L9 15L13.5 19.5Z"
                fill="#FFCA28"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900">Firebase Storage</h3>
          </div>
          {renderFirebaseSection()}
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>{admin.storageNote}:</strong> {admin.storageNoteText}
        </p>
      </div>
    </div>
  );
}
