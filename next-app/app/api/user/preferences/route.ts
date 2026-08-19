import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { UpdatePreferencesSchema } from '@/lib/validations';
import { z } from 'zod';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = UpdatePreferencesSchema.parse(body);

    await dbConnect();

    // The session.user in NextAuth usually has the user's email or id
    // We can find by email which is unique
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { emailRemindersEnabled: validatedData.emailRemindersEnabled } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, emailRemindersEnabled: user.emailRemindersEnabled },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.flatten() }, { status: 400 });
    }
    console.error('[USER_PREFERENCES_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
