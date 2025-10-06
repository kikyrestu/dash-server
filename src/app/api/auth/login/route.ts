import { NextRequest, NextResponse } from 'next/server';
import { SystemAuth } from '@/lib/system-auth';

const systemAuth = new SystemAuth();

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Username and password are required'
      }, { status: 400 });
    }

    // Authenticate dengan System Auth
    const authResult = await systemAuth.authenticate(username, password);

    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        error: authResult.error || 'Authentication failed'
      }, { status: 401 });
    }

    // Get additional user info
    try {
      const userInfo = await systemAuth.getUserInfo(username);
      const groups = await systemAuth.getUserGroups(username);
      const hasSudo = await systemAuth.hasSudoPrivileges(username);

      authResult.user.userInfo = userInfo;
      authResult.user.groups = groups;
      authResult.user.hasSudo = hasSudo;
      authResult.user.isAdmin = groups.some(g => ['sudo', 'admin', 'wheel', 'root'].includes(g)) || hasSudo;
    } catch (error) {
      console.log('Could not get additional user info:', error.message);
    }

    // Create response with token
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: authResult.user
    });

    // Set HTTP-only cookie dengan token
    response.cookies.set('auth-token', authResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}