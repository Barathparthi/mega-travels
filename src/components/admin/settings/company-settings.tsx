'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings, useUpdateSettings, useUploadLogo } from '@/hooks/useSettings';
import { FormSkeleton } from '@/components/shared/skeletons';
import { ErrorPage } from '@/components/shared/error-page';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { companySettingsSchema } from '@/lib/validations/settings.schema';
import { toast } from 'sonner';

type CompanyFormData = z.infer<typeof companySettingsSchema>;

export function CompanySettings() {
    const { data: settings, isLoading, error } = useSettings('company');
    const { mutate: updateSettings, isPending } = useUpdateSettings();
    const { mutate: uploadLogo, isPending: isUploading } = useUploadLogo();
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CompanyFormData>({
        resolver: zodResolver(companySettingsSchema),
        values: settings || {},
    });

    const onSubmit = (data: CompanyFormData) => {
        updateSettings({ category: 'company', settings: data });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            toast.error('Invalid file type. Only PNG and JPG allowed.');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 2MB.');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        uploadLogo(file);
    };

    if (isLoading) return <FormSkeleton />;
    if (error) return <ErrorPage message="Failed to load company settings" />;

    const currentLogo = settings?.['company.logo'] || '/logo.svg';

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <Label>Company Logo</Label>
                        <div className="flex items-center gap-6">
                            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                                {logoPreview || currentLogo ? (
                                    <Image
                                        src={logoPreview || currentLogo}
                                        alt="Company Logo"
                                        width={128}
                                        height={128}
                                        className="object-contain"
                                    />
                                ) : (
                                    <Upload className="w-8 h-8 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <Input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={handleLogoUpload}
                                    disabled={isUploading}
                                    className="max-w-xs"
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    Recommended: 200x200px, PNG or JPG (max 2MB)
                                </p>
                                {isUploading && (
                                    <p className="text-sm text-brand-red mt-2 flex items-center gap-2">
                                        <LoadingSpinner size="sm" />
                                        Uploading...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2">
                        <Label htmlFor="company.name">
                            Company Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="company.name"
                            {...register('company.name')}
                            placeholder="Mayaa Travels"
                        />
                        {errors['company.name'] && (
                            <p className="text-sm text-red-500">
                                {errors['company.name'].message}
                            </p>
                        )}
                    </div>

                    {/* Address Line 1 */}
                    <div className="space-y-2">
                        <Label htmlFor="company.address1">Address Line 1</Label>
                        <Input
                            id="company.address1"
                            {...register('company.address1')}
                            placeholder="123, Industrial Area"
                        />
                    </div>

                    {/* Address Line 2 */}
                    <div className="space-y-2">
                        <Label htmlFor="company.address2">Address Line 2</Label>
                        <Input
                            id="company.address2"
                            {...register('company.address2')}
                            placeholder="Chennai, Tamil Nadu - 600001"
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <Label htmlFor="company.phone">Phone Number</Label>
                        <Input
                            id="company.phone"
                            {...register('company.phone')}
                            placeholder="+91 98765 43210"
                            type="tel"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="company.email">Email</Label>
                        <Input
                            id="company.email"
                            {...register('company.email')}
                            placeholder="admin@mayaaenterprises.com"
                            type="email"
                        />
                        {errors['company.email'] && (
                            <p className="text-sm text-red-500">
                                {errors['company.email'].message}
                            </p>
                        )}
                    </div>

                    {/* GST Number */}
                    <div className="space-y-2">
                        <Label htmlFor="company.gst">GST Number</Label>
                        <Input
                            id="company.gst"
                            {...register('company.gst')}
                            placeholder="33AABCM1234E1Z5"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-brand-red hover:bg-brand-red/90"
                        >
                            {isPending ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>💾 Save Changes</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
