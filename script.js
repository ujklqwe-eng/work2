// ============================================
// UTILITY FUNCTIONS
// ============================================

// Приводит каждое слово к заглавной букве (Иванов иван иванович -> Иванов Иван Иванович)
function capitalizeWords(str) {
    return str
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map(word => {
            // Работает и с двойными фамилиями через дефис: иванов-петров -> Иванов-Петров
            return word
                .split('-')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join('-');
        })
        .join(' ');
}

function attachAutoCapitalize(input) {
    input.addEventListener('blur', () => {
        if (input.value.trim()) {
            input.value = capitalizeWords(input.value.trim());
        }
    });
}

// ============================================
// STATE
// ============================================
let currentStep = 0;
let objectCounter = 0;
let rowCounter = 0;

// ============================================
// STEP NAVIGATION
// ============================================
function goToStep(step) {
    if (step > currentStep && !validateStep(currentStep)) return;
    showStep(step);
}

function nextStep(step) {
    if (!validateStep(currentStep)) return;
    showStep(step);
}

function prevStep(step) {
    showStep(step);
}

function showStep(step) {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById('step' + step).classList.add('active');

    document.querySelectorAll('.step-circle').forEach((el, i) => {
        el.classList.remove('active', 'completed');
        if (i < step) el.classList.add('completed');
        if (i === step) el.classList.add('active');
    });
    document.querySelectorAll('.step-label').forEach((el, i) => {
        el.classList.toggle('active', i === step);
    });

    currentStep = step;
}

function validateStep(step) {
    if (step === 0) {
        const fio = document.getElementById('fio').value.trim();
        const date = document.getElementById('reportDate').value;
        let valid = true;

        const fioParts = fio.split(/\s+/).filter(Boolean);
        if (fioParts.length < 2) {
            document.getElementById('fio').classList.add('error');
            document.getElementById('fioError').classList.add('show');
            valid = false;
        } else {
            document.getElementById('fio').classList.remove('error');
            document.getElementById('fioError').classList.remove('show');
        }

        if (!date) {
            document.getElementById('reportDate').classList.add('error');
            document.getElementById('dateError').classList.add('show');
            valid = false;
        } else {
            document.getElementById('reportDate').classList.remove('error');
            document.getElementById('dateError').classList.remove('show');
        }

        return valid;
    }

    if (step === 1) {
        const cards = document.querySelectorAll('.object-card');
        let allValid = cards.length > 0;

        cards.forEach(card => {
            if (!validateObjectCard(card)) allValid = false;
        });

        document.getElementById('objectsError').classList.toggle('show', !allValid);
        return allValid;
    }

    return true;
}

// Проверяет одну карточку объекта: название обязательно, все начатые строки
// работ/техники должны быть заполнены полностью, персонал — согласован (если
// указано количество, обязательны и часы; для сварщиков — ещё и фамилии).
function validateObjectCard(card) {
    let valid = true;

    // Название объекта
    const nameInput = card.querySelector('.object-name-input');
    if (!nameInput.value.trim()) {
        nameInput.classList.add('error');
        valid = false;
    } else {
        nameInput.classList.remove('error');
    }

    // Строки видов работ: если заполнено хоть одно поле в строке — обязательны все
    card.querySelectorAll('.work-row').forEach(row => {
        const nameEl = row.querySelector('.work-name-input');
        const unitEl = row.querySelector('.work-unit-input');
        const qtyEl = row.querySelector('.work-qty-input');
        const anyFilled = nameEl.value.trim() || unitEl.value.trim() || qtyEl.value.trim();

        [nameEl, unitEl, qtyEl].forEach(el => el.classList.remove('error'));

        if (anyFilled) {
            if (!nameEl.value.trim()) { nameEl.classList.add('error'); valid = false; }
            if (!qtyEl.value.trim() || Number(qtyEl.value) <= 0) { qtyEl.classList.add('error'); valid = false; }
        }
    });

    // Строки техники: аналогично, плюс госномер необязателен
    card.querySelectorAll('.transport-row-dyn').forEach(row => {
        const nameEl = row.querySelector('.transport-name-input');
        const hoursEl = row.querySelector('.transport-hours-input');
        const anyFilled = nameEl.value.trim() || hoursEl.value.trim();

        [nameEl, hoursEl].forEach(el => el.classList.remove('error'));

        if (anyFilled) {
            if (!nameEl.value.trim()) { nameEl.classList.add('error'); valid = false; }
            if (!hoursEl.value.trim() || Number(hoursEl.value) <= 0) { hoursEl.classList.add('error'); valid = false; }
        }
    });

    // Монтажники: количество и часы — только вместе
    const mCount = card.querySelector('.mounters-count');
    const mHours = card.querySelector('.mounters-hours');
    mCount.classList.remove('error');
    mHours.classList.remove('error');
    if (mCount.value.trim() || mHours.value.trim()) {
        if (!mCount.value.trim() || Number(mCount.value) <= 0) { mCount.classList.add('error'); valid = false; }
        if (!mHours.value.trim() || Number(mHours.value) <= 0) { mHours.classList.add('error'); valid = false; }
    }

    // Сварщики: количество, часы и фамилии — только вместе
    const wCount = card.querySelector('.welders-count');
    const wHours = card.querySelector('.welders-hours');
    const wSurnames = card.querySelector('.welders-surnames');
    wCount.classList.remove('error');
    wHours.classList.remove('error');
    wSurnames.classList.remove('error');
    if (wCount.value.trim() || wHours.value.trim() || wSurnames.value.trim()) {
        if (!wCount.value.trim() || Number(wCount.value) <= 0) { wCount.classList.add('error'); valid = false; }
        if (!wHours.value.trim() || Number(wHours.value) <= 0) { wHours.classList.add('error'); valid = false; }
        if (!wSurnames.value.trim()) { wSurnames.classList.add('error'); valid = false; }
    }

    card.querySelector('.object-card-error').classList.toggle('show', !valid);
    return valid;
}

