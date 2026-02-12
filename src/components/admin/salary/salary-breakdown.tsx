'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';
import { DriverSalary } from '@/services/driver-salary.service';

interface SalaryBreakdownProps {
  salary: DriverSalary;
  showHeader?: boolean;
}

export default function SalaryBreakdown({
  salary,
  showHeader = true,
}: SalaryBreakdownProps) {
  const { calculation } = salary;

  if (!calculation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Salary calculation not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="text-xl">Salary Breakdown</CardTitle>
        </CardHeader>
      )}
      <CardContent className={showHeader ? '' : 'pt-6'}>
        <div className="space-y-6">
          {/* Base Salary Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Base Salary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Working Days: {calculation.totalWorkingDays} days
                </span>
                <span className="font-mono">
                  {formatIndianCurrency(calculation.baseSalary)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                (Base rate: ₹20,000 for {calculation.baseDays} days)
              </p>
            </div>
          </div>

          <Separator />

          {/* Extra Days Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Extra Days Calculation
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Extra Days: {calculation.extraDays} days
                </span>
                <span className="text-gray-600">
                  @ {formatIndianCurrency(calculation.extraDayRate)}/day
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Extra Days Amount:</span>
                <span className="font-mono font-semibold text-[#B22234]">
                  + {formatIndianCurrency(calculation.extraDaysAmount)}
                </span>
              </div>
              {calculation.extraDays > 0 && (
                <p className="text-xs text-gray-500">
                  ({calculation.totalWorkingDays} - {calculation.baseDays}) × ₹
                  {calculation.extraDayRate} = ₹
                  {calculation.extraDaysAmount.toLocaleString('en-IN')}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Extra Hours Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Extra Hours Calculation
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total Hours Worked:</span>
                <span className="font-mono">{calculation.totalHours} hours</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Extra Hours (above 12/day):
                </span>
                <span className="font-mono">
                  {calculation.totalDriverExtraHours} hours
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Rate per extra hour:</span>
                <span className="text-gray-600">
                  {formatIndianCurrency(calculation.extraHourRate)}/hour
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Extra Hours Amount:</span>
                <span className="font-mono font-semibold text-[#B22234]">
                  + {formatIndianCurrency(calculation.extraHoursAmount)}
                </span>
              </div>
              {calculation.totalDriverExtraHours > 0 && (
                <p className="text-xs text-gray-500">
                  {calculation.totalDriverExtraHours} hours × ₹
                  {calculation.extraHourRate} = ₹
                  {calculation.extraHoursAmount.toLocaleString('en-IN')}
                </p>
              )}
            </div>
          </div>

          {/* Advance Deduction Section */}
          {calculation.advanceDeduction && calculation.advanceDeduction > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Advance Deduction
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-red-700">
                      Advance Salary Deduction:
                    </span>
                    <span className="font-mono font-semibold text-red-700">
                      - {formatIndianCurrency(calculation.advanceDeduction)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Advance amount deducted from salary
                  </p>
                </div>
              </div>
            </>
          )}

          <Separator className="my-4" />

          {/* Total Section */}
          <div className="bg-gradient-to-r from-[#6B4C9A]/10 to-[#B22234]/10 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-bold text-gray-900">
                {calculation.advanceDeduction && calculation.advanceDeduction > 0
                  ? 'Final Salary:'
                  : 'Total Salary:'}
              </span>
              <span className="text-2xl font-bold text-[#6B4C9A] font-mono">
                {formatIndianCurrency(calculation.totalSalary)}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-3 leading-relaxed">
              <span className="font-medium">Amount in words:</span>{' '}
              {calculation.amountInWords}
            </p>
          </div>

          {/* Calculation Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-700 mb-3">
              Calculation Formula
            </h4>
            <div className="space-y-1 text-xs text-gray-600 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Base Salary:</span>
                <span>₹{calculation.baseSalary.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">+ Extra Days:</span>
                <span>
                  ₹{calculation.extraDaysAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">+ Extra Hours:</span>
                <span>
                  ₹{calculation.extraHoursAmount.toLocaleString('en-IN')}
                </span>
              </div>
              {calculation.advanceDeduction && calculation.advanceDeduction > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <span className="text-gray-500">- Advance Deduction:</span>
                  <span>
                    ₹{calculation.advanceDeduction.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex items-center gap-2 font-bold text-[#6B4C9A]">
                <span className="text-gray-700">
                  = {calculation.advanceDeduction && calculation.advanceDeduction > 0
                    ? 'Final Salary:'
                    : 'Total:'}
                </span>
                <span>₹{calculation.totalSalary.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
