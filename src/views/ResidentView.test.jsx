import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResidentView from './ResidentView';

// Mock dependencies
vi.mock('../hooks/useFirestore', () => ({
    useFirestore: () => ({
        updateItem: vi.fn(),
    }),
}));

vi.mock('../components/ItemGrid', () => ({
    default: ({ items, onConsume }) => (
        <div data-testid="item-grid">
            {items.map(item => (
                <div key={item.id} data-testid={`item-${item.id}`}>
                    {item.name}
                    <button onClick={() => onConsume(item)}>Consume</button>
                </div>
            ))}
        </div>
    ),
}));

describe('ResidentView', () => {
    const mockItems = [
        { id: '1', name: 'Milk', currentStock: 5, minStock: 2, icon: '🥛', tags: ['dairy'] },
        { id: '2', name: 'Bread', currentStock: 0, minStock: 1, icon: '🍞', tags: ['bakery'] },
        { id: '3', name: 'Eggs', currentStock: 1, minStock: 2, icon: '🥚', tags: ['dairy'] },
    ];

    const mockResidents = [{ id: 'r1', name: 'John' }];

    beforeEach(() => {
        localStorage.clear();
    });

    it('renders all items by default', () => {
        render(
            <ResidentView
                items={mockItems}
                loading={false}
                residents={mockResidents}
            />
        );

        expect(screen.getByText('Milk')).toBeDefined();
        expect(screen.getByText('Bread')).toBeDefined();
        expect(screen.getByText('Eggs')).toBeDefined();
    });

    it('filters items correctly by search query', () => {
        render(
            <ResidentView
                items={mockItems}
                loading={false}
                residents={mockResidents}
            />
        );

        const searchInput = screen.getByPlaceholderText('Search items...');
        fireEvent.change(searchInput, { target: { value: 'Milk' } });

        expect(screen.getByText('Milk')).toBeDefined();
        expect(screen.queryByText('Bread')).toBeNull();
    });

    it('filters items correctly by stock status', () => {
        render(
            <ResidentView
                items={mockItems}
                loading={false}
                residents={mockResidents}
            />
        );

        // Click "Low Stock"
        fireEvent.click(screen.getByText('Low Stock'));
        expect(screen.queryByText('Milk')).toBeNull();
        expect(screen.getByText('Eggs')).toBeDefined();

        // Click "Out of Stock"
        fireEvent.click(screen.getByText('Out of Stock'));
        expect(screen.getByText('Bread')).toBeDefined();
        expect(screen.queryByText('Eggs')).toBeNull();
    });

    it('shows loading state', () => {
        render(
            <ResidentView
                items={[]}
                loading={true}
                residents={[]}
            />
        );

        expect(screen.getByText('Loading...')).toBeDefined();
    });
});
