#!/usr/bin/env -S npx tsx

import { existsSync, readFileSync } from "node:fs";
import { Container } from "@fastr/invert";
import { ConfigModule, DataDir, Env } from "@keybr/config";
import { createSchema, User, UserLoginRequest } from "@keybr/database";
import { Layout } from "@keybr/keyboard";
import { isPlainObject, isString } from "@keybr/lang";
import { Logger } from "@keybr/logger";
import { PublicId } from "@keybr/publicid";
import { Result, TextType } from "@keybr/result";
import { fileChunk, fileHeader } from "@keybr/result-io";
import { Histogram, type Sample } from "@keybr/textinput";
import { File } from "@sosimple/fsx-file";
import Knex from "knex";

const inputFile = process.argv[2] ?? "typing-data.json";
const email = process.argv[3] ?? "user@localhost";

Env.probeFilesSync();
if (process.env.DATABASE_CLIENT == null) {
  process.env.DATABASE_CLIENT = "sqlite";
}
if (process.env.DATABASE_FILENAME == null) {
  process.env.DATABASE_FILENAME = "./var/keybr.db";
}
const container = new Container();
container.load(new ConfigModule());
const knex = container.get(Knex);

type ResultJson = {
  readonly layout: string;
  readonly textType: string;
  readonly timeStamp: number | string;
  readonly length: number;
  readonly time: number;
  readonly errors: number;
  readonly speed: number;
  readonly histogram: readonly {
    readonly codePoint: number;
    readonly hitCount: number;
    readonly missCount: number;
    readonly timeToType: number;
  }[];
};

function parseResultJson(json: unknown): Result | null {
  if (!isPlainObject(json)) {
    return null;
  }
  const obj = json as Record<string, unknown>;
  const {
    layout: layoutId,
    textType: textTypeId,
    timeStamp: ts,
    length: len,
    time,
    errors,
    histogram: h,
  } = obj;
  if (!(isString(layoutId) && isString(textTypeId))) {
    return null;
  }
  let timeStamp: number;
  if (typeof ts === "number") {
    timeStamp = ts;
  } else if (isString(ts)) {
    timeStamp = Date.parse(ts);
    if (isNaN(timeStamp)) {
      return null;
    }
  } else {
    return null;
  }
  if (
    !(
      Number.isSafeInteger(len) &&
      Number.isSafeInteger(time) &&
      Number.isSafeInteger(errors)
    )
  ) {
    return null;
  }
  const layout = Layout.ALL.get(layoutId);
  const textType = TextType.ALL.get(textTypeId);
  if (layout == null || textType == null) {
    return null;
  }
  if (!Array.isArray(h)) {
    return null;
  }
  const samples: Sample[] = [];
  for (const s of h) {
    if (!isPlainObject(s)) {
      return null;
    }
    const sample = s as Record<string, unknown>;
    const { codePoint, hitCount, missCount, timeToType } = sample;
    if (
      !(
        Number.isSafeInteger(codePoint) &&
        Number.isSafeInteger(hitCount) &&
        Number.isSafeInteger(missCount) &&
        typeof timeToType === "number"
      )
    ) {
      return null;
    }
    samples.push({
      codePoint: codePoint as number,
      hitCount: hitCount as number,
      missCount: missCount as number,
      timeToType: Math.round(timeToType as number),
    });
  }
  try {
    return new Result(
      layout,
      textType,
      timeStamp,
      len as number,
      time as number,
      errors as number,
      new Histogram(samples),
    );
  } catch {
    return null;
  }
}

function parseTypingData(content: string): Result[] {
  const raw: unknown[] = JSON.parse(content);
  if (!Array.isArray(raw)) {
    throw new Error("Expected a JSON array");
  }
  const results: Result[] = [];
  for (const entry of raw) {
    const result = parseResultJson(entry);
    if (result != null && result.validate()) {
      results.push(result);
    }
  }
  return results;
}

async function exec() {
  if (!existsSync(inputFile)) {
    Logger.error(`File not found: ${inputFile}`);
    Logger.error(
      `Usage: npx tsx packages/devenv/lib/import-data.ts [input.json] [email]`,
    );
    process.exit(1);
  }

  const content = readFileSync(inputFile, "utf-8");
  const results = parseTypingData(content);
  if (results.length === 0) {
    Logger.error(`No valid results found in ${inputFile}`);
    process.exit(1);
  }
  Logger.info(`Parsed ${results.length} valid results from ${inputFile}`);

  await createSchema(knex);
  Logger.info(`Database schema ready`);

  const user = await User.login(email);
  Logger.info(`User [${email}] ready (id=${user.id})`);

  const accessToken = await UserLoginRequest.init(email);
  const dataDir = container.get(DataDir);
  const publicId = new PublicId(user.id!);
  const file = new File(dataDir.userStatsFile(publicId.id));

  await file.append(fileHeader(), { flag: "ax" });
  for (let i = 0; i < results.length; i += 100) {
    const chunk = results.slice(i, i + 100);
    await file.append(fileChunk(chunk), { flag: "a" });
  }
  Logger.info(`Wrote ${results.length} results to ${file.name}`);

  const loginLink = new URL(
    `/login/${accessToken}`,
    container.get("canonicalUrl"),
  );
  Logger.info(`Login link: ${loginLink}`);
}

exec().catch((err) => {
  console.error(err);
  process.exit(1);
});
