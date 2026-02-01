import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
    it('renders correctly in light mode', () => {
        render(<ThemeToggle isDark={false} onToggle={() => { }} />);
        expect(screen.getByLabelText('Switch to dark mode')).toBeDefined();
    });

    it('renders correctly in dark mode', () => {
        render(<ThemeToggle isDark={true} onToggle={() => { }} />);
        expect(screen.getByLabelText('Switch to light mode')).toBeDefined();
    });

    it('calls onToggle when clicked', () => {
        const onToggle = vi.fn();
        render(<ThemeToggle isDark={false} onToggle={onToggle} />);

        const button = screen.getByLabelText('Switch to dark mode');
        fireEvent.click(button);

        expect(onToggle).toHaveBeenCalledTimes(1);
    });
});
