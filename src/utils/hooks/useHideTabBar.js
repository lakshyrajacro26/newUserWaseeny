import { useLayoutEffect } from 'react';

export default function useHideTabBar(navigation) {
  useLayoutEffect(() => {
    const parent = navigation.getParent();

    parent?.setOptions({
      tabBarStyle: { display: 'none' },
    });

    return () => {
      parent?.setOptions({
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 0,
          elevation: 8,
        },
      });
    };
  }, [navigation]);
}
