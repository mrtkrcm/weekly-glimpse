import { checkDatabaseConnection } from '$lib/server/db';

export const load = async () => {
	const isHealthy = await checkDatabaseConnection();
	return {
		isHealthy
	};
};
