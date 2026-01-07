// Hook for super admin data fetching
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase/config';
import { isSuperAdmin } from '../config/superAdmin';

export function useSuperAdmin(user) {
    const [users, setUsers] = useState([]);
    const [inventories, setInventories] = useState([]);
    const [metrics, setMetrics] = useState({
        totalUsers: 0,
        totalInventories: 0,
        totalItems: 0,
        activeToday: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const hasAccess = isSuperAdmin(user);

    // Fetch all data
    useEffect(() => {
        if (!hasAccess) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch all users
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const usersData = usersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.() || null
                }));
                setUsers(usersData);

                // Fetch all inventories
                const inventoriesSnapshot = await getDocs(collection(db, 'inventories'));
                const inventoriesData = await Promise.all(
                    inventoriesSnapshot.docs.map(async (invDoc) => {
                        const invData = invDoc.data();

                        // Get items count
                        let itemsCount = 0;
                        try {
                            const itemsSnapshot = await getCountFromServer(
                                collection(db, `inventories/${invDoc.id}/items`)
                            );
                            itemsCount = itemsSnapshot.data().count;
                        } catch (e) {
                            console.warn('Could not count items:', e);
                        }

                        // Get owner info
                        const owner = usersData.find(u => u.uid === invData.ownerId);

                        return {
                            id: invDoc.id,
                            ...invData,
                            itemsCount,
                            ownerName: owner?.displayName || 'Unknown',
                            ownerEmail: owner?.email || 'Unknown'
                        };
                    })
                );
                setInventories(inventoriesData);

                // Calculate metrics
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const totalItems = inventoriesData.reduce((sum, inv) => sum + inv.itemsCount, 0);

                setMetrics({
                    totalUsers: usersData.length,
                    totalInventories: inventoriesData.length,
                    totalItems,
                    activeToday: usersData.filter(u => {
                        const lastActive = u.lastActive?.toDate?.() || u.createdAt;
                        return lastActive && lastActive >= today;
                    }).length
                });

            } catch (err) {
                console.error('Super admin fetch error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [hasAccess]);

    // Suspend/unsuspend user
    const toggleUserSuspension = async (userId, currentStatus) => {
        if (!hasAccess) return;

        try {
            await updateDoc(doc(db, 'users', userId), {
                suspended: !currentStatus,
                suspendedAt: !currentStatus ? new Date() : null
            });

            setUsers(users.map(u =>
                u.id === userId
                    ? { ...u, suspended: !currentStatus }
                    : u
            ));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    // Delete user
    const deleteUser = async (userId) => {
        if (!hasAccess) return;

        try {
            await deleteDoc(doc(db, 'users', userId));
            setUsers(users.filter(u => u.id !== userId));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    // Refresh data
    const refresh = async () => {
        if (!hasAccess) return;
        setLoading(true);
        // Re-trigger useEffect by toggling a state would be complex,
        // so we'll directly call fetch logic again
        window.location.reload();
    };

    return {
        hasAccess,
        users,
        inventories,
        metrics,
        recentActivity,
        loading,
        error,
        toggleUserSuspension,
        deleteUser,
        refresh
    };
}
