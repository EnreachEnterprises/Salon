# Runbook

What to run, what breaks, and what to do about it.

## Local setup

```bash
npm install                      # always from the repo root, never from apps/mobile
cp packages/db/.env.example packages/db/.env
# fill DATABASE_URL and DATABASE_URL_UNPOOLED

npm run db:migrate               # applies migrations to the unpooled URL
npm run db:seed                  # deterministic demo salon; refuses if one exists

npm run mobile                   # Expo dev server
npm run android                  # Android
npm run ios                      # iOS (macOS only)
```

Tests and checks:

```bash
npm run typecheck                # every workspace
npm test                         # vitest in packages/shared
npm run db:generate              # after any schema change
```

## Android toolchain (Windows, this machine)

The SDK lives outside the repo on purpose. Gradle finds it through
`apps/mobile/android/local.properties`, which is gitignored, so no machine path
ever reaches GitHub.

| Piece | Location |
| --- | --- |
| Android SDK | `D:\Android\Sdk` |
| cmdline-tools | `D:\Android\Sdk\cmdline-tools\latest` (22.0) |
| Android Studio | `D:\Android\AndroidStudio` (official ZIP distribution, no installer) |
| Bundled JDK 21 | `D:\Android\AndroidStudio\jbr` — fallback if Gradle ever refuses Java 25 |
| JDK actually used | Temurin 25, unpacked flat into `D:\`, so `JAVA_HOME=D:\` |

User-scope environment variables: `ANDROID_HOME` and `ANDROID_SDK_ROOT` point at
`D:\Android\Sdk`, `JAVA_HOME=D:\`, and `PATH` gains `platform-tools` and
`cmdline-tools\latest\bin`. Open a new terminal after changing them.

Package versions are not arbitrary — they come from
`node_modules/react-native/gradle/libs.versions.toml`:

```powershell
sdkmanager "platform-tools" "platforms;android-37.0" "build-tools;37.0.0" `
           "ndk;27.1.12297006" "cmake;3.22.1"
```

Two APKs, two purposes:

```powershell
cd apps/mobile/android

# debug: fast, needs Metro running (adb reverse tcp:8081 tcp:8081)
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a
# -> app\build\outputs\apk\debug\app-debug.apk

# release: standalone, JS bundle embedded, signed with the debug keystore
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
# -> app\build\outputs\apk\release\app-release.apk
```

Use the release APK to demo on a phone. It is signed with `debug.keystore`, so it
is for testers only — Play Store uploads come from EAS, never from this file.
`-PreactNativeArchitectures=arm64-v8a` builds one ABI; drop it for a universal
APK. The first build compiles reanimated, worklets, gesture-handler and
expo-modules-core through CMake and takes a long while; later builds reuse
`android\.gradle` and are minutes.

Install on a phone (Developer Options → USB debugging, then accept the RSA
prompt):

```powershell
adb devices                 # must list a device, not "unauthorized"
adb install -r app-release.apk
```

### Long paths: replace ninja, not the repo

If the build dies with

```
ninja: error: Stat(...): Filename longer than 260 characters
```

the culprit is ninja, not Windows. CMake 3.22.1 bundles ninja 1.10.2, which
rejects any path of 260 characters or more before it ever calls a Win32 API, so
the `LongPathsEnabled` registry value (already `1` on this machine) cannot help.

The path is long because CMake mangles the absolute source path into the object
filename:

```
...\.cxx\Debug\<hash>\arm64-v8a\rngesturehandler_codegen_autolinked_build\
  CMakeFiles\react_codegen_rngesturehandler_codegen.dir\
  E_\Work\Projects\Salon\node_modules\react-native-gesture-handler\
  shared\shadowNodes\...\RNGestureHandlerDetectorShadowNode.cpp.o
```

About 345 characters. Moving the repo, `subst`, or a junction recovers only ~40
of them, so the geometry never fits. Replace ninja instead:

```powershell
# download ninja-win.zip (1.12.1 or newer) from
# https://github.com/ninja-build/ninja/releases
$bin = 'D:\Android\Sdk\cmake\3.22.1\bin'
Copy-Item "$bin\ninja.exe" "$bin\ninja-1.10.2.exe.bak" -ErrorAction SilentlyContinue
Copy-Item .\ninja.exe "$bin\ninja.exe" -Force
& "$bin\ninja.exe" --version      # 1.12.1
```

