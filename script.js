// Глобальные переменные
let canvas = [];
let currentColor = '#000';
let canvasSize = 10;
let isDrawing = false;

// Цвета
const colors = {
    black: '#000', white: '#fff', red: '#f00', orange: '#f80', 
    yellow: '#ff0', green: '#0f0', salad: '#8f0', skyblue: '#0ff',
    blue: '#00f', purple: '#80f', pink: '#f0f'
};
const colorKeys = Object.keys(colors);

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    setupColorPicker();
    setupSizeControl();
    setupControls();
    createCanvas();
    setupMailSystem();
});

// Выбор цвета
function setupColorPicker() {
    Object.keys(colors).forEach(colorId => {
        const colorDiv = document.getElementById(colorId);
        if (colorDiv) {
            colorDiv.addEventListener('click', () => selectColor(colorId));
        }
    });
    document.getElementById('black').classList.add('selected');
}

function selectColor(colorId) {
    document.querySelectorAll('.input__colors > div').forEach(div => 
        div.classList.remove('selected'));
    document.getElementById(colorId).classList.add('selected');
    currentColor = colors[colorId];
}

// Ползунок размера
function setupSizeControl() {
    const container = document.querySelector('.container__yourdraw');
    const sizeControl = document.createElement('div');
    sizeControl.className = 'size-control';
    sizeControl.innerHTML = `
        <label for="sizeSlider">Размер холста: <span id="sizeValue">10</span>x<span id="sizeValue2">10</span></label>
        <input type="range" id="sizeSlider" class="size-slider" min="5" max="50" value="10">
    `;
    container.insertBefore(sizeControl, document.querySelector('.input__colors'));

    const slider = document.getElementById('sizeSlider');
    slider.addEventListener('input', (e) => {
        canvasSize = parseInt(e.target.value);
        document.getElementById('sizeValue').textContent = canvasSize;
        document.getElementById('sizeValue2').textContent = canvasSize;
        createCanvas();
    });
}

// Кнопки управления
function setupControls() {
    const container = document.querySelector('.container__yourdraw');
    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = `
        <button class="btn" onclick="clearCanvas()">Очистить</button>
        <button class="btn" onclick="saveDrawing()">Сохранить</button>
    `;
    container.insertBefore(controls, document.querySelector('.input__canvas'));
}

// Создание холста
function createCanvas() {
    const canvasEl = document.getElementById('canvas');
    canvasEl.innerHTML = '';
    canvasEl.style.gridTemplateColumns = `repeat(${canvasSize}, 1fr)`;
    
    canvas = [];
    for (let i = 0; i < canvasSize * canvasSize; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.dataset.index = i;
        
        pixel.addEventListener('mousedown', (e) => {
            isDrawing = true;
            paintPixel(e.target);
        });
        
        pixel.addEventListener('mouseenter', (e) => {
            if (isDrawing) paintPixel(e.target);
        });
        
        canvasEl.appendChild(pixel);
        canvas.push('#fff');
    }
    
    document.addEventListener('mouseup', () => isDrawing = false);
}

// Рисование пикселя
function paintPixel(pixel) {
    const index = parseInt(pixel.dataset.index);
    canvas[index] = currentColor;
    pixel.style.backgroundColor = currentColor;
}

// Очистка холста
function clearCanvas() {
    canvas.fill('#fff');
    document.querySelectorAll('.pixel').forEach(pixel => {
        pixel.style.backgroundColor = '#fff';
    });
}

// Кодировка UTF-8 для btoa/atob
function utf8_to_b64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
    return decodeURIComponent(escape(atob(str)));
}

// Сохранение/копирование кода
function saveDrawing() {
    let name = document.getElementById('yourname').value.trim();
    let title = document.getElementById('drawingname').value.trim();

    if (!name) {
        name = prompt("Введите ваше имя:", "") || "Аноним";
        document.getElementById('yourname').value = name;
    }
    if (!title) {
        title = prompt("Введите название рисунка:", "") || "Без названия";
        document.getElementById('drawingname').value = title;
    }

    const colorIndexes = canvas.map(col => 
        colorKeys.indexOf(Object.keys(colors).find(key => colors[key] === col))
    );

    const dataArr = [name, title, canvasSize, ...colorIndexes];
    const code = utf8_to_b64(dataArr.join('|'));

    navigator.clipboard.writeText(code)
        .then(() => alert('Код скопирован в буфер обмена!'))
        .catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Код скопирован в буфер обмена!');
        });
}

