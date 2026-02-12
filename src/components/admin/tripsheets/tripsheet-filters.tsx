"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Car, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ITripsheetFilters } from '@/backend/types';
import { useQuery } from '@tanstack/react-query';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const YEARS = [
  new Date().getFullYear(),
  new Date().getFullYear() - 1,
  new Date().getFullYear() - 2,
];

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
];

interface TripsheetFiltersProps {
  filters: ITripsheetFilters;
  onFiltersChange: (filters: ITripsheetFilters) => void;
}

export function TripsheetFilters({ filters, onFiltersChange }: TripsheetFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const vehicleDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch vehicles for filter
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/vehicles');
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      const data = await res.json();
      return data.data;
    },
  });

  // Filter vehicles based on search
  const filteredVehicles = vehicles?.filter((vehicle: any) =>
    vehicle.vehicleNumber.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vehicleDropdownRef.current && !vehicleDropdownRef.current.contains(event.target as Node)) {
        setShowVehicleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFiltersChange({ ...filters, search: searchTerm, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleMonthChange = (value: string) => {
    onFiltersChange({ ...filters, month: parseInt(value), page: 1 });
  };

  const handleYearChange = (value: string) => {
    onFiltersChange({ ...filters, year: parseInt(value), page: 1 });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value as any, page: 1 });
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setVehicleSearch(vehicle.vehicleNumber);
    setShowVehicleDropdown(false);
    onFiltersChange({
      ...filters,
      vehicleId: vehicle._id,
      page: 1
    });
  };

  const handleVehicleClear = () => {
    setSelectedVehicle(null);
    setVehicleSearch('');
    onFiltersChange({
      ...filters,
      vehicleId: undefined,
      page: 1
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Month</label>
          <Select
            value={filters.month?.toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Year</label>
          <Select
            value={filters.year?.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative" ref={vehicleDropdownRef}>
          <label className="text-sm font-medium mb-2 block">Vehicle</label>
          <div className="relative">
            <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Type vehicle number..."
              value={vehicleSearch}
              onChange={(e) => {
                setVehicleSearch(e.target.value);
                setShowVehicleDropdown(true);
              }}
              onFocus={() => setShowVehicleDropdown(true)}
              className="pl-10 pr-8"
            />
            {selectedVehicle && (
              <button
                onClick={handleVehicleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showVehicleDropdown && filteredVehicles && filteredVehicles.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredVehicles.map((vehicle: any) => (
                <div
                  key={vehicle._id}
                  onClick={() => handleVehicleSelect(vehicle)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                >
                  <Car className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{vehicle.vehicleNumber}</span>
                  {vehicle.vehicleTypeId?.name && (
                    <span className="text-sm text-gray-500">
                      ({vehicle.vehicleTypeId.name})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Search Driver</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search driver name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
