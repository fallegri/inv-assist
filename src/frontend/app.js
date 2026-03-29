const API_URL = 'http://localhost:3000';
let currentProjectId = null;
const token = 'fake-jwt-token';

document.getElementById('btnNewProject').addEventListener('click', async () => {
    try {
        const res = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        currentProjectId = data.projectId;
        addMessage(`Proyecto inicializado con ID: ${currentProjectId}`, 'assistant');

        const ws = new WebSocket('ws://localhost:3000/ws');
        ws.onmessage = (event) => {
            const parsed = JSON.parse(event.data);
            console.log('WS msg:', parsed);
        };
    } catch (e) {
        alert('Error conectando a servidor');
    }
});

document.getElementById('btnUpload').addEventListener('click', async () => {
    if (!currentProjectId) return alert('Inicie un proyecto primero');
    const fileInput = document.getElementById('fileInput');
    const docType = document.getElementById('docType').value;

    if (fileInput.files.length === 0) return alert('Seleccione un archivo');

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const endpoint = docType === 'book' ? `/projects/${currentProjectId}/books` : `/projects/${currentProjectId}/articles`;

    document.getElementById('uploadStatus').innerText = 'Subiendo y procesando...';
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        document.getElementById('uploadStatus').innerText = `Archivo subido.`;
        addMessage(`Archivo ${docType} validado y procesado exitosamente.`, 'assistant');
    } catch (e) {
        document.getElementById('uploadStatus').innerText = 'Error al subir archivo';
    }
});

document.getElementById('btnSend').addEventListener('click', async () => {
    if (!currentProjectId) return alert('Inicie un proyecto primero');
    const input = document.getElementById('userInput');
    const msg = input.value;
    if (!msg) return;

    addMessage(msg, 'user');
    input.value = '';

    try {
        const res = await fetch(`${API_URL}/projects/${currentProjectId}/interview/respond`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        addMessage(data.message, 'assistant');
    } catch (e) {
        addMessage('Error de conexión', 'assistant');
    }
});

document.getElementById('btnExportPdf').addEventListener('click', () => {
    if (!currentProjectId) return alert('Inicie un proyecto primero');
    window.open(`${API_URL}/projects/${currentProjectId}/document/export?format=pdf`, '_blank');
});

document.getElementById('btnExportDocx').addEventListener('click', () => {
    if (!currentProjectId) return alert('Inicie un proyecto primero');
    window.open(`${API_URL}/projects/${currentProjectId}/document/export?format=docx`, '_blank');
});

function addMessage(text, role) {
    const chat = document.getElementById('chatWindow');
    const el = document.createElement('div');
    el.className = `message ${role}`;
    el.innerText = text;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
}
