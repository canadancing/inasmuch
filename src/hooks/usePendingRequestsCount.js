// Hook to count pending access requests for current user
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export function usePendingRequestsCount(user) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!user) {
            setCount(0);
            return;
        }

        // Listen to pending requests where user is the target
        const requestsRef = collection(db, 'accessRequests');
        const q = query(
            requestsRef,
            where('targetUserId', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user]);

    return count;
}
