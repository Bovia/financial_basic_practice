import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser, validateUsername } from "@/lib/user";
import { parseUserSettings } from "@/lib/user-settings";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { username?: string };
    const { username: usernameInput } = body;

    if (!usernameInput || typeof usernameInput !== "string") {
      return NextResponse.json({ error: "用户名不能为空" }, { status: 400 });
    }

    const validationError = validateUsername(usernameInput);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const user = await getOrCreateUser(usernameInput);
    return NextResponse.json({
      id: user.id,
      username: user.username,
      settings: parseUserSettings(user.settings),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建用户失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
