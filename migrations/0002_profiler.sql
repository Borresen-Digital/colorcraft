-- Profiler lagret i kontoen (K2). Profilen lagres som fragmentet fra
-- profilsiden (med logo), og vises på den korte lenken /p/<slug>.
create table "savedProfile" ("id" text not null primary key, "userId" text not null references "user" ("id") on delete cascade, "slug" text not null unique, "locale" text not null, "title" text not null, "hash" text not null, "createdAt" integer not null, "updatedAt" integer not null);

create index "savedProfile_userId_idx" on "savedProfile" ("userId");
