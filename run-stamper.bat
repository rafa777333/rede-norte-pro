@echo off
title Carimbo Oficial RA - Servico Local (Porta 5000)
echo ========================================================
echo    REDE APUCARANA - MICRO-SERVICO DE CARIMBO OFICIAL
echo ========================================================
echo Rodando em http://localhost:5000
echo Endpoint: POST http://localhost:5000/generate
echo Pressione Ctrl+C para encerrar.
echo.

"C:\Users\Radio TV Apucarana\AppData\Local\Programs\Python\Python312\python.exe" -m uvicorn app:app --app-dir services/image-stamper --host 0.0.0.0 --port 5000 --reload