// Почтовая система
function setupMailSystem() {
    const mailInput = document.getElementById('mailcode');
    const loadBtn = document.createElement('button');
    loadBtn.className = 'btn';
    loadBtn.textContent = 'Загрузить письмо';
    loadBtn.addEventListener('click', loadLetter);
    
    mailInput.parentNode.insertBefore(loadBtn, document.querySelector('.mail__letters'));

    const saved = JSON.parse(localStorage.getItem('letters') || '[]');
    saved.forEach(data => displayLetter(data));
}

// Загрузка письма
function loadLetter() {
    const code = document.getElementById('mailcode').value.trim();
    if (!code) {
        alert('Введите код письма!');
        return;
    }

    try {
        const dataArr = b64_to_utf8(code).split('|');
        const name = dataArr[0];
        const title = dataArr[1];
        const size = parseInt(dataArr[2]);
        const colorIndexes = dataArr.slice(3).map(i => parseInt(i));
        const canvasData = colorIndexes.map(i => colors[colorKeys[i]]);

        const letterData = { name, title, size, canvas: canvasData };

        const saved = JSON.parse(localStorage.getItem('letters') || '[]');
        saved.unshift(letterData);
        localStorage.setItem('letters', JSON.stringify(saved));

        displayLetter(letterData, true);
    } catch (e) {
        alert('Неверный код письма!');
    }
}

// Отображение письма
function displayLetter(data, prepend = false) {
    const lettersDiv = document.querySelector('.mail__letters');

    const letter = document.createElement('div');
    letter.className = 'letter';
    
    const canvasHtml = createLetterCanvas(data.canvas, data.size);
    
    const exportCode = utf8_to_b64([
        data.name, data.title, data.size, 
        ...data.canvas.map(col => colorKeys.indexOf(
            Object.keys(colors).find(key => colors[key] === col)
        ))
    ].join('|'));
    
    letter.innerHTML = `
        <h3>📧 Новое письмо</h3>
        <p><strong>От:</strong> ${data.name}</p>
        <p><strong>Название:</strong> ${data.title}</p>
        <p><strong>Размер:</strong> ${data.size}x${data.size}</p>
        ${canvasHtml}
        <div style="margin-top:10px; display:flex; gap:5px;">
            <button class="btn" onclick="importDrawing('${exportCode}')">Перенести на холст</button>
            <button class="btn" style="background:#d9534f;" onclick="deleteLetter(this)">Удалить</button>
        </div>
    `;
    
    if (prepend) {
        lettersDiv.prepend(letter);
    } else {
        lettersDiv.appendChild(letter);
    }
}

// Удаление письма
function deleteLetter(button) {
    const letterEl = button.closest('.letter');
    const lettersDiv = document.querySelector('.mail__letters');

    const index = Array.from(lettersDiv.children).indexOf(letterEl);

    letterEl.remove();

    const saved = JSON.parse(localStorage.getItem('letters') || '[]');
    saved.splice(index, 1);
    localStorage.setItem('letters', JSON.stringify(saved));
}

// Мини-холст письма
function createLetterCanvas(canvasData, size) {
    let html = `<div class="letter-canvas" style="grid-template-columns: repeat(${size}, 1fr);">`;
    for (let i = 0; i < canvasData.length; i++) {
        html += `<div class="letter-pixel" style="background: ${canvasData[i]};"></div>`;
    }
    html += '</div>';
    return html;
}

// Импорт рисунка
function importDrawing(code) {
    if (!confirm('Это заменит ваш текущий рисунок и может изменить размер холста. Продолжить?')) {
        return;
    }

    try {
        const dataArr = b64_to_utf8(code).split('|');
        const size = parseInt(dataArr[2]);
        const colorIndexes = dataArr.slice(3).map(i => parseInt(i));
        const canvasData = colorIndexes.map(i => colors[colorKeys[i]]);

        if (size !== canvasSize) {
            canvasSize = size;
            document.getElementById('sizeSlider').value = canvasSize;
            document.getElementById('sizeValue').textContent = canvasSize;
            document.getElementById('sizeValue2').textContent = canvasSize;
            createCanvas();
        }

        canvas = canvasData;
        document.querySelectorAll('.pixel').forEach((pixel, idx) => {
            pixel.style.backgroundColor = canvas[idx];
        });
    } catch {
        alert('Ошибка при импорте кода!');
    }
}
