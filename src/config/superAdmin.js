// Super Admin configuration
export const SUPER_ADMIN_EMAILS = ['loading800@gmail.com'];

export const isSuperAdmin = (user) => {
    if (!user?.email) return false;
    return SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());
};
