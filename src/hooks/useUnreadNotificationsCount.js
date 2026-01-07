// Hook to count unread notifications for current user
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useUnreadNotificationsCount(user) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!user) {
            setCount(0);
            return;
        }

        // Listen to unread notifications for this user
        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('targetUid', '==', user.uid),
            where('read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user]);

    return count;
}