// ============================================
// OBJECT CARDS
// ============================================
function addObject() {
    objectCounter++;
    const objId = objectCounter;

    const card = document.createElement('div');
    card.className = 'object-card';
    card.dataset.objId = objId;
    card.innerHTML = `
        <div class="object-card-header">
            <h3>🏗 Объект</h3>
            <button type="button" class="remove-object-btn" onclick="removeObject(${objId})" title="Удалить объект">×</button>
        </div>

        <div class="form-group">
            <label>Название объекта <span class="required">*</span></label>
            <input type="text" class="object-name-input" list="objectsList" placeholder="Выберите из списка или впишите свой">
        </div>

        <div class="sub-section-title">🔧 Виды работ</div>
        <div class="work-rows-container" id="workRows-${objId}"></div>
        <button type="button" class="btn-add" onclick="addWorkRow(${objId})">➕ Добавить вид работ</button>

        <div class="sub-section-title">🚗 Техника</div>
        <div class="transport-rows-container" id="transportRows-${objId}"></div>
        <button type="button" class="btn-add" onclick="addTransportRowDyn(${objId})">➕ Добавить технику</button>

        <div class="sub-section-title">👷 Персонал</div>
        <div class="worker-section">
            <div class="worker-section-title">🔧 Монтажники</div>
            <div class="worker-row">
                <div>
                    <label>Количество</label>
                    <input type="number" class="mounters-count" placeholder="0" min="0" step="1">
                </div>
                <div>
                    <label>Часы работы</label>
                    <input type="number" class="mounters-hours" placeholder="Например: 8" min="0" step="0.5">
                </div>
            </div>
        </div>
        <div class="worker-section">
            <div class="worker-section-title">🔥 Сварщики</div>
            <div class="worker-row">
                <div>
                    <label>Количество</label>
                    <input type="number" class="welders-count" placeholder="0" min="0" step="1">
                </div>
                <div>
                    <label>Часы работы</label>
                    <input type="number" class="welders-hours" placeholder="Например: 8" min="0" step="0.5">
                </div>
            </div>
            <div class="form-group" style="margin-top:12px;">
                <label>Фамилии сварщиков</label>
                <input type="text" class="worker-surnames-input welders-surnames" placeholder="Иванов, Петров">
            </div>
        </div>

        <div class="form-group">
            <label>Проблемные вопросы</label>
            <textarea class="problems-input" placeholder="Что помешало / что нужно решить"></textarea>
        </div>
        <div class="form-group">
            <label>Свободный комментарий</label>
            <textarea class="comment-input" placeholder="Любые дополнительные детали"></textarea>
        </div>

        <div class="error-message object-card-error">❌ Проверьте отмеченные поля в этом объекте</div>
    `;

    document.getElementById('objectsContainer').appendChild(card);
    addWorkRow(objId);
    addTransportRowDyn(objId);
    attachAutoCapitalize(card.querySelector('.welders-surnames'));
    updateObjectTitles();
}

