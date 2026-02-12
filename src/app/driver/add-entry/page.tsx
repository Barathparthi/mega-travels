'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Calendar as CalendarIcon,
    Truck,
    Info,
    Check
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AddEntryPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const searchParams = useSearchParams();

    // Get date from URL parameter or use today's date
    const dateParam = searchParams.get('date');
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const initialDate = dateParam || todayStr;

    // State
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'working' | 'off'>('working'); // Replaced tripType
    const [date, setDate] = useState(initialDate);

    // Form Data
    const [formData, setFormData] = useState({
        openingKm: 0,
        closingKm: '',
        startTime: '06:00', // 12-hour format: HH:MM AM/PM
        startTimeHour: '6',
        startTimeMinute: '00',
        startTimePeriod: 'AM',
        closingTime: '18:00', // 24-hour format for backend
        closingTimeHour: '18', // Hours 13-24 (24 = midnight, send as 00)
        closingTimeMinute: '00', // 00 or 30
        fuelLitres: '',
        fuelAmount: '',
        remarks: ''
    });

    const [vehicleInfo, setVehicleInfo] = useState<any>(null);
    const [isEditingExisting, setIsEditingExisting] = useState(false);
    const [fuelPrice, setFuelPrice] = useState<number | null>(null);
    const [fuelPriceLoading, setFuelPriceLoading] = useState(false);

    // Fetch initial data
    useEffect(() => {
        const initData = async () => {
            // Fetch dashboard data to get assigned vehicle
            try {
                const dashRes = await fetch('/api/driver/dashboard');
                if (dashRes.ok) {
                    const data = await dashRes.json();
                    if (data.success && data.data?.vehicleInfo) {
                        setVehicleInfo(data.data.vehicleInfo);
                    }
                }
            } catch (error) {
                console.error('Failed to load initial data', error);
            }
        };
        initData();
    }, []);

    // Fetch current fuel price
    useEffect(() => {
        const fetchFuelPrice = async () => {
            setFuelPriceLoading(true);
            try {
                const res = await fetch('/api/driver/fuel-price');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data?.petrol) {
                        setFuelPrice(data.data.petrol);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch fuel price', error);
            } finally {
                setFuelPriceLoading(false);
            }
        };
        fetchFuelPrice();
    }, []);

    // Fetch existing entry data when date changes
    useEffect(() => {
        const fetchExistingEntry = async () => {
            try {
                const res = await fetch(`/api/driver/tripsheet/entry?date=${date}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        // Entry exists, populate the form
                        const entry = data.data;
                        setIsEditingExisting(true);
                        setStatus(entry.status);
                        // Parse starting time (convert from 24h to 12h)
                        const startTime24 = entry.startingTime || '06:00';
                        const [startH, startM] = startTime24.split(':').map(Number);
                        const startHour12 = startH === 0 ? 12 : startH > 12 ? startH - 12 : startH;
                        const startPeriod = startH >= 12 ? 'PM' : 'AM';
                        
                        // Parse closing time (24h format)
                        const closingTime24 = entry.closingTime || '18:00';
                        const [closeH, closeM] = closingTime24.split(':').map(Number);
                        const closingMinute = (closeM === 30 ? '30' : '00') as '00' | '30';
                        
                        // Determine if it's same day (13-24 or 0) or next day (1-12)
                        // 0 = midnight (stored as 00:00), treat as same day 24 for UI
                        let closingHourValue = '';
                        const effectiveCloseH = closeH === 0 ? 24 : closeH;
                        if (effectiveCloseH >= 13 && effectiveCloseH <= 24) {
                            // Same day: 13-24 (1 PM to 12 AM midnight)
                            closingHourValue = effectiveCloseH.toString();
                        } else if (closeH >= 1 && closeH <= 12) {
                            if (closeH < startH) {
                                closingHourValue = `next-${closeH}`;
                            } else {
                                closingHourValue = closeH.toString();
                            }
                        } else {
                            closingHourValue = '18';
                        }
                        
                        setFormData({
                            openingKm: entry.startingKm || 0,
                            closingKm: entry.closingKm || '',
                            startTime: startTime24,
                            startTimeHour: startHour12.toString(),
                            startTimeMinute: String(startM).padStart(2, '0'),
                            startTimePeriod: startPeriod,
                            closingTime: closingTime24,
                            closingTimeHour: closingHourValue,
                            closingTimeMinute: closingMinute,
                            fuelLitres: entry.fuelLitres || '',
                            fuelAmount: entry.fuelAmount || '',
                            remarks: entry.remarks || ''
                        });
                    } else {
                        // No entry exists, reset form
                        setIsEditingExisting(false);
                        setStatus('working');
                        setFormData({
                            openingKm: 0,
                            closingKm: '',
                            startTime: '06:00',
                            startTimeHour: '6',
                            startTimeMinute: '00',
                            startTimePeriod: 'AM',
                            closingTime: '18:00',
                            closingTimeHour: '18',
                            closingTimeMinute: '00',
                            fuelLitres: '',
                            fuelAmount: '',
                            remarks: ''
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch existing entry', error);
            }
        };
        fetchExistingEntry();
    }, [date]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Validation
            if (status === 'working') {
                if (!formData.openingKm || formData.openingKm === 0) throw new Error('Start KM is required');
                if (!formData.closingKm) throw new Error('Closing KM is required');
                if (Number(formData.closingKm) <= formData.openingKm) throw new Error('Closing KM must be greater than Start KM');
            }

            // Convert 12-hour start time to 24-hour format
            let startTime24 = formData.startTime;
            if (formData.startTimeHour && formData.startTimeMinute && formData.startTimePeriod) {
                let hour24 = parseInt(formData.startTimeHour);
                if (formData.startTimePeriod === 'PM' && hour24 !== 12) {
                    hour24 += 12;
                } else if (formData.startTimePeriod === 'AM' && hour24 === 12) {
                    hour24 = 0;
                }
                startTime24 = `${String(hour24).padStart(2, '0')}:${formData.startTimeMinute}`;
            }
            
            // Convert closing time to 24-hour format (HH:mm). Use 00:00 for midnight (not 24:00).
            const closingMin = formData.closingTimeMinute || '00';
            let closingTime24 = '';
            if (formData.closingTimeHour.startsWith('next-')) {
                const nextDayHour = parseInt(formData.closingTimeHour.replace('next-', ''));
                closingTime24 = `${String(nextDayHour).padStart(2, '0')}:${closingMin}`;
            } else {
                const hour = parseInt(formData.closingTimeHour);
                // Midnight (12 AM) must be sent as 00:00 - backend validation only allows 00-23
                if (hour === 24) {
                    closingTime24 = `00:${closingMin}`;
                } else {
                    closingTime24 = `${String(hour).padStart(2, '0')}:${closingMin}`;
                }
            }

            const payload = {
                date: date,
                status: status,
                ...(status === 'working' ? {
                    startingKm: Math.round(formData.openingKm), // Ensure integer
                    closingKm: Math.round(Number(formData.closingKm)), // Ensure integer
                    startingTime: startTime24,
                    closingTime: closingTime24,
                    fuelLitres: formData.fuelLitres ? Number(formData.fuelLitres) : 0,
                    fuelAmount: formData.fuelAmount ? Number(formData.fuelAmount) : 0,
                } : {}),
                remarks: formData.remarks || (status === 'off' ? 'Off Day' : '')
            };

            const res = await fetch('/api/driver/tripsheet/entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to submit entry');

            toast.success(isEditingExisting ? 'Entry updated successfully!' : 'Entry submitted successfully!');
            // Get current month and year from the date to redirect back to tripsheet
            const entryDate = new Date(date);
            const month = entryDate.getMonth() + 1;
            const year = entryDate.getFullYear();
            router.push(`/driver/tripsheet?month=${month}&year=${year}`);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-20 px-4 pt-2 space-y-4">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-gray-900">Daily Entry</h1>
                <p className="text-xs text-gray-500">{session?.user?.name || 'Driver'}</p>
            </div>

            {/* Editing Indicator */}
            {isEditingExisting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 font-medium text-center">
                        Editing existing entry - You can update this entry
                    </p>
                </div>
            )}

            {/* Main Form Card */}
            <Card className="shadow-sm">
                <CardContent className="space-y-5 p-4 sm:p-6">
                    {/* Date Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Date</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min="2026-01-01"
                            className="w-full h-12 text-base"
                        />
                    </div>

                    {/* Status Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Status *</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setStatus('working')}
                                className={cn(
                                    "h-14 text-base font-medium rounded-lg transition-all flex items-center justify-center gap-2 border active:scale-95",
                                    status === 'working'
                                        ? "bg-brand-red text-white border-brand-red shadow-sm"
                                        : "bg-white text-gray-700 border-gray-300 active:bg-gray-50"
                                )}
                            >
                                <Truck className="h-5 w-5" />
                                Worked
                            </button>
                            <button
                                onClick={() => setStatus('off')}
                                className={cn(
                                    "h-14 text-base font-medium rounded-lg transition-all flex items-center justify-center gap-2 border active:scale-95",
                                    status === 'off'
                                        ? "bg-brand-red text-white border-brand-red shadow-sm"
                                        : "bg-white text-gray-700 border-gray-300 active:bg-gray-50"
                                )}
                            >
                                <Check className="h-5 w-5" />
                                Off Day
                            </button>
                        </div>
                    </div>

                    {status === 'working' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                            {/* KM Reading */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-gray-700">Kilometer Reading *</Label>
                                <p className="text-xs text-gray-500">Enter the readings from your vehicle meter</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-600">Opening KM (Morning) *</Label>
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            step="1"
                                            min="0"
                                            value={formData.openingKm || ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const intValue = value === '' ? 0 : Math.round(Number(value)) || 0;
                                                setFormData({ ...formData, openingKm: intValue });
                                            }}
                                            className="h-12 text-lg text-center font-semibold"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-600">Closing KM (Evening) *</Label>
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            step="1"
                                            min="0"
                                            value={formData.closingKm}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const intValue = value === '' ? '' : (Math.round(Number(value)) || '').toString();
                                                setFormData({ ...formData, closingKm: intValue });
                                            }}
                                            className="h-12 text-lg text-center font-semibold"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                {/* Total KM Display */}
                                {formData.openingKm > 0 && formData.closingKm && Number(formData.closingKm) > formData.openingKm && (
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Total KM:</span>
                                            <span className="text-lg font-bold text-green-700">
                                                {Number(formData.closingKm) - formData.openingKm} km
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Working Time */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-gray-700">Working Time</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-600">Start Time *</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Select
                                                value={formData.startTimeHour}
                                                onValueChange={(value) => {
                                                    setFormData({ ...formData, startTimeHour: value });
                                                }}
                                            >
                                                <SelectTrigger className="h-12">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                                                        <SelectItem key={hour} value={hour.toString()}>
                                                            {hour}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={formData.startTimeMinute}
                                                onValueChange={(value) => {
                                                    setFormData({ ...formData, startTimeMinute: value });
                                                }}
                                            >
                                                <SelectTrigger className="h-12">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['00', '15', '30', '45'].map((min) => (
                                                        <SelectItem key={min} value={min}>
                                                            {min}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={formData.startTimePeriod}
                                                onValueChange={(value) => {
                                                    setFormData({ ...formData, startTimePeriod: value });
                                                }}
                                            >
                                                <SelectTrigger className="h-12">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="AM">AM</SelectItem>
                                                    <SelectItem value="PM">PM</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {formData.startTimeHour}:{formData.startTimeMinute} {formData.startTimePeriod}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-600">End Time *</Label>
                                        <div className="grid grid-cols-[1fr_auto] gap-2">
                                            <Select
                                                value={formData.closingTimeHour}
                                                onValueChange={(value) => {
                                                    setFormData({ ...formData, closingTimeHour: value });
                                                }}
                                            >
                                                <SelectTrigger className="h-12 text-base">
                                                    <SelectValue placeholder="Select hour" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Hours 13-23 (1 PM to 11 PM same day) */}
                                                    {Array.from({ length: 11 }, (_, i) => i + 13).map((hour) => {
                                                        const hour12 = hour - 12;
                                                        return (
                                                            <SelectItem key={hour} value={hour.toString()}>
                                                                {hour}:00 ({hour12} PM - Same Day)
                                                            </SelectItem>
                                                        );
                                                    })}
                                                    {/* 24 = 12 AM midnight (stored as 00:00) */}
                                                    <SelectItem value="24">
                                                                24 (12 AM Midnight - Same Day)
                                                            </SelectItem>
                                                    {/* Hours 1-12 (1 AM to 12 PM next day) */}
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => {
                                                        const period = hour < 12 ? 'AM' : 'PM';
                                                        return (
                                                            <SelectItem key={`next-${hour}`} value={`next-${hour}`}>
                                                                {hour}:00 {period} (Next Day)
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={formData.closingTimeMinute}
                                                onValueChange={(value: '00' | '30') => {
                                                    setFormData({ ...formData, closingTimeMinute: value });
                                                }}
                                            >
                                                <SelectTrigger className="h-12 w-[72px] text-base">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="00">:00</SelectItem>
                                                    <SelectItem value="30">:30</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {formData.closingTimeHour && (
                                                <>
                                                    {formData.closingTimeHour.startsWith('next-') ? (
                                                        <>
                                                            Closing at {formData.closingTimeHour.replace('next-', '')}:{formData.closingTimeMinute || '00'}
                                                            ({formData.closingTimeHour.replace('next-', '')} {parseInt(formData.closingTimeHour.replace('next-', '')) < 12 ? 'AM' : 'PM'} - Next Day)
                                                        </>
                                                    ) : formData.closingTimeHour === '24' ? (
                                                        <>Closing at 12:00 AM (Midnight)</>
                                                    ) : (
                                                        <>
                                                            Closing at {formData.closingTimeHour}:{formData.closingTimeMinute || '00'}
                                                            ({parseInt(formData.closingTimeHour) - 12} PM - Same Day)
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {/* Total Hours Calculation Display */}
                                {formData.startTimeHour && formData.startTimeMinute && formData.startTimePeriod && formData.closingTimeHour && (
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">Total Hours:</span>
                                                <span className="text-lg font-bold text-blue-700">
                                                    {(() => {
                                                        // Calculate hours (handling next day)
                                                        let startHour24 = parseInt(formData.startTimeHour);
                                                        if (formData.startTimePeriod === 'PM' && startHour24 !== 12) {
                                                            startHour24 += 12;
                                                        } else if (formData.startTimePeriod === 'AM' && startHour24 === 12) {
                                                            startHour24 = 0;
                                                        }
                                                        const startMinutes = parseInt(formData.startTimeMinute);
                                                        
                                                        // Handle closing time (same day or next day)
                                                        let endHour24 = 0;
                                                        if (formData.closingTimeHour.startsWith('next-')) {
                                                            const nextDayHour = parseInt(formData.closingTimeHour.replace('next-', ''));
                                                            endHour24 = nextDayHour;
                                                        } else {
                                                            const h = parseInt(formData.closingTimeHour);
                                                            endHour24 = h === 24 ? 0 : h; // midnight = 0 for calculation
                                                        }
                                                        const endMinutes = parseInt(formData.closingTimeMinute || '0');
                                                        
                                                        const startTotalMinutes = startHour24 * 60 + startMinutes;
                                                        let endTotalMinutes = endHour24 * 60 + endMinutes;
                                                        
                                                        // Handle overnight: if closing time is earlier than starting, add 24 hours
                                                        if (endTotalMinutes < startTotalMinutes) {
                                                            endTotalMinutes += 24 * 60;
                                                        }
                                                        
                                                        const diffMinutes = endTotalMinutes - startTotalMinutes;
                                                        const totalHours = diffMinutes / 60;
                                                        
                                                        return totalHours > 0 ? totalHours.toFixed(1) : '0.0';
                                                    })()} hrs
                                                </span>
                                            </div>
                                            {(() => {
                                                let startHour24 = parseInt(formData.startTimeHour);
                                                if (formData.startTimePeriod === 'PM' && startHour24 !== 12) {
                                                    startHour24 += 12;
                                                } else if (formData.startTimePeriod === 'AM' && startHour24 === 12) {
                                                    startHour24 = 0;
                                                }
                                                const startMinutes = parseInt(formData.startTimeMinute);
                                                
                                                let endHour24 = 0;
                                                if (formData.closingTimeHour.startsWith('next-')) {
                                                    const nextDayHour = parseInt(formData.closingTimeHour.replace('next-', ''));
                                                    endHour24 = nextDayHour;
                                                } else {
                                                    const h = parseInt(formData.closingTimeHour);
                                                    endHour24 = h === 24 ? 0 : h;
                                                }
                                                const endMinutes = parseInt(formData.closingTimeMinute || '0');
                                                
                                                const startTotalMinutes = startHour24 * 60 + startMinutes;
                                                let endTotalMinutes = endHour24 * 60 + endMinutes;
                                                
                                                // Handle overnight: if closing time is earlier than starting, add 24 hours
                                                if (endTotalMinutes < startTotalMinutes) {
                                                    endTotalMinutes += 24 * 60;
                                                }
                                                
                                                const diffMinutes = endTotalMinutes - startTotalMinutes;
                                                const totalHours = diffMinutes / 60;
                                                const baseHours = 10; // Base hours per day
                                                const extraHours = Math.max(0, totalHours - baseHours);
                                                
                                                return extraHours > 0 ? (
                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-300">
                                                        <span className="text-xs text-gray-600">Extra Hours (above {baseHours}):</span>
                                                        <span className="text-sm font-semibold text-red-600">
                                                            +{extraHours.toFixed(1)} hrs
                                                        </span>
                                                    </div>
                                                ) : null;
                                            })()}
                                            {formData.closingTimeHour.startsWith('next-') && (
                                                <div className="mt-2 pt-2 border-t border-blue-300">
                                                    <p className="text-xs text-amber-700 font-medium">
                                                        ⚠️ Overnight shift detected (closing time is next day)
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Fuel Details */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-gray-700">Fuel Details (Optional)</Label>
                                {fuelPrice && (
                                    <div className="bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                                        <span className="text-xs text-gray-600">Current Petrol Price: </span>
                                        <span className="text-sm font-medium text-gray-900">₹{fuelPrice.toFixed(2)}/L</span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-600">Fuel Amount (₹)</Label>
                                    <Input
                                        type="number"
                                        inputMode="decimal"
                                        step="0.01"
                                        min="0"
                                        value={formData.fuelAmount}
                                        onChange={(e) => {
                                            const amount = e.target.value;
                                            setFormData({ ...formData, fuelAmount: amount });
                                            // Auto-calculate litres if fuel price is available and litres is empty
                                            if (fuelPrice && amount && !formData.fuelLitres) {
                                                const calculatedLitres = (parseFloat(amount) / fuelPrice).toFixed(2);
                                                setFormData(prev => ({ ...prev, fuelAmount: amount, fuelLitres: calculatedLitres }));
                                            }
                                        }}
                                        className="h-12 text-base"
                                        placeholder="0.00"
                                    />
                                    {fuelPrice && formData.fuelAmount && formData.fuelLitres && (
                                        <p className="text-xs text-gray-600">
                                            Calculated: {formData.fuelLitres} L
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Remarks - Only for Off Day */}
                    {status === 'off' && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Reason (Optional)</Label>
                            <Textarea
                                placeholder="Enter reason for off day..."
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                className="min-h-[100px] resize-none text-base"
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full h-14 bg-brand-red hover:bg-red-700 text-white font-semibold text-base active:scale-95 transition-transform"
                    >
                        {loading ? (
                            'Saving...'
                        ) : (
                            <span className="flex items-center gap-2">
                                <Check className="h-5 w-5" />
                                {isEditingExisting ? 'Update Entry' : 'Save Entry'}
                            </span>
                        )}
                    </Button>

                    {/* Help Text */}
                    <p className="text-xs text-gray-500 text-center">
                        Fields marked with * are required
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
