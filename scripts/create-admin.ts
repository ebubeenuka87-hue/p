import "dotenv/config";
import { createInterface } from "node:readline";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { emailSchema } from "../src/lib/validation";

const prisma = new PrismaClient();
const input = createInterface({ input: process.stdin, output: process.stdout });
const ask = (prompt: string) => new Promise<string>((resolve) => input.question(prompt, resolve));

function hidden(prompt: string) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) throw new Error("Run this command in an interactive terminal to enter a password safely.");
  return new Promise<string>((resolve, reject) => {
    process.stdout.write(prompt);
    let value = "";
    const restore = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
    };
    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString()) {
        if (character === "\u0003") { restore(); reject(new Error("Admin creation cancelled.")); return; }
        if (character === "\r" || character === "\n") { process.stdout.write("\n"); restore(); resolve(value); return; }
        if (character === "\u0008" || character === "\u007f") { value = value.slice(0, -1); continue; }
        if (character >= " ") { value += character; process.stdout.write("*"); }
      }
    };
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

async function main() {
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { email: true } });
  if (existingAdmin) throw new Error(`An administrator already exists (${existingAdmin.email}). This command only creates the first administrator.`);
  const name = (await ask("Administrator name: ")).trim();
  const email = emailSchema.parse((await ask("Administrator email: ")).trim());
  const password = await hidden("Password (12+ characters, input hidden): ");
  const confirmation = await hidden("Confirm password: ");
  if (name.length < 2 || name.length > 100) throw new Error("Name must be between 2 and 100 characters.");
  if (password.length < 12 || password.length > 128) throw new Error("Password must be between 12 and 128 characters.");
  if (password !== confirmation) throw new Error("Passwords do not match.");
  await prisma.user.create({ data: { name, email, passwordHash: await hash(password, 12), role: "ADMIN" } });
  console.info(`Created the administrator account for ${email}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Administrator creation failed.");
  process.exitCode = 1;
}).finally(async () => {
  input.close();
  await prisma.$disconnect();
});