Ninja 1.12 prefixes `\\?\` internally, so the length stops mattering. Verify
before spending an hour on a rebuild — a dry run hits the same `Stat()` calls:

```powershell
& "$bin\ninja.exe" -C apps\mobile\android\app\.cxx\Debug\<hash>\arm64-v8a -n appmodules
```

Exit code 0 with no `Stat(` error means the wall is gone. No need to delete
`.cxx`; just rerun `assembleDebug`.

## Known local snags

| Symptom | Cause / fix |
| --- | --- |
| `npm error Cannot read properties of null (reading 'location')` | you ran `npm install` inside `apps/mobile`. Delete its `node_modules`, install from the root. |
| `Missing script: "db:generate"` | run it from the repo root, or `npm run generate -w @salon/db`. |
| `npm install-scripts approve` prompt | npm 11 blocks install scripts; approve `esbuild`, then reinstall. |
| `tsc` failure followed by a `NativeCommandError` block | the PowerShell noise is after the real error. Read the `tsc` lines above it. |
| `TS5101` on `baseUrl` | `baseUrl` is intentionally removed; `paths` are relative to the tsconfig. |
| `db:seed` exits with "salon already exists" | by design. Drop the database or use a fresh branch. |
| `Failed to find package platforms;android-37` | Android now ships minor platform versions. Install `platforms;android-37.0`. |
| `sdkmanager` exits 1 right after "All SDK package licenses accepted" | a broken pipe on Windows; the packages did install. Verify with `sdkmanager --list_installed`. |
| `SDK location not found` from Gradle | `apps/mobile/android/local.properties` is missing. Create it with `sdk.dir=D\:\\Android\\Sdk`; it is gitignored on purpose. |
| `adb devices` lists nothing, or shows `unauthorized` | charge-only cable, USB debugging off, or the RSA prompt was dismissed. Revoke USB authorizations and replug. |
| Android Studio installed into `C:\Program Files` | its NSIS installer ignores `/D=` when it runs elevated. Use the ZIP distribution instead of the `.exe`. |
| `ninja: error: Stat(...): Filename longer than 260 characters` | CMake 3.22.1 ships ninja 1.10.2, which hard-rejects long paths even with `LongPathsEnabled=1`. Replace `D:\Android\Sdk\cmake\3.22.1\bin\ninja.exe` with 1.12.1+, then rerun the build. See "Long paths: replace ninja, not the repo". |
| First Gradle run looks hung for ten minutes | it is building native code with CMake. Watch `gradlew.bat --console=plain` output, not the clock. |

## Migrations

1. Change the schema in `packages/db/src/schema/`.
2. `npm run db:generate` — review the SQL it wrote.
3. Run it against a Neon **branch** first, never straight to production.
4. `npm run db:migrate`.
5. Never edit an applied migration.

Rollback is a Neon instant restore to a timestamp, or a forward-only fix. Choose
one before running anything destructive, not after.

## Neon

- Compute autosuspends when idle; the first request after a pause is slow.
  Health checks should tolerate one cold second.
- Pooled URL for the API, unpooled for migrations. Using the pooled URL for DDL
  will eventually fail in a confusing way.
- A branch is a full copy of data and schema; use it for every risky migration
  and for load tests.

## Deploy

- API: Vercel, `main` is production, pull requests get previews with their own
  environment. Secrets live in Vercel, not in the repo.
- Mobile: EAS build. Internal APK for testers, TestFlight for iOS. A store
  release needs its own build, not an internal one promoted.

  ```
  cd apps/mobile
  npx eas build -p android --profile preview    # installable APK
  npx eas build -p ios --profile preview        # TestFlight, needs Apple account
  npx eas build -p android --profile production # store build
  ```

  `preview` produces an APK and skips the store. iOS has no committed `ios/`
  folder; EAS generates it on a macOS runner from `app.json`.
- Crons (Vercel): reminder sweep, weekly summary, monthly report, payload purge.
  A cron that fails silently is worse than no cron — every run writes a row.

## Incidents

**Payments failing.** Check Razorpay status first, then the webhook secret, then
the `payments` table for stuck `pending` rows. Never mark paid by hand from a
client callback; reconcile from the verified webhook or the dashboard.

**WhatsApp sends failing.** Check template status in Meta Business Manager, then
the access token, then the rate limit. Failed sends fall back to email and are
visible in `notifications`. Do not resend marketing in a loop.

**Queue not updating.** It polls every 5 seconds while focused. Check network,
then `/v1/queue`, then the database. There is no socket to reconnect.

**Wrong number on a report.** Do not patch the screen. Check
`packages/shared/src/metrics.ts` and the `report_summary` query — the two must
agree, and every screen must use them. A number that disagrees is a bug in one
of those two places, not three.

**Data leak suspicion.** Rotate the affected secret first. Then read
`audit_log`, then the API logs by `requestId`. RLS is a backstop; check whether
the setting was actually applied in the transaction before assuming it held.

## What to check before calling something done

- `npm run typecheck` and `npm test` pass.
- New UI works at 375px wide, in dark mode, with 200% text.
- Loading, empty, error and data states all exist.
- Money is integer paise, and a discount still sums to the whole.
- Docs updated if a table, route, component or decision changed.
