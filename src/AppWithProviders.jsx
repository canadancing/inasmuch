// Central provider wrapper for all app-level contexts
import { useAuth } from './hooks/useAuth';
import { InventoryProvider } from './context/InventoryContext';
import App from './App';

export default function AppWithProviders() {
    const authProps = useAuth();

    return (
        <InventoryProvider user={authProps.user}>
            <App {...authProps} />
        </InventoryProvider>
    );
}
