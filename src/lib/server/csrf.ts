export function generateCsrfToken(userId: string): string {
	// In a real implementation, generate a secure token based on user id and a secret
	return 'dummy-token';
}

export function validateCsrfToken(token: string, userId?: string): boolean {
	// In a real implementation, validate the token properly
	return token === 'dummy-token';
}
