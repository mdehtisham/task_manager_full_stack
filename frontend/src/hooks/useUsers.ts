import { useState, useEffect } from 'react';
import { User } from '../types';
import { usersApi } from '../api/client';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    usersApi
      .list()
      .then((res) => setUsers(res.data.data))
      .catch(() => setUsers([]))
      .finally(() => setIsLoading(false));
  }, []);

  return { users, isLoading };
}
