import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuantityStepper from './QuantityStepper';

describe('QuantityStepper', () => {
    it('renders with initial quantity', () => {
        render(<QuantityStepper quantity={5} onChange={() => { }} />);
        expect(screen.getByText('5')).toBeDefined();
    });

    it('calls onChange with incremented value', () => {
        const onChange = vi.fn();
        render(<QuantityStepper quantity={5} onChange={onChange} />);

        const incrementButton = screen.getByLabelText('Increase quantity');
        fireEvent.click(incrementButton);

        expect(onChange).toHaveBeenCalledWith(6);
    });

    it('calls onChange with decremented value', () => {
        const onChange = vi.fn();
        render(<QuantityStepper quantity={5} onChange={onChange} />);

        const decrementButton = screen.getByLabelText('Decrease quantity');
        fireEvent.click(decrementButton);

        expect(onChange).toHaveBeenCalledWith(4);
    });

    it('disables decrement button when at min', () => {
        render(<QuantityStepper quantity={1} min={1} onChange={() => { }} />);
        const decrementButton = screen.getByLabelText('Decrease quantity');
        expect(decrementButton).toBeDisabled();
    });

    it('disables increment button when at max', () => {
        render(<QuantityStepper quantity={10} max={10} onChange={() => { }} />);
        const incrementButton = screen.getByLabelText('Increase quantity');
        expect(incrementButton).toBeDisabled();
    });
});
