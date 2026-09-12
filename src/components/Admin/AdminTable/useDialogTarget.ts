import { useCallback, useState } from "react";

/**
 * Open/close state for a dialog about one thing (a booking to cancel, a
 * professional to edit).
 *
 * Closing keeps the target: a dialog fades out over ~200ms, and clearing the
 * target on close would blank its text mid-fade. The next `show` replaces it.
 */
export default function useDialogTarget<T>() {
    const [state, setState] = useState<{ target: T | null; open: boolean }>({ target: null, open: false });

    const show = useCallback((target: T) => setState({ target, open: true }), []);
    const close = useCallback(() => setState((current) => ({ ...current, open: false })), []);

    return { target: state.target, open: state.open, show, close };
}
