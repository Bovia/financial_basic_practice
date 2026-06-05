import { prisma } from "@/lib/prisma";

const USERNAME_MIN = 2;
const USERNAME_MAX = 20;
const USERNAME_PATTERN = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;

export function normalizeUsername(input: string): string {
  return input.trim();
}

export function validateUsername(input: string): string | null {
  const username = normalizeUsername(input);

  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `用户名长度为 ${USERNAME_MIN}-${USERNAME_MAX} 个字符`;
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "用户名仅支持中文、字母、数字和下划线";
  }

  return null;
}

export async function getOrCreateUser(usernameInput: string) {
  const username = normalizeUsername(usernameInput);
  const error = validateUsername(username);
  if (error) {
    throw new Error(error);
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return existing;

  return prisma.user.create({ data: { username } });
}