function removeObject(objId) {
    const card = document.querySelector(`.object-card[data-obj-id="${objId}"]`);
    if (card) card.remove();
    updateObjectTitles();
}

function updateObjectTitles() {
    const cards = document.querySelectorAll('.object-card');
    cards.forEach((card, i) => {
        card.querySelector('.object-card-header h3').textContent = `🏗 Объект #${i + 1}`;
        card.querySelector('.remove-object-btn').style.visibility = cards.length > 1 ? 'visible' : 'hidden';
    });
}

// ============================================
// WORK ROWS
// ============================================
function addWorkRow(objId) {
    rowCounter++;
    const rowId = rowCounter;
    const container = document.getElementById(`workRows-${objId}`);

    const row = document.createElement('div');
    row.className = 'work-row';
    row.dataset.rowId = rowId;
    row.innerHTML = `
        <input type="text" class="work-name-input" list="workTypesList" placeholder="Вид работ">
        <input type="text" class="work-unit-input" placeholder="Ед." style="width:70px">
        <input type="number" class="work-qty-input" placeholder="Кол-во" min="0" step="0.1">
        <button type="button" class="remove-row-btn" onclick="removeRow(this)" title="Удалить">×</button>
    `;
    container.appendChild(row);
}

function addTransportRowDyn(objId) {
    rowCounter++;
    const rowId = rowCounter;
    const container = document.getElementById(`transportRows-${objId}`);

    const row = document.createElement('div');
    row.className = 'transport-row-dyn';
    row.dataset.rowId = rowId;
    row.innerHTML = `
        <input type="text" class="transport-name-input" list="transportList" placeholder="Транспорт / техника">
        <input type="text" class="transport-gosnumber-input" placeholder="Госномер">
        <input type="number" class="transport-hours-input" placeholder="Часы" min="0" step="0.5">
        <button type="button" class="remove-row-btn" onclick="removeRow(this)" title="Удалить">×</button>
    `;
    container.appendChild(row);
}

function removeRow(btn) {
    btn.parentElement.remove();
}

// ============================================
// DATA COLLECTION
// ============================================
function collectData() {
    const fio = capitalizeWords(document.getElementById('fio').value.trim());
    const date = document.getElementById('reportDate').value;

    const objects = [];
    document.querySelectorAll('.object-card').forEach(card => {
        const objectName = card.querySelector('.object-name-input').value.trim();
        if (!objectName) return;

        const works = [];
        card.querySelectorAll('.work-row').forEach(row => {
            const name = row.querySelector('.work-name-input').value.trim();
            const unit = row.querySelector('.work-unit-input').value.trim();
            const qty = row.querySelector('.work-qty-input').value.trim();
            if (name && qty) works.push({ name, unit, qty });
        });

        const transport = [];
        card.querySelectorAll('.transport-row-dyn').forEach(row => {
            const name = row.querySelector('.transport-name-input').value.trim();
            const gosNumber = row.querySelector('.transport-gosnumber-input').value.trim();
            const hours = row.querySelector('.transport-hours-input').value.trim();
            if (name && hours) transport.push({ name, gosNumber, hours });
        });

        const mountersCount = card.querySelector('.mounters-count').value.trim();
        const mountersHours = card.querySelector('.mounters-hours').value.trim();
        const weldersCount = card.querySelector('.welders-count').value.trim();
        const weldersHours = card.querySelector('.welders-hours').value.trim();
        const weldersSurnames = capitalizeWords(card.querySelector('.welders-surnames').value.trim());

        const problems = card.querySelector('.problems-input').value.trim();
        const comment = card.querySelector('.comment-input').value.trim();

        objects.push({
            object: objectName,
            works,
            transport,
            mounters: { count: mountersCount, hours: mountersHours },
            welders: { count: weldersCount, hours: weldersHours, surnames: weldersSurnames },
            problems,
            comment
        });
    });

    return { fio, date, objects };
}

