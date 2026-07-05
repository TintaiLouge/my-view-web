@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ============================================
echo   JINGYU - Deploy
echo ============================================

:: [1/4] Set git proxy
echo [1/4] Setting proxy...
git config http.proxy http://127.0.0.1:7897

:: [2/4] Generate static files
echo [2/4] Generating static files...
set "HEXO_BIN=%~dp0node_modules\.bin\hexo.cmd"
if exist "!HEXO_BIN!" (
    call "!HEXO_BIN!" generate
) else (
    call hexo.cmd generate 2>nul || call hexo generate 2>nul || call npx.cmd hexo generate
)
if !errorlevel! neq 0 (
    echo [FAIL] Generation failed!
    pause
    exit /b 1
)
echo [OK] Generated.

:: [3/4] Deploy to GitHub Pages
echo [3/4] Deploying to GitHub Pages...
if exist "!HEXO_BIN!" (
    call "!HEXO_BIN!" deploy
) else (
    call hexo.cmd deploy 2>nul || call hexo deploy 2>nul || call npx.cmd hexo deploy
)
if !errorlevel! neq 0 (
    echo [FAIL] Deploy failed, retrying...
    if exist "!HEXO_BIN!" (
        call "!HEXO_BIN!" deploy
    ) else (
        call hexo.cmd deploy 2>nul || call hexo deploy
    )
)
echo [OK] Deployed.

:: [4/4] Push source code
echo [4/4] Pushing source...
git add -A
git commit -m "update %date:~0,10% %time:~0,8%"
git push origin main
if !errorlevel! neq 0 (
    echo [WARN] Source push failed, but site may still be deployed.
)

echo ============================================
echo   Done! https://tintailouge.github.io/my-view-web/
echo ============================================
pause
