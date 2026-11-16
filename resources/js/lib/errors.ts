export function errorMessage(error: unknown): string | undefined {
    if (typeof error === 'string') {
        return error;
    }

    if (Array.isArray(error) && typeof error[0] === 'string') {
        return error[0];
    }

    return undefined;
}
