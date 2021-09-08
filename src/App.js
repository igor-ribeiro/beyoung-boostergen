import { useRef, useState } from "react";
import "./styles.css";

const OPTIONS = [
  { name: "SENSITIVE +", color: "#04A5B4" },
  { name: "OIL CONTROL +", color: "#04A5B4" },
  { name: "UNI TONE +", color: "#A8B2E2" },
  { name: "ANTI-AGING +", color: "#CBA3D8" },
  { name: "DEEP CARE +", color: "#E86B7D" },
  { name: "ANTI-OX VITA C +", color: "#FA9C71" },
  { name: "ACNE FREE +", color: "#D9E246" }
];

const CONFIG = {
  ios: {
    name: "BeyoungBGen",
    service: "FFE0",
    characteristic: "FFE1"
  },
  android: {
    name: "BeyoungBGen",
    service: 0xffe0,
    characteristic: 0xffe1
  }
};

function isIOS() {
  return (
    [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod"
    ].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
}

const PREFIX = [255, 155];

export default function App() {
  const [connected, setConnected] = useState(false);
  const server = useRef(null);
  const device = useRef(null);
  const [events, setEvents] = useState([]);
  const write = useRef(null);
  const os = isIOS() ? "ios" : "android";

  async function connect() {
    const config = CONFIG[os];

    try {
      device.current = await navigator.bluetooth.requestDevice({
        filters: [
          {
            namePrefix: config.name
          }
        ],
        optionalServices: [config.service]
      });
    } catch (e) {
      alert("Erro ao procurar o dispositivo. Mensagem: " + e);
      return;
    }

    if (device.current == null) {
      alert("Nenhum dispositivo encontrado.");
      return;
    }

    device.current.ongattserverdisconnected = () => setConnected(false);

    try {
      server.current = await device.current.gatt.connect();
    } catch (e) {
      alert("Erro ao conectar no dispositivo. Mensagem: " + e);
      return;
    }

    setConnected(true);

    let _service;

    try {
      _service = await server.current.getPrimaryService(config.service);
    } catch (e) {
      alert(`Erro ao acessar o serviço ${config.service}. Mesagem: ${e}`);
      return;
    }

    try {
      write.current = await _service.getCharacteristic(config.characteristic);
    } catch (e) {
      alert(
        `Erro ao acessar a característica ${config.characteristic}. Mesagem: ${e}`
      );
      return;
    }
  }

  function disconnect() {
    device.current.gatt.disconnect();
  }

  function send(value) {
    if (write.current == null) {
      return;
    }

    const encoder = new TextEncoder();

    const encoded =
      typeof value === "string" ? encoder.encode(value) : Uint8Array.of(value);

    const valueToSend = Uint8Array.from([...PREFIX, encoded[0]]);

    try {
      write.current.writeValueWithoutResponse(valueToSend);
      setEvents((old) => [value, ...old]);
      // setEvents((old) => [
      //   `Enviado: ${value} ${JSON.stringify(Array.from(valueToSend))}`,
      //   ...old
      // ]);
    } catch (e) {
      alert(e);
    }
  }

  return (
    <div className={`App ${connected ? "connected" : ""}`}>
      <div className="Header">
        <div className="Content">
          <h1>
            Beyoung Booster<i>Gen</i>
          </h1>
          <p>
            <b>Tipo de dispositivo:</b> {os}
          </p>

          <p>
            <span className=" Status">
              Kit {connected ? "conectado" : "desconectado"}
            </span>
          </p>

          <button onClick={connected ? disconnect : connect}>
            {connected ? "Desconectar" : "Conectar"}
          </button>
        </div>
      </div>

      <div className={`Content ${connected ? "visible" : ""}`}>
        {connected && (
          <>
            <div className="Buttons">
              {OPTIONS.map((option, i) => (
                <button
                  key={option.name}
                  onClick={() => send(i + 1)}
                  style={{
                    "--delay": `${i / 10}s`,
                    backgroundColor: option.color
                  }}
                  className="EventButton"
                >
                  {option.name}
                </button>
              ))}
            </div>

            <div className="Events">
              <h2>Eventos:</h2>
              <ul>
                {events.map((event, i) => (
                  <li key={event + i}>{event}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
