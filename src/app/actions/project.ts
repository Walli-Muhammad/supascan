'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Deletes a project and all its scan history.
 * Verifies ownership before deleting — RLS provides a second layer of protection.
 */
export async function deleteProject(projectRef: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Verify ownership (belt + suspenders on top of RLS)
    const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('project_ref', projectRef)
        .eq('user_id', user.id)
        .single();

    if (!project) {
        throw new Error('Project not found or access denied');
    }

    // Delete — cascade will remove scan_history rows
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
        .eq('user_id', user.id);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard');
    redirect('/dashboard');
}
