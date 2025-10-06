import { NextRequest, NextResponse } from 'next/server';
import { SystemAuth } from '@/lib/system-auth';

const systemAuth = new SystemAuth();

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No token provided',
        authenticated: false
      }, { status: 401 });
    }

    const verification = systemAuth.verifyToken(token);

    if (!verification.valid) {
      return NextResponse.json({
        success: false,
        error: verification.error,
        authenticated: false
      }, { status: 401 });
    }

    // Get fresh user info
    try {
      const userInfo = await systemAuth.getUserInfo(verification.user.username);
      const groups = await systemAuth.getUserGroups(verification.user.username);
      const hasSudo = await systemAuth.hasSudoPrivileges(verification.user.username);

      verification.user.userInfo = userInfo;
      verification.user.groups = groups;
      verification.user.hasSudo = hasSudo;
      verification.user.isAdmin = groups.some(g => ['sudo', 'admin', 'wheel', 'root'].includes(g)) || hasSudo;
    } catch (error) {
      console.log('Could not get fresh user info:', error.message);
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: verification.user
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      authenticated: false
    }, { status: 500 });
  }
}