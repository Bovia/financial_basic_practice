import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser, validateUsername } from "@/lib/user";
import { mergeUserSettings, parseUserSettings } from "@/lib/user-settings";
import type { UserSettings } from "@/types/user";

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "username is required" }, { status: 400 });
    }

    const validationError = validateUsername(username);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const user = await getOrCreateUser(username);

    return NextResponse.json({
      settings: parseUserSettings(user.settings),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      settings?: Partial<UserSettings>;
    };

    const { username: usernameInput, settings: settingsPatch } = body;

    if (!usernameInput || typeof usernameInput !== "string") {
      return NextResponse.json({ error: "username is required" }, { status: 400 });
    }

    const validationError = validateUsername(usernameInput);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!settingsPatch || typeof settingsPatch !== "object") {
      return NextResponse.json({ error: "settings is required" }, { status: 400 });
    }

    const user = await getOrCreateUser(usernameInput);
    const current = parseUserSettings(user.settings);
    const next = mergeUserSettings(current, settingsPatch);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { settings: next },
    });

    return NextResponse.json({
      settings: parseUserSettings(updated.settings),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
