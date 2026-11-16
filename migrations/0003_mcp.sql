-- MCP-tokens per konto (K3). Bare SHA-256-hashen av tokenet lagres; selve
-- tokenet vises én gang. mcpCall teller kall per token for fartsgrensen og
-- lagrer verken argumenter eller svar.
create table "mcpToken" ("id" text not null primary key, "userId" text not null references "user" ("id") on delete cascade, "name" text not null, "label" text not null, "hash" text not null unique, "createdAt" integer not null, "lastUsedAt" integer);

create index "mcpToken_userId_idx" on "mcpToken" ("userId");

create table "mcpCall" ("id" integer primary key autoincrement, "tokenId" text not null references "mcpToken" ("id") on delete cascade, "tool" text not null, "ok" integer not null, "createdAt" integer not null);

create index "mcpCall_token_time_idx" on "mcpCall" ("tokenId", "createdAt");