// ============================================
// REVIEW MODAL
// ============================================
function openReview() {
    if (!validateStep(0) || !validateStep(1)) {
        alert('Пожалуйста, заполните обязательные поля перед проверкой отчета.');
        return;
    }

    const data = collectData();
    const body = document.getElementById('reviewBody');
    let html = '';

    html += `<div class="review-item"><span class="review-label">👤 ФИО</span><div class="review-value">${escapeHtml(data.fio)}</div></div>`;
    html += `<div class="review-item"><span class="review-label">🕐 Дата отчёта</span><div class="review-value">${escapeHtml(data.date)}</div></div>`;

    data.objects.forEach((obj, i) => {
        html += `<div class="review-item"><span class="review-label">🏗 Объект #${i + 1}</span><div class="review-value">${escapeHtml(obj.object)}</div>`;

        if (obj.works.length) {
            html += `<div class="review-sub">`;
            obj.works.forEach(w => {
                html += `<div class="review-sub-item">🔧 ${escapeHtml(w.name)}: ${escapeHtml(w.qty)} ${escapeHtml(w.unit)}</div>`;
            });
            html += `</div>`;
        }

        if (obj.transport.length) {
            html += `<div class="review-sub">`;
            obj.transport.forEach(t => {
                const gos = t.gosNumber ? ` (${escapeHtml(t.gosNumber)})` : '';
                html += `<div class="review-sub-item">🚗 ${escapeHtml(t.name)}${gos}: ${escapeHtml(t.hours)} ч.</div>`;
            });
            html += `</div>`;
        }

        if (obj.mounters.count || obj.mounters.hours) {
            html += `<div class="review-sub"><div class="review-sub-item">🔧 Монтажники: ${escapeHtml(obj.mounters.count || '0')} чел. — ${escapeHtml(obj.mounters.hours || '0')} ч.</div></div>`;
        }
        if (obj.welders.count || obj.welders.hours) {
            html += `<div class="review-sub"><div class="review-sub-item">🔥 Сварщики: ${escapeHtml(obj.welders.count || '0')} чел. — ${escapeHtml(obj.welders.hours || '0')} ч.${obj.welders.surnames ? ' (' + escapeHtml(obj.welders.surnames) + ')' : ''}</div></div>`;
        }
        if (obj.problems) {
            html += `<div class="review-sub"><div class="review-sub-item">⚠️ Проблемы: ${escapeHtml(obj.problems)}</div></div>`;
        }
        if (obj.comment) {
            html += `<div class="review-sub"><div class="review-sub-item">💬 Комментарий: ${escapeHtml(obj.comment)}</div></div>`;
        }

        html += `</div>`;
    });

    body.innerHTML = html;
    document.getElementById('reviewModal').classList.add('show');
}

function closeReview() {
    document.getElementById('reviewModal').classList.remove('show');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================
// SUBMIT
// ============================================
function submitReport() {
    if (!validateStep(0) || !validateStep(1)) {
        alert('Пожалуйста, заполните обязательные поля.');
        return;
    }

    const data = collectData();

    document.getElementById('resultContent').innerHTML =
        `<div class="result-item"><span class="label">ФИО:</span> <span class="value">${escapeHtml(data.fio)}</span></div>` +
        `<div class="result-item"><span class="label">Дата:</span> <span class="value">${escapeHtml(data.date)}</span></div>` +
        `<div class="result-item"><span class="label">Объектов в отчёте:</span> <span class="value">${data.objects.length}</span></div>`;
    document.getElementById('resultBlock').classList.add('show');
    document.getElementById('successMessage').classList.add('show');

    console.log('📊 ПОЛНЫЙ ОТЧЕТ:', data);

    closeReview();

    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitBtn').textContent = '✅ Отправлено!';

    if (window.Telegram && window.Telegram.WebApp) {
        try {
            Telegram.WebApp.sendData(JSON.stringify(data));
        } catch (e) {
            console.error('Ошибка отправки в Telegram:', e);
        }
    }

    setTimeout(() => {
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('submitBtn').textContent = '📤 Отправить';
        if (window.Telegram && window.Telegram.WebApp) {
            Telegram.WebApp.close();
        }
    }, 1200);
}

// ============================================
// INIT
// ============================================
if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

document.getElementById('addObjectBtn').addEventListener('click', addObject);
document.getElementById('reviewBtn').addEventListener('click', openReview);
document.getElementById('submitBtn').addEventListener('click', submitReport);
document.getElementById('confirmSubmitBtn').addEventListener('click', submitReport);

attachAutoCapitalize(document.getElementById('fio'));

// Дата по умолчанию — сегодня
document.getElementById('reportDate').valueAsDate = new Date();

// Стартовый объект
addObject();
