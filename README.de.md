# Steuerung der Fronius Inverter-Batterie mit ioBroker

Dieses Skript ermöglicht die Steuerung der Inverter-Batterie (in diesem Fall Fronius und BYD Battery), um die Hausbatterie basierend auf dynamischen Strompreisen (Awattar), Wetterbedingungen und der Verwendung der EV-Wallbox zu verwalten. Der Code wird unter ioBroker ausgeführt.

## Voraussetzungen

Um dieses Projekt erfolgreich zu verwenden, müssen folgende Voraussetzungen erfüllt sein:

- ioBroker: Stellen Sie sicher, dass ioBroker auf Ihrem System installiert und eingerichtet ist.

- **Inverter-Adapter:** Der Inverter-Adapter muss in ioBroker installiert sein, um auf den Fronius-Inverter zuzugreifen.

- **Wallbox-Adapter:** Der Wallbox-Adapter muss in ioBroker installiert sein, um Informationen zur Ladung des Elektrofahrzeugs zu erhalten.

## Verwendung

1. Öffnen Sie die ioBroker-Oberfläche.

2. Erstellen Sie eine neue JavaScript-Instanz oder ein Skript.

3. Kopieren Sie den Inhalt der Datei `charge.js` und fügen Sie ihn in Ihre ioBroker-Instanz ein.

4. Speichern und aktivieren Sie das Skript.

5. Überwachen Sie die Ausführung des Skripts über die ioBroker-Oberfläche.

## Steuerlogik

Die Steuerlogik in diesem Projekt besteht aus zwei Hauptteilen:

1. **Stoppen der Batterieentladung beim Laden des Autos:** Die Steuerlogik stellt sicher, dass die Hausbatterie nicht entladen wird, wenn das Elektroauto geladen wird.

2. **Verwendung der Awattar-Strompreise zum Laden und Entladen der Batterie:** Die Steuerlogik verwendet die Awattar-Strompreise, um zu entscheiden, wann die Batterie geladen oder entladen werden soll. Die Logik berücksichtigt auch Wetterbedingungen und die aktuelle Uhrzeit.

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Weitere Informationen finden Sie in der [Lizenzdatei](LICENSE).

