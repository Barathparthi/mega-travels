'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useSettings(category?: string) {
    return useQuery({
        queryKey: ['settings', category],
        queryFn: async () => {
            const url = category
                ? `/api/admin/settings/${category}`
                : `/api/admin/settings`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch settings');
            const data = await res.json();
            return data.data;
        },
    });
}

export function useUpdateSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            category,
            settings,
        }: {
            category: string;
            settings: Record<string, any>;
        }) => {
            const res = await fetch(`/api/admin/settings/${category}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to update settings');
            }
            return res.json();
        },
        onSuccess: (_, { category }) => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            queryClient.invalidateQueries({ queryKey: ['settings', category] });
            toast.success('Settings saved successfully!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to save settings');
        },
    });
}

export function useUploadLogo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('logo', file);

            const res = await fetch('/api/admin/settings/logo', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error('Failed to upload logo');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'company'] });
            toast.success('Logo uploaded successfully!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to upload logo');
        },
    });
}

// Hook to get specific setting value
export function useSetting(key: string) {
    const { data: settings } = useSettings();
    return settings?.[key];
}
