import { useEffect, useRef, useCallback } from 'react';

/**
 * useKeyboardClose — Press Escape to close a modal.
 * @param {boolean} isOpen - Whether the modal is currently visible.
 * @param {Function} onClose - Callback to dismiss.
 */
export function useKeyboardClose(isOpen, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);
}

/**
 * useFocusTrap — Trap focus within a container when a modal is open.
 * Returns a ref to attach to the modal container.
 * @param {boolean} isOpen
 */
export function useFocusTrap(isOpen) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]',
    ].join(',');

    const focusable = Array.from(container.querySelectorAll(focusableSelectors));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handler = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handler);

    // Auto-focus first focusable element
    const autoFocus = container.querySelector('[data-autofocus]') || first;
    if (autoFocus) {
      setTimeout(() => autoFocus.focus(), 50);
    }

    return () => container.removeEventListener('keydown', handler);
  }, [isOpen]);

  return containerRef;
}

/**
 * useAnnounce — Announce a message to screen readers via aria-live region.
 * @returns {Function} announce(message)
 */
export function useAnnounce() {
  const announce = useCallback((message) => {
    const el = document.getElementById('sr-announcer');
    if (el) {
      el.textContent = '';
      // Force re-read by clearing then setting
      requestAnimationFrame(() => {
        el.textContent = message;
      });
    }
  }, []);
  return announce;
}
