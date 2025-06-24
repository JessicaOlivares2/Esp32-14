// --- Configuración MQTT ---
const mqttBroker = "broker.hivemq.com";
const mqttPort = 8000; // ¡Importante! Usar el puerto WebSocket para navegadores (normalmente 8000 o 8884 para SSL)
const mqttTopic = "empresa/horno/datos"; // El mismo tema al que tu ESP32 está publicando
const clientId = "WebClient-" + Math.random().toString(16).substr(2, 8); // Un ID de cliente único

// Elementos HTML donde mostraremos los datos
const temperatureDisplay = document.getElementById("temperatureDisplay");
const humidityDisplay = document.getElementById("humidityDisplay");
const mqttStatus = document.getElementById("mqttStatus");

let client; // Variable para almacenar el objeto cliente MQTT

// --- Funciones para la Conexión MQTT ---

// Función para establecer la conexión con el broker MQTT
function setupMQTTClient() {
    // Intentamos conectar usando MQTT.js
    // El 'path' '/mqtt' es común para los WebSockets de HiveMQ
    client = mqtt.connect(`ws://${mqttBroker}:${mqttPort}/mqtt`, { clientId: clientId });

    // Eventos del cliente MQTT
    client.on('connect', onConnect);
    client.on('message', onMessageArrived);
    client.on('error', onError);
    client.on('close', onConnectionLost); // Cuando la conexión se cierra inesperadamente
    client.on('reconnect', onReconnect);
}

// Se ejecuta cuando el cliente se conecta exitosamente
function onConnect() {
    console.log("¡Conectado al broker MQTT!");
    mqttStatus.innerText = "Estado: Conectado al broker";
    mqttStatus.classList.remove('error');
    mqttStatus.classList.add('connected');
    
    // Suscribirse al tema donde el ESP32 publica los datos
    client.subscribe(mqttTopic, (err) => {
        if (!err) {
            console.log("Suscrito al tema: " + mqttTopic);
        } else {
            console.error("Error al suscribirse:", err);
            mqttStatus.innerText = "Error al suscribirse al tema.";
            mqttStatus.classList.remove('connected');
            mqttStatus.classList.add('error');
        }
    });
}

// Se ejecuta cuando llega un mensaje MQTT
function onMessageArrived(topic, message) {
    console.log("Mensaje recibido en [" + topic + "]: " + message.toString());
    try {
        // Parsear el mensaje como JSON
        const data = JSON.parse(message.toString());
        const temperature = data.temperatura;
        const humidity = data.humedad;

        // Actualizar los elementos HTML con los nuevos datos
        if (temperature !== undefined) {
            temperatureDisplay.innerText = `${temperature.toFixed(2)} °C`; // Formatear a 2 decimales
        }
        if (humidity !== undefined) {
            humidityDisplay.innerText = `${humidity.toFixed(2)} %`; // Formatear a 2 decimales
        }

    } catch (e) {
        console.error("Error al analizar el mensaje JSON:", e);
        mqttStatus.innerText = "Error: Datos recibidos no válidos.";
        mqttStatus.classList.remove('connected');
        mqttStatus.classList.add('error');
    }
}

// Se ejecuta si hay un error en la conexión MQTT
function onError(error) {
    console.error("Error en la conexión MQTT:", error);
    mqttStatus.innerText = `Error de conexión: ${error.message || error}`;
    mqttStatus.classList.remove('connected');
    mqttStatus.classList.add('error');
}

// Se ejecuta cuando la conexión se pierde
function onConnectionLost(packet) {
    console.log("Conexión MQTT perdida:", packet);
    mqttStatus.innerText = "Estado: Conexión perdida. Reconectando...";
    mqttStatus.classList.remove('connected');
    mqttStatus.classList.add('error');
}

// Se ejecuta al intentar reconectar
function onReconnect() {
    console.log("Intentando reconectar al broker MQTT...");
    mqttStatus.innerText = "Estado: Reconectando...";
    mqttStatus.classList.remove('connected');
    mqttStatus.classList.add('error');
}

// --- Inicialización ---
// Llamar a esta función cuando la página se carga completamente
window.onload = setupMQTTClient;