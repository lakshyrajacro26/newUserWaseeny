import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeToNetworkChanges,
  onNetworkReconnected,
  showNetworkToast,
  getPendingRequests,
  getPendingRequestCount,
  clearPendingRequests,
  initializePendingRequests,
  detectNetworkQuality,
  checkInternetConnection,
} from '../utils/networkUtils';

export const NetworkContext = createContext();

/**
 * NetworkProvider - Global provider for network state and management
 * Tracks internet connection status and provides utilities for offline handling
 */
export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');
  const [isNetworkReconnecting, setIsNetworkReconnecting] = useState(false);
  const [networkQuality, setNetworkQuality] = useState('unknown');
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [lastReconnectTime, setLastReconnectTime] = useState(null);

  const connectionTypeRef = useRef(null);
  const wasOfflineRef = useRef(false);

  // Initialize pending requests from storage on mount
  useEffect(() => {
    const initializeNetwork = async () => {
      try {
        await initializePendingRequests();
        setPendingRequestCount(getPendingRequestCount());

        // Get initial network state
        const initialState = await checkInternetConnection();
        setIsConnected(initialState.isConnected);
        setIsInternetReachable(initialState.isInternetReachable);
        setConnectionType(initialState.type);

        // Detect network quality
        const quality = await detectNetworkQuality();
        setNetworkQuality(quality);

        console.log('[Network] Provider initialized:', initialState);
      } catch (error) {
        console.error('[Network] Error initializing provider:', error);
      }
    };

    initializeNetwork();
  }, []);

  // Subscribe to network changes
  useEffect(() => {
    const unsubscribe = subscribeToNetworkChanges(async (networkState) => {
      const prevInternetReachable = isInternetReachable;

      setIsConnected(networkState.isConnected);
      setIsInternetReachable(networkState.isInternetReachable);
      setConnectionType(networkState.type);

      // Detect network quality when connection state changes
      if (networkState.isInternetReachable) {
        const quality = await detectNetworkQuality();
        setNetworkQuality(quality);
      } else {
        setNetworkQuality('offline');
      }

      // Trigger toast notification for network changes
      if (
        prevInternetReachable !== undefined &&
        prevInternetReachable !== networkState.isInternetReachable
      ) {
        showNetworkToast(networkState.isInternetReachable);
      }

      console.log('[Network] State changed:', {
        isConnected: networkState.isConnected,
        isInternetReachable: networkState.isInternetReachable,
        type: networkState.type,
        quality: networkState.isInternetReachable ? 'detecting...' : 'offline',
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isInternetReachable]);

  // Handle network reconnection and retry pending API calls
  useEffect(() => {
    const unsubscribeReconnect = onNetworkReconnected(async () => {
      console.log('[Network] Connection restored, retrying pending requests...');
      setIsNetworkReconnecting(true);
      setLastReconnectTime(new Date());

      try {
        // Get pending requests
        const pendingReqs = getPendingRequests();
        console.log(
          `[Network] Found ${pendingReqs.length} pending requests to retry`,
        );

        if (pendingReqs.length > 0) {
          // Show toast with pending request count
          showNetworkToast(true);

          // Retry each pending request
          let successCount = 0;
          for (const request of pendingReqs) {
            try {
              if (request.apiFunction) {
                await request.apiFunction();
                successCount++;
                console.log(
                  `[Network] Pending request retried successfully: ${request.id}`,
                );
              }
            } catch (error) {
              console.warn(
                `[Network] Failed to retry request ${request.id}:`,
                error.message,
              );
            }
          }

          console.log(
            `[Network] Retry complete: ${successCount}/${pendingReqs.length} successful`,
          );

          // Clear successful requests
          await clearPendingRequests();
          setPendingRequestCount(0);
        }
      } finally {
        setIsNetworkReconnecting(false);
      }
    });

    return () => {
      if (unsubscribeReconnect) {
        unsubscribeReconnect();
      }
    };
  }, []);

  // Fetch pending request count periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingRequestCount(getPendingRequestCount());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    // Connection status
    isConnected,
    isInternetReachable,
    connectionType,
    isOffline: !isInternetReachable,
    isOnline: isInternetReachable,

    // Network quality
    networkQuality,

    // Retry status
    isNetworkReconnecting,
    pendingRequestCount,
    lastReconnectTime,

    // Utilities
    getPendingRequests,
    clearPendingRequests,
  };

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
};

/**
 * Custom hook to access network context
 */
export const useNetwork = () => {
  const context = React.useContext(NetworkContext);

  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }

  return context;
};
