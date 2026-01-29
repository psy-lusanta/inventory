// src/contexts/UserContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  const loadUser = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const userId = decoded.id;
      const savedAvatars = JSON.parse(localStorage.getItem('userAvatars') || '{}');
      const savedAvatar = savedAvatars[userId] || decoded.avatar_url || 'https://i.pravatar.cc/300';

      setUser({
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        employee_name: decoded.employee_name,
        avatar_url: savedAvatar,
      });
    } catch (err) {
      console.error('Invalid token');
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();  

    const handleStorage = (e) => {
      if (e.key === 'token' || e.key === 'userAvatars') loadUser();
    };
    window.addEventListener('storage', handleStorage);

    window.addEventListener('tokenUpdated', loadUser);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('tokenUpdated', loadUser);
    };
  }, []);

  const updateAvatar = (newUrl) => {
    if (!user?.id) return;

    setUser(prev => ({ ...prev, avatar_url: newUrl }));

    const savedAvatars = JSON.parse(localStorage.getItem('userAvatars') || '{}');
    savedAvatars[user.id] = newUrl;
    localStorage.setItem('userAvatars', JSON.stringify(savedAvatars));

    window.dispatchEvent(new Event('storage'));
  };

  return (
    <UserContext.Provider value={{ user, updateAvatar }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);