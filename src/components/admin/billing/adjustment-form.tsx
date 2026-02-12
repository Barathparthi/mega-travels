'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MinusCircle, PlusCircle, Trash2 } from 'lucide-react';
import { BillingService } from '@/services/billing.service';

export interface Adjustment {
  type: 'add' | 'deduct';
  amount: number;
  reason: string;
}

interface AdjustmentFormProps {
  adjustments: Adjustment[];
  onChange: (adjustments: Adjustment[]) => void;
}

export function AdjustmentForm({ adjustments, onChange }: AdjustmentFormProps) {
  const addAdjustment = () => {
    onChange([
      ...adjustments,
      {
        type: 'add',
        amount: 0,
        reason: '',
      },
    ]);
  };

  const removeAdjustment = (index: number) => {
    onChange(adjustments.filter((_, i) => i !== index));
  };

  const updateAdjustment = (index: number, field: keyof Adjustment, value: any) => {
    const updated = [...adjustments];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const totalAdjustment = adjustments.reduce((total, adj) => {
    return total + (adj.type === 'add' ? adj.amount : -adj.amount);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Adjustments</Label>
        <Button type="button" variant="outline" size="sm" onClick={addAdjustment}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Adjustment
        </Button>
      </div>

      {adjustments.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground text-sm">
              No adjustments added. Click "Add Adjustment" to add one.
            </p>
          </CardContent>
        </Card>
      )}

      {adjustments.map((adjustment, index) => (
        <Card key={index}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-4">
              {/* Type */}
              <div className="w-32">
                <Label>Type</Label>
                <Select
                  value={adjustment.type}
                  onValueChange={(value) =>
                    updateAdjustment(index, 'type', value as 'add' | 'deduct')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">
                      <div className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4 text-green-600" />
                        <span>Add</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="deduct">
                      <div className="flex items-center gap-2">
                        <MinusCircle className="h-4 w-4 text-red-600" />
                        <span>Deduct</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="flex-1">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustment.amount || ''}
                  onChange={(e) =>
                    updateAdjustment(index, 'amount', parseFloat(e.target.value) || 0)
                  }
                  placeholder="Enter amount"
                />
              </div>

              {/* Delete Button */}
              <div className="pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAdjustment(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Reason */}
            <div>
              <Label>Reason</Label>
              <Textarea
                value={adjustment.reason}
                onChange={(e) => updateAdjustment(index, 'reason', e.target.value)}
                placeholder="Enter reason for adjustment"
                rows={2}
              />
            </div>

            {/* Preview */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Adjustment Preview</span>
              <span
                className={`font-semibold ${
                  adjustment.type === 'add' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {adjustment.type === 'add' ? '+' : '-'}
                {BillingService.formatCurrency(adjustment.amount)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Total Adjustments Summary */}
      {adjustments.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Adjustments</span>
              <span
                className={`text-lg font-bold ${
                  totalAdjustment >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {totalAdjustment >= 0 ? '+' : ''}
                {BillingService.formatCurrency(totalAdjustment)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
