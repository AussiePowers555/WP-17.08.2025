import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import fs from 'fs';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    console.log(`🗑️ Starting to delete case: ${id}`);

    // Get case details first - try by ID, then by case number if that fails
    let caseData = await DatabaseService.getCaseById(id);
    
    // If not found by ID, try by case number (fallback for when ID is missing)
    if (!caseData) {
      console.log(`⚠️ Case not found by ID, trying by case number: ${id}`);
      caseData = await DatabaseService.getCaseByCaseNumber(id);
    }
    
    if (!caseData) {
      console.error(`❌ Case not found with ID or case number: ${id}`);
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Found case to delete:`, {
      id: caseData.id,
      caseNumber: caseData.caseNumber
    });

    // Clean up associated files
    try {
      // Delete uploaded documents directory
      const documentsDir = path.join(process.cwd(), 'public/uploads/documents', caseData.id);
      if (fs.existsSync(documentsDir)) {
        fs.rmSync(documentsDir, { recursive: true, force: true });
        console.log(`🗑️ Deleted documents directory for case ${caseData.id}`);
      }

      // Delete any signature tokens for this case
      await DatabaseService.deleteSignatureTokensByCase(caseData.id);
      console.log(`🗑️ Deleted signature tokens for case ${caseData.id}`);
      
      // Delete any digital signatures for this case
      await DatabaseService.deleteDigitalSignaturesByCase(caseData.id);
      console.log(`🗑️ Deleted digital signatures for case ${caseData.id}`);

    } catch (cleanupError) {
      console.error(`⚠️ Error during cleanup for case ${id}:`, cleanupError);
      // Continue with case deletion even if cleanup fails
    }

    // Delete the case from database using the actual case ID
    const deleted = await DatabaseService.deleteCase(caseData.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete case from database' },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully deleted case ${id} and cleaned up associated files`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted case ${caseData.caseNumber} and cleaned up associated files`,
      deletedCase: {
        id: caseData.id,
        caseNumber: caseData.caseNumber,
        clientName: caseData.clientName
      }
    });

  } catch (error) {
    console.error(`❌ Error deleting case ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete case', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
