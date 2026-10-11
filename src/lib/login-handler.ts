import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import { clearLoginFailures, loginIsLocked, recordFailedLogin } from "@/lib/loginThrottle";
import { configuredSessionSecret } from "@/lib/session-secret";
import type { UserRole } from "@prisma/client";

export async function handleLogin(request: Request, expectedRole: UserRole) {
  try {
    await requireSameOrigin(request);
    const input = loginSchema.parse(await request.json());
    if (!configuredSessionSecret()) {
      return NextResponse.json({ error: "Account sign-in is not configured yet. Please contact the store." }, { status: 503 });
    }
    if (await loginIsLocked(input.email)) {
      return NextResponse.json({ error: "Too many sign-in attempts. Please wait 15 minutes before trying again." }, { status: 429 });
    }
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || user.role !== expectedRole || !(await compare(input.password, user.passwordHash))) {
      if (await recordFailedLogin(input.email)) {
        return NextResponse.json({ error: "Too many sign-in attempts. Please wait 15 minutes before trying again." }, { status: 429 });
      }
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }
    if (user.role === "CUSTOMER" && !user.emailVerifiedAt) {
      return NextResponse.json({
        error: "Please verify your email before signing in.",
        requiresVerification: true,
        email: user.email,
      }, { status: 403 });
    }
    await clearLoginFailures(input.email);
    await createSession({ id: user.id, role: user.role, sessionVersion: user.sessionVersion });
    return NextResponse.json({ ok: true, role: user.role });
  } catch (error) {
    return errorResponse(error);
  }
}
