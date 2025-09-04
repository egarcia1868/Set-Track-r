import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BASE_URL } from '../utils/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { isAuthenticated, user, getAccessTokenSilently, isLoading: auth0Loading } = useAuth0();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fetchUserProfile = async () => {
    if (!isAuthenticated || !user) {
      setUserProfile(null);
      return;
    }

    setIsLoadingProfile(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        setUserProfile(profileData.profile);
      } else {
        console.error('Failed to fetch user profile:', response.status);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && !userProfile && !isLoadingProfile) {
      fetchUserProfile();
    }
    // Clear profile when user logs out
    if (!isAuthenticated) {
      setUserProfile(null);
    }
  }, [isAuthenticated, user]);

  const value = {
    isAuthenticated,
    user,
    getAccessTokenSilently,
    userProfile,
    fetchUserProfile,
    isLoading: auth0Loading || isLoadingProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};