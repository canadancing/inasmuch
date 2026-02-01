import '@testing-library/jest-dom';
import { vi } from 'vitest';

const localStorageMock = (function () {
    let store = {};
    return {
        getItem: vi.fn(key => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        removeItem: vi.fn(key => {
            delete store[key];
        }),
    };
})();

vi.stubGlobal('localStorage', localStorageMock);
