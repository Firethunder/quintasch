# Deployment-Anleitung für quintasch.robedit.de

Diese Anleitung beschreibt das schlüsselfertige Deployment von **Quintasch V2** auf deinem VPS unter der Domain **`quintasch.robedit.de`** mit dem Backend unter **`api-quintasch.robedit.de`**.

---

## 1. Übersicht der Komponenten

* **Frontend (PWA):** `https://quintasch.robedit.de` (statisches Webhosting via Caddy)
* **Backend (PocketBase):** `https://api-quintasch.robedit.de` (Reverse-Proxy zu lokalem PocketBase Port 8090)
* **Datenbank-Schema:** [`pb_schema.json`](../pb_schema.json) (Zweigeteilte Architektur: Session vs. Global)

---

## 2. PocketBase Schema importieren

1. Öffne dein PocketBase Admin Dashboard: `https://api-quintasch.robedit.de/_/`
2. Navigiere zu **Settings ➔ Sync / Import collections**.
3. Lade die Datei [`pb_schema.json`](../pb_schema.json) hoch oder füge den Inhalt per Copy-Paste ein.
4. Klicke auf **Review and import**.
   * *Ergebnis:* Die Collections `rooms`, `players`, `rolls`, `system_rulesets` und `custom_rulesets` sind mit den richtigen Feldern und Sicherheitsregeln eingerichtet.

---

## 3. Caddy Webserver Konfiguration (`/etc/caddy/Caddyfile`)

Füge folgende Blöcke in dein `/etc/caddy/Caddyfile` auf dem Server ein:

```caddy
# 1. Frontend PWA
quintasch.robedit.de {
    root * /var/www/quintasch
    file_server
    try_files {path} /index.html

    # Security & Caching Headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Gzip / Zstandard Kompression
    encode zstd gzip
}

# 2. PocketBase API & Realtime SSE
api-quintasch.robedit.de {
    reverse_proxy 127.0.0.1:8090 {
        # Ungepufferte Echtzeit-Übertragung für Server-Sent Events (SSE)
        flush_interval -1
    }
}
```

Anschließend Caddy neu laden:
```bash
sudo systemctl reload caddy
```

---

## 4. Frontend-Dateien auf den Server übertragen

### Option A: Über das Release-Bundle (`quintasch-release.zip`)
1. Generiere das Bundle lokal:
   * **PowerShell:** `.\scripts\build-dist.ps1`
   * **Bash:** `./scripts/build-dist.sh`
2. Übertrage das Zip auf deinen Server:
   ```bash
   scp quintasch-release.zip user@dein-server.de:/tmp/
   ```
3. Auf dem Server entpacken:
   ```bash
   sudo mkdir -p /var/www/quintasch
   sudo unzip -o /tmp/quintasch-release.zip -d /var/www/quintasch
   sudo chown -R www-data:www-data /var/www/quintasch
   ```

### Option B: Direkt per Git auf dem Server
```bash
cd /var/www/quintasch
git pull origin feature/v2-pocketbase-gameplay
# Alle statischen Dateien liegen direkt im Stammverzeichnis
```

---

## 5. Funktionsprüfung (Checkliste)

1. **Dashboard:** Öffne `https://quintasch.robedit.de` im Browser ➔ Der Verbindungs-Badge oben rechts sollte grün leuchten (**Online: api-quintasch.robedit.de**).
2. **Controller:** Scanne den QR-Code oder öffne `https://quintasch.robedit.de/controller.html` auf dem Smartphone.
3. **PWA-Installation:** Klicke im Smartphone-Browser auf *„Zum Startbildschirm hinzufügen“*.
4. **Custom Rulesets:** Klicke in der Lobby auf *„➕ Neu anlegen“*, um eigene Trinkregeln auf dem Server zu speichern.
