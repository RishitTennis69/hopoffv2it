# EAS — commands only

Check who's logged in:
```powershell
npx eas-cli whoami
```

Log out / log into another account:
```powershell
npx eas-cli logout
npx eas-cli login
```

Link project to the (new) account:
```powershell
npx eas-cli init
```

Build free dev APK:
```powershell
npm run build:android
```

Run Metro (JS/UI changes, no rebuild):
```powershell
npm start
```
