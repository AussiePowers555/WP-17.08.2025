import { NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import CryptoJS from 'crypto-js';

export async function GET() {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized();
    
    // Check if admin@example.com exists
    const existingAdmin = await DatabaseService.getUserByEmail('admin@example.com');
    
    if (!existingAdmin) {
      // Create admin user
      const passwordHash = CryptoJS.SHA256('admin123' + 'salt_pbr_2024').toString();
      
      const adminUser = await DatabaseService.createUserAccount({
        email: 'admin@example.com',
        password_hash: passwordHash,
        role: 'developer',
        status: 'active',
        display_name: 'Admin User',
        first_login: false,
        remember_login: false
      });
      
      return NextResponse.json({
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Admin user already exists',
      user: {
        id: existingAdmin.id,
        email: existingAdmin.email,
        role: existingAdmin.role
      }
    });
  } catch (error) {
    console.error('Error initializing admin user:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}