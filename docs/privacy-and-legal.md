# Rechtliche Hinweise, Datenschutz & DSGVO-Konformität (Quintasch)

Diese Dokumentation erläutert die rechtlichen und datenschutzbezogenen Grundlagen des Projekts **Quintasch** (PWA & Backend).

---

## 1. Grundsatz: Privacy by Design & Datensparsamkeit

Quintasch wurde von Grund auf nach dem Prinzip der **Datensparsamkeit (Art. 5 Abs. 1 lit. c DSGVO)** und **Privacy by Design (Art. 25 DSGVO)** entwickelt:

* **Keine Benutzerkonten:** Es gibt keine Registrierung, keine Passwörter und keine Erfassung von Klarnamen, E-Mail-Adressen oder Telefonnummern.
* **Pseudonyme Session- und Creator-Tokens:**
  * Jeder Spieler erhält beim ersten Aufruf eine zufällig generierte UUID (player_token) im lokalen Browser-Speicher (localStorage), um sich innerhalb einer Spielsitzung wiederzuverbinden.
  * Für das Erstellen eigener Regelsätze wird ein separater, anonymer creator_token im localStorage hinterlegt.
* **Keine Tracking- oder Werbe-Cookies:** Die Anwendung setzt keine Cookies zur Verfolgung von Nutzern ein.
* **Vollständige Selbstbündelung (Keine US-CDNs):**
  * Alle Bibliotheken (PocketBase JS SDK, QRCode) sowie Schriftarten (Orbitron, Rajdhani) werden direkt vom eigenen Server / Repository ausgeliefert.
  * Beim Laden der Web-App werden keine IP-Adressen an Drittanbieter (wie Google Fonts oder externe CDN-Betreiber) übertragen.

---

## 2. Server-Logs & IP-Adressen als personenbezogene Daten

Auch wenn eine Anwendung selbst keine Nutzerdaten erfasst, fallen bei der Bereitstellung über einen Webserver (z. B. Caddy, Nginx oder PocketBase) technisch bedingt Verbindungsdaten an:

* **Erhobene Daten:** IP-Adresse des anfragenden Geräts, Datum und Uhrzeit des Zugriffs, übertragene Datenmenge, Referrer-URL, HTTP-Statuscode und User-Agent des Browsers.
* **Zweck der Verarbeitung (Art. 6 Abs. 1 lit. f DSGVO):**
  * Sicherstellung eines störungsfreien Verbindungsaufbaus und stabiler Echtzeitverbindungen (Server-Sent Events / SSE).
  * Gewährleistung der Systemsicherheit und Schutz vor Denial-of-Service-Angriffen (DDoS) sowie Missbrauch.
* **Speicherdauer:** Server-Logdateien werden standardmäßig nur temporär zur Fehleranalyse vorgehalten und nach Ablauf der Aufbewahrungsfrist automatisch gelöscht bzw. rotiert. Es erfolgt keine Verknüpfung der IP-Adressen mit Spieler-Nicknames oder Spielverläufen.

---

## 3. Geltungsbereich: Haushaltsprivileg vs. Öffentlicher Webserver

* **Haushaltsprivileg (Art. 2 Abs. 2 lit. c DSGVO):**
  * Die DSGVO gilt grundsätzlich nicht für die Datenverarbeitung durch natürliche Personen zur Ausübung ausschließlich persönlicher oder familiärer Tätigkeiten (z. B. Quintasch im rein privaten Heim-WLAN ohne Internetfreigabe).
* **Öffentlicher Server / Public Deployment:**
  * Sobald das Frontend oder Backend öffentlich über das Internet (z. B. via GitHub Pages oder VPS unter einer öffentlichen Domain wie pi-quintasch.robedit.de) bereitgestellt wird und von Dritten aufgerufen werden kann, entfällt das reine Haushaltsprivileg.
  * In diesem Fall besteht die gesetzliche Informationspflicht nach **Art. 13 DSGVO** (Datenschutzerklärung) sowie die Pflicht zur Anbieterkennzeichnung (Impressum).

---

## 4. Recht auf Löschung (Right to be Forgotten, Art. 17 DSGVO)

Quintasch bietet dem Spielleiter (Host) jederzeit die Möglichkeit zur vollständigen Datenbereinigung:
* Über den Button **„Spielraum & Daten endgültig löschen“** im Dashboard werden der Raum sowie alle dazugehörigen Spieler- und Wurfprotokolle unwiderruflich aus der PocketBase-Datenbank entfernt.

---

## 5. Impressum & Anbieterkennzeichnung (nach DDG)

* Bei rein privaten, nicht-kommerziellen Open-Source-Projekten ohne Gewinnerzielungsabsicht gelten erleichterte Anforderungen. Dennoch wird für öffentlich gehostete Instanzen oder Store-Releases eine transparente Kontaktmöglichkeit bereitgestellt.
* In den Einstellungen und im Footer des Dashboards und Controllers kann der Betreiber der Instanz seine Kontaktadresse / sein Impressum hinterlegen bzw. einsehen.
