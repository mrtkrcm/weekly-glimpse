import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
  login: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email');
    const password = data.get('password');

    try {
      const user = await auth.authenticateUser('email', email, password);
      return { success: true, user };
    } catch (error) {
      return fail(400, { error: 'Invalid credentials' });
    }
  },
  logout: async ({ locals }) => {
    await auth.invalidateSession(locals.session);
    throw redirect(302, '/');
  },
};
