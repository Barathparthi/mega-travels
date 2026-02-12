import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import VehicleLoan from '@/backend/models/vehicle-loan.model';
import Vehicle from '@/backend/models/vehicle.model';

/**
 * POST /api/admin/loans/seed
 * Seed loan data from the provided table
 * This will create loan records for all the entries shown in the image
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Loan data from the provided table
    const loanData = [
      // Section 1 (S.No 1-5)
      { vehicleNumber: 'TN 11 1791', financeName: 'IDFC Finance', accountName: 'Surali Muthukumar', emiDate: 3, emiAmount: 25765, loanStartDate: '2024-12-03' },
      { vehicleNumber: 'TN 11 1791', financeName: 'IDFC Finance', accountName: 'Ranjitha K', emiDate: 3, emiAmount: 25765, loanStartDate: '2024-12-03' },
      { vehicleNumber: 'TN 11 1791', financeName: 'IDFC Finance', accountName: 'Siva International', emiDate: 3, emiAmount: 25765, loanStartDate: '2024-12-03' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Fortune Finance', accountName: 'Mayaa Enterprises', emiDate: 3, emiAmount: 5537, loanStartDate: '2024-12-03' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Tata Capital Finance', accountName: 'Karpagam E', emiDate: 3, emiAmount: 5537, loanStartDate: '2024-12-03' },
      
      // Section 2 (S.No 4-9) - Note: These seem to be different vehicles
      { vehicleNumber: 'TN 11 1791', financeName: 'TVS Finance', accountName: 'Mayaa Enterprises', emiDate: 5, emiAmount: 59065, loanStartDate: '2024-11-05' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Piramel Finance', accountName: 'Mayaa Enterprises', emiDate: 5, emiAmount: 17888, loanStartDate: '2024-11-05' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Veritas Finance', accountName: 'Mayaa Enterprises', emiDate: 5, emiAmount: 24152, loanStartDate: '2024-11-05' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Chola Finance', accountName: 'Bharani K', emiDate: 5, emiAmount: 24152, loanStartDate: '2024-11-05' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Chola Finance', accountName: 'Sarathkumar K', emiDate: 5, emiAmount: 24152, loanStartDate: '2024-11-05' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Hinduja', accountName: 'Kannan S', emiDate: 5, emiAmount: 32198, loanStartDate: '2024-11-05' },
      
      // Section 3 (S.No 10)
      { vehicleNumber: 'TN 11 1791', financeName: 'Fortune Finance', accountName: 'Sarathkumar K', emiDate: 7, emiAmount: 15220, loanStartDate: '2024-12-07' },
      
      // Section 4 (S.No 11-15)
      { vehicleNumber: 'TN 11 1791', financeName: 'Sundram Finance', accountName: 'Ms.Ranjitha K', emiDate: 10, emiAmount: 30170, loanStartDate: '2024-11-10' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Sundram Finance', accountName: 'Siva International', emiDate: 10, emiAmount: 30170, loanStartDate: '2024-11-10' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Mahindra Finance', accountName: 'Siva International', emiDate: 10, emiAmount: 18740, loanStartDate: '2024-11-10' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Piramel Finance', accountName: 'Sarathkumar K', emiDate: 10, emiAmount: 18740, loanStartDate: '2024-11-10' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Indostar Finance', accountName: 'Mayaa Enterprises', emiDate: 10, emiAmount: 16029, loanStartDate: '2024-11-10' },
      
      // Section 5 (S.No 16-17)
      { vehicleNumber: 'TN 11 1791', financeName: 'IndusInd', accountName: 'Mayaa Enterprises', emiDate: 15, emiAmount: 17822, loanStartDate: '2024-11-15' },
      { vehicleNumber: 'TN 11 1791', financeName: 'IndusInd', accountName: 'Mayaa Enterprises', emiDate: 15, emiAmount: 18333, loanStartDate: '2024-11-15' },
      
      // Section 6 (S.No 18)
      { vehicleNumber: 'TN 11 1791', financeName: 'Sri Nithi Finance', accountName: 'Mayaa Enterprises', emiDate: 17, emiAmount: 36190, loanStartDate: '2024-12-17' },
      
      // Section 7 (S.No 19-24)
      { vehicleNumber: 'TN 11 1791', financeName: 'Dugar Finance', accountName: 'Mayaa Enterprises', emiDate: 20, emiAmount: 26750, loanStartDate: '2024-11-20' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Dugar Finance', accountName: 'Mayaa Enterprises', emiDate: 20, emiAmount: 26750, loanStartDate: '2024-11-20' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Chettu Finance', accountName: 'Mayaa Enterprises', emiDate: 20, emiAmount: 43850, loanStartDate: '2024-11-20' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Chettu Finance', accountName: 'Mayaa Enterprises', emiDate: 20, emiAmount: 43850, loanStartDate: '2024-11-20' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Toyota Finance', accountName: 'Mayaa Enterprises', emiDate: 20, emiAmount: 27000, loanStartDate: '2024-11-20' },
      { vehicleNumber: 'TN 11 1791', financeName: 'Toyota Finance', accountName: 'Mayaa Enterprises', emiDate: 20, emiAmount: 27000, loanStartDate: '2024-11-20' },
    ];

    const createdLoans = [];
    const errors = [];

    for (const loanInfo of loanData) {
      try {
        // Find or create vehicle (you may need to adjust this based on your vehicle data)
        let vehicle = await Vehicle.findOne({ vehicleNumber: loanInfo.vehicleNumber.toUpperCase() });
        
        if (!vehicle) {
          // Create a placeholder vehicle if it doesn't exist
          // You should update this to match your actual vehicle creation logic
          errors.push(`Vehicle ${loanInfo.vehicleNumber} not found. Please create it first.`);
          continue;
        }

        // Check if loan already exists
        const existingLoan = await VehicleLoan.findOne({
          vehicleId: vehicle._id,
          financeName: loanInfo.financeName,
          accountName: loanInfo.accountName,
          emiDate: loanInfo.emiDate,
        });

        if (existingLoan) {
          errors.push(`Loan already exists for ${loanInfo.vehicleNumber} - ${loanInfo.financeName} - ${loanInfo.accountName}`);
          continue;
        }

        // Create first EMI payment
        const firstEmiDate = new Date(loanInfo.loanStartDate);
        firstEmiDate.setDate(loanInfo.emiDate);
        if (firstEmiDate < new Date(loanInfo.loanStartDate)) {
          firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);
        }

        // Create next EMI date (e.g., if start is 03-Mar-25, next is 03-Apr-25)
        const nextEmiDate = new Date(firstEmiDate);
        nextEmiDate.setMonth(nextEmiDate.getMonth() + 1);

        const loan = new VehicleLoan({
          vehicleId: vehicle._id,
          vehicleNumber: loanInfo.vehicleNumber.toUpperCase(),
          financeName: loanInfo.financeName,
          accountName: loanInfo.accountName,
          loanStartDate: new Date(loanInfo.loanStartDate),
          emiAmount: loanInfo.emiAmount,
          emiDate: loanInfo.emiDate,
          payments: [
            {
              emiDate: firstEmiDate,
              amount: loanInfo.emiAmount,
              status: 'pending',
            },
            {
              emiDate: nextEmiDate,
              amount: loanInfo.emiAmount,
              status: 'pending',
            },
          ],
        });

        await loan.save();
        createdLoans.push({
          vehicleNumber: loanInfo.vehicleNumber,
          financeName: loanInfo.financeName,
          accountName: loanInfo.accountName,
        });
      } catch (error: any) {
        errors.push(`Error creating loan for ${loanInfo.vehicleNumber} - ${loanInfo.financeName}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${createdLoans.length} loan records`,
      created: createdLoans.length,
      errors: errors.length,
      errorDetails: errors,
    });
  } catch (error: any) {
    console.error('Seed loans error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to seed loan data',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

