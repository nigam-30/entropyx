@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   Compiling CryptoKey C++ Backend Microservice...
echo ========================================================

set "COMPILER="
if exist "C:\Program Files\JetBrains\CLion 2025.3.2\bin\mingw\bin\g++.exe" (
    set "COMPILER=C:\Program Files\JetBrains\CLion 2025.3.2\bin\mingw\bin\g++.exe"
    set "PATH=C:\Program Files\JetBrains\CLion 2025.3.2\bin\mingw\bin;%PATH%"
) else (
    set "COMPILER=g++"
)

if not exist bin mkdir bin
if not exist data mkdir data

echo [Info] Using compiler: "!COMPILER!"

"!COMPILER!" -std=c++17 -O3 -Wall ^
    -Iinclude ^
    src\sha256.cpp ^
    src\bloom_filter.cpp ^
    src\entropy.cpp ^
    src\generator.cpp ^
    src\deduplication.cpp ^
    src\breach_database.cpp ^
    src\lfsr.cpp ^
    src\main.cpp ^
    -static-libgcc -static-libstdc++ ^
    -lws2_32 -ladvapi32 ^
    -o bin\server.exe

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo [SUCCESS] Standalone C++ Microservice compiled to bin\server.exe!
    echo ========================================================
) else (
    echo.
    echo [ERROR] Compilation failed!
    exit /b 1
)
