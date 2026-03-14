import * as Network from 'expo-network';
import { useEffect, useState } from 'react';

type NetworkState = {
  isConnected: boolean;
  isChecking: boolean;
};

export const useNetworkStatus = (): NetworkState => {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    isChecking: true,
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const status = await Network.getNetworkStateAsync();
        if (active) {
          setState({
            isConnected: Boolean(status.isConnected ?? true),
            isChecking: false,
          });
        }
      } catch {
        if (active) {
          setState({
            isConnected: true,
            isChecking: false,
          });
        }
      }
    };

    load();

    const interval = setInterval(load, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return state;
};
